const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const QRCode = require("qrcode");
const { useMongoAuthState, clearMongoAuthState } = require("./mongoAuthState");

let sock = null;
let currentQR = null;
let isConnected = false;
let isStarting = false; // ✅ Guard: prevents concurrent startWhatsApp calls

const lidToPhoneMap = {};
const pendingLidMessages = {};
const messageStore = {};

const getLidToPhoneMap = () => lidToPhoneMap;
const getQR = () => currentQR;
const getConnectionStatus = () => isConnected;
const getSock = () => sock;

// ─────────────────────────────────────────────────────────────
// Disconnect reasons that should NOT trigger a reconnect
// ─────────────────────────────────────────────────────────────
const FATAL_DISCONNECT_REASONS = new Set([
  DisconnectReason.loggedOut,       // 401 — user logged out
  DisconnectReason.badSession,      // session is corrupt
  DisconnectReason.multideviceMismatch,
]);

// Stream conflict codes that mean another device took over.
// These require a FULL auth clear + fresh QR, not just a reconnect.
const CONFLICT_CODES = new Set([
  "device_removed",
  "conflict",
]);

const startWhatsApp = async (onMessageReceived) => {
  // ✅ Prevent double-start (e.g. Render spinning up two pods briefly)
  if (isStarting) {
    console.log("⚠️ startWhatsApp already in progress, skipping duplicate call");
    return;
  }
  isStarting = true;

  try {
    const { state, saveCreds } = await useMongoAuthState();
    const { version } = await fetchLatestBaileysVersion();
    console.log("Using WA version:", version);

    sock = makeWASocket({
      version,
      auth: state,
      browser: ["WhatsApp Interview Bot", "Chrome", "1.0.0"],
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      // ✅ Needed so Baileys can re-encrypt retried messages
      getMessage: async (key) => {
        return messageStore[key.id] || { conversation: "" };
      },
    });

    // ─── LID → phone mapping via raw WS frames ───────────────
    sock.ws.on("CB:message", (node) => {
      try {
        const attrs = node?.attrs;
        if (attrs?.sender_pn && attrs?.from?.endsWith("@lid")) {
          _handleLidResolution(attrs.from, attrs.sender_pn, onMessageReceived);
        }
      } catch (e) {
        console.error("CB:message error:", e);
      }
    });

    sock.ws.on("CB:receipt", (node) => {
      try {
        const attrs = node?.attrs;
        if (attrs?.sender_pn && attrs?.from?.endsWith("@lid")) {
          _handleLidResolution(attrs.from, attrs.sender_pn, onMessageReceived);
        }
      } catch (_) {}
    });

    sock.ev.on("creds.update", saveCreds);

    // ─── Connection lifecycle ─────────────────────────────────
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        isConnected = false;
        try {
          currentQR = await QRCode.toDataURL(qr);
        } catch (err) {
          console.error("QR generation failed:", err);
          currentQR = null;
        }
      }

      if (connection === "close") {
        isConnected = false;
        currentQR = null;
        isStarting = false; // reset guard so reconnect can proceed

        const err = lastDisconnect?.error;
        const statusCode = err?.output?.statusCode;

        // ✅ Check for conflict / device_removed in the error data
        const conflictType =
          err?.data?.content?.[0]?.attrs?.type ||   // nested XML attr
          err?.output?.payload?.type ||
          "";

        const isConflict = CONFLICT_CODES.has(conflictType);
        const isFatal = FATAL_DISCONNECT_REASONS.has(statusCode) || isConflict;

        console.log(
          `❌ Connection closed. Code: ${statusCode}, Conflict: ${isConflict}, Fatal: ${isFatal}`
        );

        if (isConflict) {
          // Another device/session took over. Clear stale auth so the
          // next connection starts fresh and shows a new QR.
          console.log("🔴 Device conflict detected — clearing auth state for clean re-pair");
          await clearMongoAuthState();
        }

        if (!isFatal) {
          console.log("🔄 Reconnecting in 5 seconds...");
          setTimeout(() => startWhatsApp(onMessageReceived), 5000);
        } else {
          console.log("🛑 Fatal disconnect — waiting for manual re-pair via QR");
          // Don't reconnect; the frontend will show QR once startWhatsApp
          // is called again (e.g. after logout endpoint or manual restart)
          if (isConflict) {
            // Auto-restart so a fresh QR is generated immediately
            setTimeout(() => startWhatsApp(onMessageReceived), 3000);
          }
        }
        return;
      }

      if (connection === "open") {
        isConnected = true;
        currentQR = null;
        isStarting = false;
        console.log("✅ WhatsApp connected successfully!");

        // Preload LID map from DB
        setTimeout(async () => {
          try {
            const Candidate = require("../models/Candidate");
            const candidates = await Candidate.find({ lid: { $ne: null } });
            console.log(`🔄 Preloading lid map for ${candidates.length} candidates...`);
            for (const c of candidates) {
              lidToPhoneMap[c.lid] = `${c.phone}@s.whatsapp.net`;
            }
          } catch (e) {
            console.error("Failed to preload lid map:", e.message);
          }
        }, 3000);
      }
    });

    // ─── Incoming messages ────────────────────────────────────
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      for (const msg of messages) {
        if (msg.key?.id && msg.message) {
          messageStore[msg.key.id] = msg.message;
        }
      }

      if (type !== "notify") return;

      const msg = messages[0];
      if (!msg?.message || msg.key.fromMe) return;

      const rawJid = msg.key.remoteJid;
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      if (!text || !rawJid || rawJid.includes("@g.us")) return;

      if (rawJid.endsWith("@lid")) {
        if (lidToPhoneMap[rawJid]) {
          const from = lidToPhoneMap[rawJid];
          console.log(`✅ Resolved ${rawJid} -> ${from}`);
          await onMessageReceived(from, text);
        } else {
          console.log(`⏳ Queuing @lid message from "${msg.pushName}": ${text}`);
          if (!pendingLidMessages[rawJid]) {
            pendingLidMessages[rawJid] = { texts: [], pushName: msg.pushName };
          }
          pendingLidMessages[rawJid].texts.push(text);

          // DB fallback after 8 seconds
          setTimeout(() => _dbFallbackLid(rawJid, onMessageReceived), 8000);
        }
        return;
      }

      console.log(`📩 Message from ${rawJid}: ${text}`);
      await onMessageReceived(rawJid, text);
    });
  } catch (err) {
    isStarting = false;
    console.error("❌ startWhatsApp error:", err.message);
    // Retry after 10 seconds on unexpected startup errors
    setTimeout(() => startWhatsApp(onMessageReceived), 10000);
  }
};

