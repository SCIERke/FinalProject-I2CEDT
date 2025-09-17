import asyncHandler from "express-async-handler";
import Topic from "../models/Topic.js";
import Submission from "../models/Submission.js";

/** GET /api/topics/random
 *  Return one random topic that has NOT been submitted yet.
 *  If all used, return null (client can choose to allow re-use).
 */
export const getRandomTopic = asyncHandler(async (req, res) => {
  // get topic IDs that have submissions
  const usedTopicIds = await Submission.distinct("topic");
  const filter = usedTopicIds.length ? { _id: { $nin: usedTopicIds } } : {};
  const count = await Topic.countDocuments(filter);
  if (count === 0) {
    return res.json({ topic: null });
  }
  const rand = Math.floor(Math.random() * count);
  const topicDoc = await Topic.findOne(filter).skip(rand).lean();
  res.json({ topic: topicDoc.text, topicId: topicDoc._id });
});

/** GET /api/topics all (optional) */
export const getAllTopics = asyncHandler(async (req, res) => {
  const topics = await Topic.find().lean();
  res.json({ topics });
});
