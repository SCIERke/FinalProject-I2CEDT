import mongoose from "mongoose";

const topicSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model("Topic", topicSchema);