// ─── Helpers ──────────────────────────────────────────────────

const _handleLidResolution = (lid, phone, onMessageReceived) => {
  if (!lidToPhoneMap[lid]) {
    lidToPhoneMap[lid] = phone;
    console.log(`🗺️ Mapped: ${lid} -> ${phone}`);
  }
  if (pendingLidMessages[lid]) {
    const { texts } = pendingLidMessages[lid];
    delete pendingLidMessages[lid];
    console.log(`📬 Flushing ${texts.length} queued message(s) for ${phone}`);
    for (const text of texts) {
      onMessageReceived(phone, text);
    }
  }
};

const _dbFallbackLid = async (rawJid, onMessageReceived) => {
  if (!pendingLidMessages[rawJid]) return;
  console.log(`⏰ LID timeout for ${rawJid}, trying DB fallback...`);
  try {
    const Candidate = require("../models/Candidate");
    const candidate = await Candidate.findOne({ lid: rawJid });
    if (candidate) {
      const phone = `${candidate.phone}@s.whatsapp.net`;
      lidToPhoneMap[rawJid] = phone;
      console.log(`🗺️ DB fallback resolved: ${rawJid} -> ${phone}`);
      const pending = pendingLidMessages[rawJid];
      delete pendingLidMessages[rawJid];
      for (const t of pending.texts) {
        await onMessageReceived(phone, t);
      }
    } else {
      console.log(`❌ Could not resolve ${rawJid} — no DB record`);
      delete pendingLidMessages[rawJid];
    }
  } catch (e) {
    console.error("DB fallback error:", e.message);
  }
};

// ─── Send ─────────────────────────────────────────────────────

const sendMessage = async (to, message) => {
  if (!sock || !isConnected) {
    console.error("WhatsApp not connected yet!");
    return null;
  }

  const formattedNumber =
    to.includes("@s.whatsapp.net") || to.includes("@lid")
      ? to
      : `${to}@s.whatsapp.net`;

  try {
    const result = await sock.sendMessage(formattedNumber, { text: message });

    if (
      result?.key?.remoteJid?.endsWith("@lid") &&
      !formattedNumber.endsWith("@lid")
    ) {
      const lid = result.key.remoteJid;
      lidToPhoneMap[lid] = formattedNumber;
      console.log(`🗺️ Mapped from send: ${lid} -> ${formattedNumber}`);
      return lid;
    }

    console.log(`✅ Message sent to ${to}`);
    return null;
  } catch (err) {
    console.error(`❌ Failed to send to ${to}:`, err.message);
    return null;
  }
};

module.exports = {
  startWhatsApp,
  sendMessage,
  getLidToPhoneMap,
  getQR,
  getConnectionStatus,
  getSock,
};