import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/db.js";
import topicRoutes from "./routes/topicRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import userRoutes from "./routes/userRoutes.js"; 

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 5000;
const MONGO_URI =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/essay_checker";

await connectDB(MONGO_URI);

// API routes
app.use("/api/topics", topicRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/users", userRoutes);

// Serve frontend static files
// const __filename = fileURLToPath(
//     import.meta.url);
// const __dirname = path.dirname(__filename);

// // // Serve frontend static
// // const frontendPath = path.join(__dirname, "..", "frontend");
// // app.use(express.static(frontendPath));
// // // SPA fallback
// // app.get("*", (req, res) => {
// //     res.sendFile(path.join(frontendPath, "index.html"));
// // });

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    const status =
        res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(status).json({ message: err.message || "Server error" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});