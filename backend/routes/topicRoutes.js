import express from "express";
import {
  getRandomTopic,
  getAllTopics,
} from "../controllers/topicController.js";

const router = express.Router();

router.get("/random", getRandomTopic);
router.get("/", getAllTopics);

export default router;
