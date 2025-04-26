import express from 'express';
import Message from '../models/message.js'; 
import { protect } from '../middleware/authmiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.js';  // Import the User model

const router = express.Router();

// Get messages for a room
router.get("/:roomId", protect, asyncHandler(async (req, res) => {
  try {
    const roomId = req.params.roomId;
    console.log("📩 Fetching messages for:", req.params.roomId);

    const messages = await Message.find({ roomId }).sort({ createdAt: 1 });

    if (messages.length === 0) {
      return res.status(404).json({ success: false, message: 'No messages found' });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Failed to fetch messages:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}));

// Post a message in a room
router.post(
  '/:roomId',
  protect, 
  asyncHandler(async (req, res) => {
    const { sender, content } = req.body;
    const { roomId } = req.params;

    // Validate sender exists
    const userExists = await User.findById(sender);
    if (!userExists) {
      return res.status(400).json({ success: false, message: 'Invalid sender' });
    }

    // Validate content is not empty
    if (!sender || !content) {
      return res.status(400).json({ success: false, error: 'Sender and content are required' });
    }

    // Create and save the message
    const message = new Message({ roomId, sender, content });
    await message.save();
    
    res.status(201).json(message);
  })
);

export default router;
