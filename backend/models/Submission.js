import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
    auth: { username: String },
    topic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
        required: true,
    },
    essay: { type: String, required: true },
    result: {
        criteria: {
            taskResponse: {
                score: Number,
                feedback: String,
            },
            coherence: {
                score: Number,
                feedback: String,
            },
            lexical: {
                score: Number,
                feedback: String,
            },
            grammar: {
                score: Number,
                feedback: String,
            },
        },
        overallBand: Number,
        feedback: String, // overall feedback
        raw: mongoose.Schema.Types.Mixed, // raw response from evaluator
    },
}, { timestamps: true });

export default mongoose.model("Submission", submissionSchema);