import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
    user: { type: String, required: true },
    topic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
        required: true,
    },
    essay: { type: String, required: true },
    result: {
        scores: {
            taskResponse: {
                score: Number,
                feedback: String,
            },
            coherenceCohesion: {
                score: Number,
                feedback: String,
            },
            lexicalResource: {
                score: Number,
                feedback: String,
            },
            grammaticalRange: {
                score: Number,
                feedback: String,
            },
            overall: Number,
            feedback: String, // overall feedback
        },
    },
}, { timestamps: true });

export default mongoose.model("Submission", submissionSchema);