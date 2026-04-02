 
const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  isBooked: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Slot", slotSchema);