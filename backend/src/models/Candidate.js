const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────
// Candidate Schema
// ─────────────────────────────────────────────────────────────
// ✅ FIX: Added `lid` field so WhatsApp LID → phone mappings are
//    persisted across server restarts. The field is indexed for
//    fast lookups in the DB fallback path.
// ─────────────────────────────────────────────────────────────

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    jobRole: {
      type: String,
      trim: true,
      default: null,
    },

    // ✅ NEW: WhatsApp Linked-Device Identity (LID) JID for this candidate.
    // Example value: "276342776041621@lid"
    // Populated automatically the first time a message is sent to or
    // received from this candidate while LID mode is active.
    lid: {
      type: String,
      default: null,
      index: true,   // speeds up _dbFallbackLid lookups
    },

    // Add any other candidate fields your app uses below this line.
    // e.g. email, resumeUrl, status, etc.
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Candidate || mongoose.model("Candidate", candidateSchema);