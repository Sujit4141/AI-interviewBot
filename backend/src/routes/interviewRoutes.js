 
const express = require("express");
const router = express.Router();
const {
  getInterviews,
  addSlot,
  deleteSlot,
  getSlots,
} = require("../controllers/interviewController");

router.get("/all", getInterviews);
router.post("/slot/add", addSlot);
router.get("/slot/all", getSlots);
router.delete("/slot/delete/:id", deleteSlot);

module.exports = router;