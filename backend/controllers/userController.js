// import User from "../models/User.js";

// // REGISTER new user
// export const registerUser = async(req, res) => {
//     try {
//         console.log("Incoming register body:", req.body);
//         const { username, password } = req.body;

//         if (!username || !password) {
//             return res.status(400).json({ message: "Username and password are required" });
//         }

//         const existingUser = await User.findOne({ "auth.username": username });
//         console.log("Existing user check:", existingUser);
//         if (existingUser) {
//             return res.status(400).json({ message: "Username already taken" });
//         }
//         const sessionId = uuidv4();
//         const newUser = new User({ auth: { username, password, sessionId } });
//         await newUser.save();
//         console.log("Saved user:", newUser);


//         return res.status(201).json({ message: "User registered successfully", user: newUser, sessionId });
//     } catch (error) {
//         console.error("Register error:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// };

// // LOGIN user
// export const loginUser = async(req, res) => {
//     try {
//         const { username, password } = req.body;

//         if (!username || !password) {
//             return res.status(400).json({ message: "Username and password are required" });
//         }

//         const user = await User.findOne({ "auth.username": username });
//         if (!user || user.auth.password !== password) {
//             return res.status(401).json({ message: "Invalid username or password" });
//         }

//         return res.status(200).json({ message: "Login successful", user });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Server error" });
//     }
// };
// export const getAllUsernames = async(req, res) => {
//     try {
//         // Only return the username field, not password
//         const users = await User.find({}, "auth.username");

//         // Map results into an array of just usernames
//         const usernames = users.map(user => user.auth.username);

//         res.status(200).json({ usernames });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Server error" });
//     }
// };
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";

// REGISTER new user
export const registerUser = async(req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const existingUser = await User.findOne({ "auth.username": username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already taken" });
        }


        const sessionId = uuidv4();
        const newUser = new User({ auth: { username, password, sessionID: sessionId } });
        await newUser.save();
        console.log("test")


        // ส่ง cookie กลับ client ด้วย sessionId
        res.cookie("session_id", sessionId, {
            httpOnly: true, // client JS ไม่เข้าถึง cookie ได้ (เพิ่มความปลอดภัย)
            maxAge: 24 * 60 * 60 * 1000, // 1 วัน
            sameSite: "lax", // ป้องกัน CSRF เบื้องต้น
        });

        return res.status(201).json({ message: "User registered successfully", username });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// LOGIN user
export const loginUser = async(req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const user = await User.findOne({ "auth.username": username });
        if (!user || user.auth.password !== password) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // สร้าง session ใหม่ทุกครั้งที่ login
        const sessionId = uuidv4();
        user.auth.sessionId = sessionId;
        await user.save();

        // ส่ง cookie กลับ client
        res.cookie("session_id", sessionId, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: "lax",
        });

        return res.status(200).json({ message: "Login successful", username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Middleware ตรวจ session
export const authMiddleware = async(req, res, next) => {
    const sessionId = req.cookies ? req.cookies.session_id : undefined;
    if (!sessionId) return res.status(401).json({ message: "No session" });

    const user = await User.findOne({ "auth.sessionId": sessionId });
    if (!user) return res.status(401).json({ message: "Invalid session" });

    req.user = user; // attach user info ให้ request
    next();
};