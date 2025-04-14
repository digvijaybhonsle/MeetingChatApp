import express from "express";
import bcrypt from "bcrypt";
import User from "../models/user";  
import dotenv from "dotenv";
import hashPassword from "../utils/hashpassword";  
import generateToken from "../utils/generateToken";
import handleError from "../utils/errorHandler";  

dotenv.config();  

const router = express.Router();

// Sign Up Route
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = new User({ username, email, password: hashedPassword });

    // Save the new user to the database
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    handleError(res, "Failed to create user", 500);
  }
});

// Sign In Route
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Compare the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: "Invalid credentials" });

    // Generate JWT token
    const token = generateToken(user._id.toString());
    
    // Set token in a cookie
    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" }); // Set cookie with HttpOnly flag

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: "Failed to sign in" });
  }
});

// Logout Route
router.post("/logout", (req, res) => {
  try {
    res.clearCookie("token");  // Clear the JWT token cookie
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ error: "Failed to log out" });
  }
});

export default router;
