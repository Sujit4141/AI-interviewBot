// const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
// const qrcode = require("qrcode-terminal");
// const path = require("path");

// let sock = null;
// let currentQR = null;
// let isConnected = false;
// const lidToPhoneMap = {};
// const pendingLidMessages = {};
// const messageStore = {};

// const getLidToPhoneMap = () => lidToPhoneMap;
// const getQR = () => currentQR;
// const getConnectionStatus = () => isConnected;
// const getSock = () => sock;

// const startWhatsApp = async (onMessageReceived) => {
//   const { state, saveCreds } = await useMultiFileAuthState(
//     path.join(__dirname, "../../auth_info")
//   );

//   const { version } = await fetchLatestBaileysVersion();
//   console.log("Using WA version:", version);

//   sock = makeWASocket({
//     version,
//     auth: state,
//     browser: ["WhatsApp Interview Bot", "Chrome", "1.0.0"],
//     generateHighQualityLinkPreview: false,
//     syncFullHistory: false,
//     getMessage: async (key) => {
//       return messageStore[key.id] || { conversation: "" };
//     },
//   });

//   sock.ws.on("CB:message", (node) => {
//     try {
//       const attrs = node?.attrs;
//       if (attrs?.sender_pn && attrs?.from?.endsWith("@lid")) {
//         const lid = attrs.from;
//         const phone = attrs.sender_pn;
//         if (!lidToPhoneMap[lid]) {
//           lidToPhoneMap[lid] = phone;
//           console.log(`🗺️ Mapped: ${lid} -> ${phone}`);
//         }
//         if (pendingLidMessages[lid]) {
//           const { texts } = pendingLidMessages[lid];
//           delete pendingLidMessages[lid];
//           console.log(`📬 Flushing ${texts.length} queued message(s) for ${phone}`);
//           for (const text of texts) {
//             onMessageReceived(phone, text);
//           }
//         }
//       }
//     } catch (e) {
//       console.error("CB:message error:", e);
//     }
//   });

//   sock.ws.on("CB:receipt", (node) => {
//     try {
//       const attrs = node?.attrs;
//       if (attrs?.sender_pn && attrs?.from?.endsWith("@lid")) {
//         const lid = attrs.from;
//         const phone = attrs.sender_pn;
//         if (!lidToPhoneMap[lid]) {
//           lidToPhoneMap[lid] = phone;
//           console.log(`🗺️ Receipt mapped: ${lid} -> ${phone}`);
//         }
//         if (pendingLidMessages[lid]) {
//           const { texts } = pendingLidMessages[lid];
//           delete pendingLidMessages[lid];
//           for (const text of texts) {
//             onMessageReceived(phone, text);
//           }
//         }
//       }
//     } catch (e) {}
//   });

//   sock.ev.on("creds.update", saveCreds);

//   sock.ev.on("connection.update", (update) => {
//     const { connection, lastDisconnect, qr } = update;

//     if (qr) {
//       currentQR = qr;
//       isConnected = false;
//       console.log("\n📱 Scan this QR code with your spare WhatsApp:\n");
//       qrcode.generate(qr, { small: true });
//     }

//     if (connection === "close") {
//       isConnected = false;
//       currentQR = null;
//       const statusCode = lastDisconnect?.error?.output?.statusCode;
//       const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
//       console.log("❌ Connection closed. Reconnecting:", shouldReconnect);
//       if (shouldReconnect) startWhatsApp(onMessageReceived);
//     } else if (connection === "open") {
//       isConnected = true;
//       currentQR = null;
//       console.log("✅ WhatsApp connected successfully!");

//       setTimeout(async () => {
//         try {
//           const Candidate = require("../models/Candidate");
//           const candidates = await Candidate.find({ lid: { $ne: null } });
//           console.log(`🔄 Preloading lid map for ${candidates.length} candidates...`);
//           for (const c of candidates) {
//             lidToPhoneMap[c.lid] = `${c.phone}@s.whatsapp.net`;
//             console.log(`✅ Loaded: ${c.lid} -> ${c.phone}`);
//           }
//         } catch (e) {
//           console.error("Failed to preload lid map:", e.message);
//         }
//       }, 3000);
//     }
//   });

