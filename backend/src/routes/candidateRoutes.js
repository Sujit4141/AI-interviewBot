const express = require("express");
const router = express.Router();
const {
  addCandidate,
  getCandidates,
  deleteCandidate,
  retryCandidate,
} = require("../controllers/candidateController");

router.post("/add", addCandidate);
router.get("/all", getCandidates);
router.delete("/delete/:id", deleteCandidate);
router.post("/retry/:id", retryCandidate);

router.post("/fix-lid", async (req, res) => {
  try {
    const Candidate = require("mongoose").model("Candidate");
    await Candidate.updateOne(
      { phone: req.body.phone },
      { $set: { lid: req.body.lid } }
    );
    res.json({ message: "Lid updated!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

