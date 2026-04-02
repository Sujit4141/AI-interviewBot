 
const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true
  },
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Slot",
    required: false
  },
  
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled","rejected"],
    default: "pending"
  },
  conversationHistory: [
    {
      role: { type: String, enum: ["user", "model"] },
      message: { type: String }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Interview", interviewSchema);