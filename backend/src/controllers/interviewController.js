const Interview = require("../models/Interview");
const Candidate = require("../models/Candidate");
const Slot = require("../models/Slot");
const { getAIResponse } = require("../services/geminiService");
const { sendMessage, getLidToPhoneMap } = require("../services/whatsappService");

// Rejection keywords
const REJECTION_KEYWORDS = [
  "not interested", "no thanks", "nope", "not comfortable",
  "don't want", "dont want", "withdraw", "cancel", "not joining",
  "not available", "won't come", "will not come", "not coming",
  "already have a job", "got a job", "no need", "not looking",
  "please remove", "remove me", "unsubscribe", "stop",
  "cancel my interview", "don't want to give", "dont want to give",
  "not want to", "i quit", "drop it", "drop my", "leave it",
  "not interested anymore", "no longer interested", "changed my mind",
  "not joining", "won't be joining", "will not be joining",
  "nahi dena", "nhi dena", "nahi aana", "nhi aana",
  "interview nahi", "interview nhi", "mujhe nahi", "mujhe nhi",
  "cancel karo", "band karo", "rehne do",
];

const CANCEL_AFTER_CONFIRM_KEYWORDS = [
  "cancel", "reschedule", "change", "postpone",
  "nahi aana", "nhi aana", "change karna", "cancel karna",
  "aur din", "koi aur", "different slot", "slot change",
  "date change", "time change", "reschedule karna",
  "nahi ho payega", "nhi ho payega", "possible nahi",
];

const isRejected = (aiReply, userMessage) => {
  const lowerUser = userMessage.toLowerCase();
  const lowerAI = aiReply.toLowerCase();

  console.log("🔍 Checking rejection...");
  console.log("👤 User said:", lowerUser);
  console.log("🤖 AI replied:", lowerAI.substring(0, 150));

  const userRejected = REJECTION_KEYWORDS.some(k => {
    if (lowerUser.includes(k)) {
      console.log(`🎯 Rejection keyword matched: "${k}"`);
      return true;
    }
    return false;
  });

  const aiAcknowledgedRejection =
    lowerAI.includes("wish you all the best") ||
    lowerAI.includes("noted that you wish to withdraw") ||
    lowerAI.includes("noted your decision to withdraw") ||
    lowerAI.includes("withdraw your application") ||
    lowerAI.includes("respect your decision") ||
    lowerAI.includes("all the best in your job search") ||
    lowerAI.includes("all the best in your future") ||
    lowerAI.includes("have noted your decision") ||
    lowerAI.includes("i've noted") ||
    lowerAI.includes("best in your future endeavors") ||
    lowerAI.includes("best of luck in your future") ||
    lowerAI.includes("your application has been withdrawn") ||
    lowerAI.includes("we understand your decision") ||
    (lowerAI.includes("understood") && lowerAI.includes("withdraw")) ||
    (lowerAI.includes("noted") && lowerAI.includes("withdraw")) ||
    (lowerAI.includes("noted") && lowerAI.includes("decision")) ||
    (lowerAI.includes("wish") && lowerAI.includes("best") && !lowerAI.includes("slot") && !lowerAI.includes("interview"));

  if (aiAcknowledgedRejection) {
    console.log("🎯 AI acknowledged rejection");
  }

  const result = userRejected || aiAcknowledgedRejection;
  console.log("🔍 isRejected result:", result);
  return result;
};

