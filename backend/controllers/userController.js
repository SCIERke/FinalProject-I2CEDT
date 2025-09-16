import User from "../models/User.js";

// REGISTER new user
export const registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const existingUser = await User.findOne({ "auth.username": username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const newUser = new User({ auth: { username, password } });
    await newUser.save();

    return res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN user
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ "auth.username": username });
    if (!user || user.auth.password !== password) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    return res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
export const getAllUsernames = async (req, res) => {
  try {
    // Only return the username field, not password
    const users = await User.find({}, "auth.username");

    // Map results into an array of just usernames
    const usernames = users.map(user => user.auth.username);

    res.status(200).json({ usernames });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};