import asyncHandler from "express-async-handler";
import Submission from "../models/Submission.js";
import Topic from "../models/Topic.js";
import evaluateEssay from "../utils/evaluator.js";

export const submitEssay = asyncHandler(async(req, res) => {
    const { topicId, topic, essay, submissionId, user } = req.body;

    // basic validation: either topicId or topic text must exist
    let topicDoc = null;
    if (topicId) topicDoc = await Topic.findById(topicId);
    if (!topicDoc && topic) {
        topicDoc = await Topic.findOne({ text: topic });
    }
    if (!topicDoc) {
        res.status(400);
        throw new Error("Topic not found (send topicId or existing topic text)");
    }
    if (!essay || !essay.trim()) {
        res.status(400);
        throw new Error("Essay text is required");
    }

    // evaluate
    const result = await evaluateEssay(topicDoc.text, essay);
    console.log(">>>> Result from evaluator:", JSON.stringify(result, null, 2));

    let savedSubmission;
    let statusCode = 201; // 201 Created (default)

    if (submissionId) {
        // --- UPDATE LOGIC ---
        savedSubmission = await Submission.findByIdAndUpdate(
            submissionId, {
                essay,
                result,
                topic: topicDoc._id, // อัปเดต topic เผื่อมีการแก้ไข
            }, { new: true, runValidators: true } // new: true เพื่อให้ return document ใหม่
        ).populate("topic");
        statusCode = 200; // 200 OK
        if (!savedSubmission) {
            res.status(404);
            throw new Error("Submission not found to update");
        }
    } else {
        // --- CREATE LOGIC (ของเดิม) ---
        console.log(user)
        const newSubmission = await Submission.create({
            topic: topicDoc._id,
            essay,
            result: result,
            user
        });
        savedSubmission = await newSubmission.populate("topic");
    }

    // return simplified response for frontend
    res.status(statusCode).json({
        submission: {
            id: savedSubmission._id,
            topic: savedSubmission.topic.text,
            essay: savedSubmission.essay,
            result: result,
        },
        scores: [
            result.scores.taskResponse.score,
            result.scores.coherenceCohesion.score,
            result.scores.lexicalResource.score,
            result.scores.grammaticalRange.score,
        ],
        feedback: {
            taskResponse: result.scores.taskResponse.reasoning,
            coherence: result.scores.coherenceCohesion.reasoning,
            lexical: result.scores.lexicalResource.reasoning,
            grammar: result.scores.grammaticalRange.reasoning,
            overall: result.scores.feedback,
        },
        overallBand: result.scores.overall,
    });
});

export const getHistory = asyncHandler(async(req, res) => {
    // const { username } = req.query.username;
    const username = req.query.username;
    if (!username) {
        return res.status(400).json({ message: "User is required" });
    }
    const subs = await Submission.find({ user: username })
        .populate("topic")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
    const mapped = subs.map((s) => ({
        id: s._id,
        topicId: s.topic ? s.topic._id : null,
        topic: s.topic ? s.topic.text : "(deleted)",
        essay: s.essay,
        result: s.result,
        createdAt: s.createdAt,
    }));
    res.json({ submissions: mapped });
});

// DELETE /api/submissions/:id
export const deleteSubmission = asyncHandler(async(req, res) => {
    const { id } = req.params;
    const sub = await Submission.findById(id);
    if (!sub) {
        res.status(404);
        throw new Error("Submission not found");
    }

    await sub.deleteOne();
    res.status(200).json({ message: "Submission deleted" });
});

// update topic
export const updateTopic = asyncHandler(async(req, res) => {
    const { id } = req.params;
    const { newTopic } = req.body;

    if (!newTopic || !newTopic.trim()) {
        res.status(400);
        throw new Error("newTopic is required");
    }

    const sub = await Submission.findById(id);
    if (!sub) {
        res.status(404);
        throw new Error("Submission not found");
    }

    let topicDoc = await Topic.findOne({ text: newTopic.trim() });
    if (!topicDoc) {
        topicDoc = await Topic.create({ text: newTopic.trim() });
    }

    sub.topic = topicDoc._id;
    await sub.save();

    res.json({ message: "Topic updated", topic: topicDoc.text });
});