const handleIncomingMessage = async (from, text) => {
  try {
    let candidate = null;

    if (from.endsWith("@lid")) {
      candidate = await Candidate.findOne({ lid: from });

      if (!candidate) {
        const lidMap = getLidToPhoneMap();
        const phone = lidMap[from]?.replace("@s.whatsapp.net", "");
        if (phone) {
          candidate = await Candidate.findOne({ phone });
          if (candidate && !candidate.lid) {
            candidate.lid = from;
            await candidate.save();
            console.log(`📌 Late-saved lid ${from} for ${candidate.name}`);
          }
        }

        if (!candidate) {
          console.log(`Unknown number messaged: ${from}`);
          return;
        }
      }

      const lidMap = getLidToPhoneMap();
      if (!lidMap[from]) {
        lidMap[from] = `${candidate.phone}@s.whatsapp.net`;
        console.log(`🗺️ Runtime mapped from DB: ${from} -> ${candidate.phone}`);
      }

    } else {
      const phone = from.replace("@s.whatsapp.net", "");
      candidate = await Candidate.findOne({ phone });

      if (!candidate) {
        console.log(`Unknown number messaged: ${from}`);
        return;
      }
    }

    // Handle already rejected candidate messaging again
    if (candidate.status === "rejected") {
      await sendMessage(from,
        `Hey! Pyren here from PickYourHire. 👋\n\nYour application was previously withdrawn.\n\nIf you'd like to reapply, please contact our hiring team directly!`
      );
      return;
    }

    // Find pending interview
    const interview = await Interview.findOne({
      candidate: candidate._id,
      status: "pending",
    });

    // No pending interview found
    if (!interview) {
      if (candidate.status === "confirmed") {
        // Check if they want to cancel or reschedule after confirmation
        const wantsCancellation = CANCEL_AFTER_CONFIRM_KEYWORDS.some(k =>
          text.toLowerCase().includes(k)
        );

        if (wantsCancellation) {
          console.log(`🔄 ${candidate.name} wants to reschedule after confirmation`);
          await sendMessage(from,
            `Noted! 😊\n\nAapki request humari hiring team tak pahunch gayi hai.\n\nThey will contact you shortly to reschedule. Sorry for the inconvenience!`
          );
        } else {
          // Silently ignore random messages after confirmation
          console.log(`ℹ️ ${candidate.name} messaged after confirmation — ignoring`);
        }
        return;
      }

      await sendMessage(from,
        `Your interview has already been scheduled! ✅\n\nOur team will reach out with further details soon.`
      );
      return;
    }

    // Get available slots
    const slots = await Slot.find({ isBooked: false });

    // Add user message to history
    interview.conversationHistory.push({ role: "user", message: text });

    // Get AI response
    const aiReply = await getAIResponse(interview.conversationHistory, slots);

    // Add AI response to history
    interview.conversationHistory.push({ role: "model", message: aiReply });

    // ✅ Check slot confirmed FIRST
    if (aiReply.includes("SLOT_CONFIRMED:")) {
      const slotNumberMatch = aiReply.match(/SLOT_CONFIRMED:\s*(\d+)/);
      if (slotNumberMatch) {
        const slotIndex = parseInt(slotNumberMatch[1]) - 1;
        const confirmedSlot = slots[slotIndex];

        if (confirmedSlot) {
          confirmedSlot.isBooked = true;
          await confirmedSlot.save();

          interview.slot = confirmedSlot._id;
          interview.status = "confirmed";

          candidate.status = "confirmed";
          await candidate.save();

          console.log(`✅ Interview confirmed for ${candidate.name} on ${confirmedSlot.date} at ${confirmedSlot.time}`);
        }
      }
    }

    // ✅ Check rejection SECOND — only if not already confirmed
    if (interview.status !== "confirmed" && isRejected(aiReply, text)) {
      interview.status = "rejected";
      candidate.status = "rejected";
      await candidate.save();
      console.log(`❌ Candidate ${candidate.name} rejected — status updated to rejected`);
    }

    // ✅ Save interview ONCE after all checks
    await interview.save();

    // Send reply without SLOT_CONFIRMED tag
    const cleanReply = aiReply
  .replace(/SLOT_CONFIRMED:\s*\d+/g, "")
  .replace(/SLOT_CANCELLED/g, "")
  .trim();
    await sendMessage(from, cleanReply);

  } catch (err) {
    console.error("Error handling message:", err);
  }
};

const getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find()
      .populate("candidate")
      .populate("slot")
      .sort({ createdAt: -1 });
    res.status(200).json(interviews);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const addSlot = async (req, res) => {
  try {
    const { date, time } = req.body;
    const slot = await Slot.create({ date, time });
    res.status(201).json({ message: "Slot added!", slot });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getSlots = async (req, res) => {
  try {
    const slots = await Slot.find().sort({ createdAt: -1 });
    res.status(200).json(slots);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await Slot.findById(id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });
    if (slot.isBooked) return res.status(400).json({ message: "Cannot delete a booked slot!" });
    await Slot.findByIdAndDelete(id);
    console.log(`🗑️ Slot deleted: ${slot.date} at ${slot.time}`);
    res.status(200).json({ message: "Slot deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  handleIncomingMessage,
  getInterviews,
  addSlot,
  getSlots,
  deleteSlot,
};