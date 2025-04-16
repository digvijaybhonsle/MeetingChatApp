import { Router } from "express";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/user";
import generateToken from "../utils/generateToken";
import asyncHandler from "../utils/asyncHandler";

dotenv.config();

const router = Router();

// ✅ Signup Route
router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Directly save the user — password will be hashed by Mongoose middleware
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: password.trim(),
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  })
);

// ✅ Signin Route
router.post(
  "/signin",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(404).json({ error: "No account found with this email." });
    }

    const isMatch = await bcrypt.compare(trimmedPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = generateToken(user._id.toString());

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  })
);

// ✅ Logout Route
router.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
  })
);

export default router;
