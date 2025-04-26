var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Router } from "express";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/user";
import generateToken from "../utils/generateToken";
import asyncHandler from "../utils/asyncHandler";
dotenv.config();
const router = Router();
// ✅ Signup Route
router.post("/signup", asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password } = req.body;
    // ❗ Check for missing fields
    if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const trimmedEmail = email.toLowerCase().trim();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const existingUser = yield User.findOne({ email: trimmedEmail });
    if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
    }
    const newUser = new User({
        username: trimmedUsername,
        email: trimmedEmail,
        password: trimmedPassword,
    });
    yield newUser.save();
    res.status(201).json({
        message: "User created successfully",
        user: {
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
        },
    });
})));
// ✅ Signin Route
router.post("/signin", asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const user = yield User.findOne({ email: trimmedEmail });
    if (!user) {
        return res.status(404).json({ error: "No account found with this email." });
    }
    const isMatch = yield bcrypt.compare(trimmedPassword, user.password);
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
})));
// ✅ Logout Route
router.post("/logout", asyncHandler((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
})));
export default router;
