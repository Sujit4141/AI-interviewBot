const express = require("express");
const router = express.Router();
const { getQR, getConnectionStatus, getSock } = require("../services/whatsappService");
const { startWhatsApp } = require("../services/whatsappService");
const { handleIncomingMessage } = require("../controllers/interviewController");
const { clearMongoAuthState } = require("../services/mongoAuthState");

// GET /api/whatsapp/status
router.get("/status", (req, res) => {
  const connected = getConnectionStatus();
  const qr = getQR();
  res.json({
    connected,
    hasQR: !connected && !!qr,
  });
});

// GET /api/whatsapp/qr
router.get("/qr", (req, res) => {
  const qr = getQR();
  if (!qr) {
    return res.status(200).json({ qr: null, message: "No QR available yet." });
  }
  res.json({ qr });
});

// POST /api/whatsapp/logout
// ✅ Properly disconnects, clears ALL auth (including Signal sessions),
//    then restarts so a fresh QR is generated.
router.post("/logout", async (req, res) => {
  try {
    const sock = getSock();

    // Gracefully disconnect first — ignore errors if already disconnected
    if (sock) {
      try {
        await sock.logout();
      } catch (_) {}
    }

    // ✅ Clear everything: creds + all Signal session keys + app state keys
    await clearMongoAuthState();

    // Restart after a short delay so the new socket gets a clean state
    setTimeout(() => {
      startWhatsApp(handleIncomingMessage);
    }, 2000);

    res.json({
      message: "Logged out successfully! New QR will appear in a moment.",
    });
  } catch (err) {
    console.error("Logout error:", err.message);
    res.status(500).json({ message: "Logout failed", error: err.message });
  }
});

// POST /api/whatsapp/pair  (pairing code alternative to QR)
router.post("/pair", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone number required!" });

    const sock = getSock();
    if (!sock) return res.status(400).json({ message: "WhatsApp not started yet!" });

    const code = await sock.requestPairingCode(phone);
    res.json({ code });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate pairing code", error: err.message });
  }
});

module.exports = router;