//   sock.ev.on("messages.upsert", async ({ messages, type }) => {
//     for (const msg of messages) {
//       if (msg.key?.id && msg.message) {
//         messageStore[msg.key.id] = msg.message;
//       }
//     }

//     if (type !== "notify") return;

//     const msg = messages[0];
//     if (!msg.message || msg.key.fromMe) return;

//     const rawJid = msg.key.remoteJid;
//     const text =
//       msg.message.conversation ||
//       msg.message.extendedTextMessage?.text ||
//       "";

//     if (!text || !rawJid || rawJid.includes("@g.us")) return;

//     if (rawJid.endsWith("@lid")) {
//       if (lidToPhoneMap[rawJid]) {
//         const from = lidToPhoneMap[rawJid];
//         console.log(`✅ Resolved ${rawJid} -> ${from}`);
//         console.log(`📩 Message from ${from}: ${text}`);
//         await onMessageReceived(from, text);
//       } else {
//         console.log(`⏳ Queuing unresolved @lid message from "${msg.pushName}": ${text}`);
//         if (!pendingLidMessages[rawJid]) {
//           pendingLidMessages[rawJid] = { texts: [], pushName: msg.pushName };
//         }
//         pendingLidMessages[rawJid].texts.push(text);

//         setTimeout(async () => {
//           if (!pendingLidMessages[rawJid]) return;
//           console.log(`⏰ Receipt timeout for ${rawJid}, trying DB fallback...`);
//           try {
//             const Candidate = require("../models/Candidate");
//             const candidate = await Candidate.findOne({ lid: rawJid });
//             if (candidate) {
//               const phone = `${candidate.phone}@s.whatsapp.net`;
//               lidToPhoneMap[rawJid] = phone;
//               console.log(`🗺️ DB fallback resolved: ${rawJid} -> ${phone}`);
//               const pending = pendingLidMessages[rawJid];
//               delete pendingLidMessages[rawJid];
//               for (const t of pending.texts) {
//                 await onMessageReceived(phone, t);
//               }
//             } else {
//               console.log(`❌ Could not resolve ${rawJid} — no DB record`);
//               delete pendingLidMessages[rawJid];
//             }
//           } catch (e) {
//             console.error("DB fallback error:", e.message);
//           }
//         }, 8000);
//       }
//       return;
//     }

//     console.log(`📩 Message from ${rawJid}: ${text}`);
//     await onMessageReceived(rawJid, text);
//   });
// };

// const sendMessage = async (to, message) => {
//   if (!sock) {
//     console.error("WhatsApp not connected yet!");
//     return null;
//   }

//   let formattedNumber;
//   if (to.includes("@s.whatsapp.net") || to.includes("@lid")) {
//     formattedNumber = to;
//   } else {
//     formattedNumber = `${to}@s.whatsapp.net`;
//   }

//   try {
//     const result = await sock.sendMessage(formattedNumber, { text: message });
//     console.log(`🔍 Send result remoteJid: ${result?.key?.remoteJid}`);

//     if (result?.key?.remoteJid?.endsWith("@lid") && !formattedNumber.endsWith("@lid")) {
//       const lid = result.key.remoteJid;
//       lidToPhoneMap[lid] = formattedNumber;
//       console.log(`🗺️ Mapped from send: ${lid} -> ${formattedNumber}`);
//       return lid;
//     }

//     console.log(`✅ Message sent to ${to}`);
//     return null;
//   } catch (err) {
//     console.error(`❌ Failed to send to ${to}:`, err.message);
//     return null;
//   }
// };

// module.exports = {
//   startWhatsApp,
//   sendMessage,
//   getLidToPhoneMap,
//   getQR,
//   getConnectionStatus,
//   getSock,
// };


const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const QRCode = require("qrcode"); // ✅ FIX
const path = require("path");

let sock = null;
let currentQR = null;
let isConnected = false;
const lidToPhoneMap = {};
const pendingLidMessages = {};
const messageStore = {};

const getLidToPhoneMap = () => lidToPhoneMap;
const getQR = () => currentQR;
const getConnectionStatus = () => isConnected;
const getSock = () => sock;

