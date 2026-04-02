require("dotenv").config();

const express = require("express");
const cors = require("cors");
const main = require("./config/db");
const candidateRoutes = require("./routes/candidateRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
const { startWhatsApp } = require("./services/whatsappService");
const { handleIncomingMessage } = require("./controllers/interviewController");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/candidates", candidateRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/whatsapp", whatsappRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running! 🚀",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.send("WhatsApp Interview Scheduler Backend is Running! 🚀");
});

(async () => {
  try {
    await main();
    console.log("✅ DB connected!");

    await startWhatsApp(handleIncomingMessage);
    console.log("✅ WhatsApp bot starting...");

    app.listen(process.env.PORT || 5000, () => {
      console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
    });
  } catch (err) {
    console.log(err);
  }
})();