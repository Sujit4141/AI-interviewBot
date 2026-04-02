const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { getQR, getConnectionStatus, getSock } = require("../services/whatsappService");
const { startWhatsApp } = require("../services/whatsappService");
const { handleIncomingMessage } = require("../controllers/interviewController");

// GET /api/whatsapp/status
router.get("/status", (req, res) => {
  res.json({
    connected: getConnectionStatus(),
    hasQR: !!getQR(),
  });
});

// GET /api/whatsapp/qr
router.get("/qr", async (req, res) => {
  const qr = getQR();
  if (!qr) {
    return res.status(404).json({ message: "No QR available. Already connected or not started yet." });
  }
  try {
    const qrImage = await QRCode.toDataURL(qr);
    res.json({ qr: qrImage });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate QR", error: err.message });
  }
});

// POST /api/whatsapp/logout
router.post("/logout", async (req, res) => {
  try {
    const sock = getSock();
    if (sock) {
      try { await sock.logout(); } catch (e) {}
    }

    // Delete auth_info folder
    const authPath = path.join(__dirname, "../../auth_info");
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
      console.log("🗑️ auth_info deleted");
    }

    // Restart WhatsApp
    setTimeout(() => {
      startWhatsApp(handleIncomingMessage);
    }, 2000);

    res.json({ message: "Logged out successfully! New QR will be generated shortly." });
  } catch (err) {
    res.status(500).json({ message: "Logout failed", error: err.message });
  }
});

module.exports = router;