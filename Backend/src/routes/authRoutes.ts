import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";  // Example if you're using JWT for authentication
import User from "../models/user";  // Assuming you have a User model

const router = express.Router();

// Sign Up Route
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);  // Hash password
    const newUser = new User({ username, email, password: hashedPassword });

    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Sign In Route
// router.post("/signin", async (req, res) => {
//   const { email, password } = req.body;
  
//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ error: "User not found" });

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) return res.status(401).json({ error: "Invalid credentials" });

//     // Example of generating a JWT token
//     const token = jwt.sign({ userId: user._id }, "yourSecretKey", { expiresIn: "1h" });
    
//     res.status(200).json({ message: "Login successful", token });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to sign in" });
//   }
// });

export default router;
