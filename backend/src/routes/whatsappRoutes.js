const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { getQR, getConnectionStatus, getSock } = require("../services/whatsappService");
const { startWhatsApp } = require("../services/whatsappService");
const { handleIncomingMessage } = require("../controllers/interviewController");

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
    return res.status(200).json({ qr: null, message: "No QR available." });
  }
  // qr is already a base64 data URL from whatsappService
  res.json({ qr });
});

// POST /api/whatsapp/logout
router.post("/logout", async (req, res) => {
  try {
    const sock = getSock();
    if (sock) {
      try { await sock.logout(); } catch (e) {}
    }

    // Delete session from MongoDB
    const AuthModel = mongoose.model("AuthState");
    await AuthModel.deleteMany({});
    console.log("🗑️ MongoDB auth session deleted");

    // Restart WhatsApp
    setTimeout(() => {
      startWhatsApp(handleIncomingMessage);
    }, 2000);

    res.json({ message: "Logged out successfully! New QR will be generated shortly." });
  } catch (err) {
    res.status(500).json({ message: "Logout failed", error: err.message });
  }
});

// POST /api/whatsapp/pair
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