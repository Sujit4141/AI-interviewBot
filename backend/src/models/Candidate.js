const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  lid: { type: String, default: null },
  jobRole: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "scheduled", "confirmed", "cancelled","rejected"],
    default: "pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("Candidate", candidateSchema);