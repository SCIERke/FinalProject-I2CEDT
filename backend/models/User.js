import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    auth: { username: String, password: String },
});

export default mongoose.model("User", userSchema);
