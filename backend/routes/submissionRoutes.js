import express from "express";
import {
  submitEssay,
  getHistory,
  deleteSubmission,
  updateTopic,
} from "../controllers/submissionController.js";
import asyncHandler from "express-async-handler";
import Submission from "../models/Submission.js";

const router = express.Router();

router.post("/", submitEssay);
router.get("/history", getHistory);
router.delete("/:id", deleteSubmission);
router.patch("/:id/topic", updateTopic);

// ลบ submission
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sub = await Submission.findById(id);
    if (!sub) {
      res.status(404);
      throw new Error("Submission not found");
    }
    await sub.deleteOne();
    res.json({ message: "Deleted" });
  })
);

export default router;