const startWhatsApp = async (onMessageReceived) => {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(__dirname, "../../auth_info")
  );

  const { version } = await fetchLatestBaileysVersion();
  console.log("Using WA version:", version);

  sock = makeWASocket({
    version,
    auth: state,
    browser: ["WhatsApp Interview Bot", "Chrome", "1.0.0"],
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    getMessage: async (key) => {
      return messageStore[key.id] || { conversation: "" };
    },
  });

  sock.ws.on("CB:message", (node) => {
    try {
      const attrs = node?.attrs;
      if (attrs?.sender_pn && attrs?.from?.endsWith("@lid")) {
        const lid = attrs.from;
        const phone = attrs.sender_pn;
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
      }
    } catch (e) {
      console.error("CB:message error:", e);
    }
  });

  sock.ws.on("CB:receipt", (node) => {
    try {
      const attrs = node?.attrs;
      if (attrs?.sender_pn && attrs?.from?.endsWith("@lid")) {
        const lid = attrs.from;
        const phone = attrs.sender_pn;
        if (!lidToPhoneMap[lid]) {
          lidToPhoneMap[lid] = phone;
          console.log(`🗺️ Receipt mapped: ${lid} -> ${phone}`);
        }
        if (pendingLidMessages[lid]) {
          const { texts } = pendingLidMessages[lid];
          delete pendingLidMessages[lid];
          for (const text of texts) {
            onMessageReceived(phone, text);
          }
        }
      }
    } catch (e) {}
  });

  sock.ev.on("creds.update", saveCreds);

  // ✅ FIX: made async + QR converted to base64
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      isConnected = false;

      try {
        const qrBase64 = await QRCode.toDataURL(qr);
        currentQR = qrBase64; // ✅ THIS FIXES FRONTEND
      } catch (err) {
        console.error("QR generation failed:", err);
        currentQR = null;
      }
    }

    if (connection === "close") {
      isConnected = false;
      currentQR = null;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log("❌ Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) startWhatsApp(onMessageReceived);
    } else if (connection === "open") {
      isConnected = true;
      currentQR = null;
      console.log("✅ WhatsApp connected successfully!");

      setTimeout(async () => {
        try {
          const Candidate = require("../models/Candidate");
          const candidates = await Candidate.find({ lid: { $ne: null } });
          console.log(`🔄 Preloading lid map for ${candidates.length} candidates...`);
          for (const c of candidates) {
            lidToPhoneMap[c.lid] = `${c.phone}@s.whatsapp.net`;
            console.log(`✅ Loaded: ${c.lid} -> ${c.phone}`);
          }
        } catch (e) {
          console.error("Failed to preload lid map:", e.message);
        }
      }, 3000);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    for (const msg of messages) {
      if (msg.key?.id && msg.message) {
        messageStore[msg.key.id] = msg.message;
      }
    }

    if (type !== "notify") return;

    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

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
        console.log(`📩 Message from ${from}: ${text}`);
        await onMessageReceived(from, text);
      } else {
        console.log(`⏳ Queuing unresolved @lid message from "${msg.pushName}": ${text}`);
        if (!pendingLidMessages[rawJid]) {
          pendingLidMessages[rawJid] = { texts: [], pushName: msg.pushName };
        }
        pendingLidMessages[rawJid].texts.push(text);

        setTimeout(async () => {
          if (!pendingLidMessages[rawJid]) return;
          console.log(`⏰ Receipt timeout for ${rawJid}, trying DB fallback...`);
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
              console.log(`❌ Could not resolve ${rawJid}`);
              delete pendingLidMessages[rawJid];
            }
          } catch (e) {
            console.error("DB fallback error:", e.message);
          }
        }, 8000);
      }
      return;
    }

    console.log(`📩 Message from ${rawJid}: ${text}`);
    await onMessageReceived(rawJid, text);
  });
};

const sendMessage = async (to, message) => {
  if (!sock) {
    console.error("WhatsApp not connected yet!");
    return null;
  }

  let formattedNumber;
  if (to.includes("@s.whatsapp.net") || to.includes("@lid")) {
    formattedNumber = to;
  } else {
    formattedNumber = `${to}@s.whatsapp.net`;
  }

  try {
    const result = await sock.sendMessage(formattedNumber, { text: message });

    if (result?.key?.remoteJid?.endsWith("@lid") && !formattedNumber.endsWith("@lid")) {
      const lid = result.key.remoteJid;
      lidToPhoneMap[lid] = formattedNumber;
      return lid;
    }

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