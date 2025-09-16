import express from "express";
import { registerUser, loginUser,getAllUsernames } from "../controllers/userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/list", getAllUsernames);

export default router;
