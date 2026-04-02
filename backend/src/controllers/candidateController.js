const Candidate = require("../models/Candidate");
const Slot = require("../models/Slot");
const Interview = require("../models/Interview");
const { sendMessage } = require("../services/whatsappService");

const addCandidate = async (req, res) => {
  try {
    const { name, phone, jobRole } = req.body;

    const existing = await Candidate.findOne({ phone });
    if (existing) {
      return res.status(400).json({ message: "Candidate already exists" });
    }

    const candidate = await Candidate.create({ name, phone, jobRole });

    const slots = await Slot.find({ isBooked: false });
    if (slots.length === 0) {
      return res.status(400).json({ message: "No available slots. Please add slots first." });
    }

    await Interview.create({
      candidate: candidate._id,
      slot: slots[0]._id,
      status: "pending",
      conversationHistory: [],
    });

    const slotsText = slots
      .map((s, i) => `${i + 1}. ${s.date} at ${s.time}`)
      .join("\n");

      const firstMessage = `Hi ${name}! 👋

I'm *Pyren*, your interview scheduling assistant from *PickYourHire*! 🎉

Great news — our team has reviewed your profile for the *${jobRole}* position and you've been shortlisted! Congratulations! 🌟

Here are the available interview slots:
${slotsText}

Just reply with the number of your preferred slot and I'll get you booked right in! 😊

_Replies are monitored by our hiring team_ 🔒`;

    const lid = await sendMessage(phone, firstMessage);

    if (lid) {
      candidate.lid = lid;
      await candidate.save();
      console.log(`📌 Saved lid ${lid} for candidate ${name}`);
    }

    res.status(201).json({
      message: "Candidate added and WhatsApp message sent!",
      candidate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    res.status(200).json(candidates);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findById(id);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    await Interview.deleteMany({ candidate: id });
    await Candidate.findByIdAndDelete(id);

    console.log(`🗑️ Deleted candidate ${candidate.name} and their interviews`);
    res.status(200).json({ message: "Candidate deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const retryCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const slots = await Slot.find({ isBooked: false });
    if (slots.length === 0) {
      return res.status(400).json({ message: "No available slots!" });
    }

    // ✅ Reset candidate status to pending
    candidate.status = "pending";
    await candidate.save();

    // ✅ Delete old interview and create fresh one
    await Interview.deleteMany({ candidate: id });
    await Interview.create({
      candidate: candidate._id,
      slot: slots[0]._id,
      status: "pending",
      conversationHistory: [],
    });

    const slotsText = slots
      .map((s, i) => `${i + 1}. ${s.date} at ${s.time}`)
      .join("\n");

    const retryMessage = `Hi ${candidate.name}!

Pyren here from *PickYourHire* again.

We'd still love to have you for the *${candidate.jobRole}* interview — no pressure at all! 😊

Here are the available slots:
${slotsText}

If any of these work, just reply with the slot number. If not, no worries!`;

    const lid = await sendMessage(candidate.phone, retryMessage);
    if (lid) {
      candidate.lid = lid;
      await candidate.save();
    }

    console.log(`🔄 Retry sent to ${candidate.name} — status reset to pending`);
    res.json({ message: "Retry message sent successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { addCandidate, getCandidates, retryCandidate ,deleteCandidate };