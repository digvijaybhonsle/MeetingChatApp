var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import Message from '../models/message';
import { protect } from '../middleware/authmiddleware';
import asyncHandler from '../utils/asyncHandler';
import User from '../models/user'; // Import the User model
const router = express.Router();
// Get messages for a room
router.get("/:roomId", protect, asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.params.roomId;
        console.log("📩 Fetching messages for:", req.params.roomId);
        const messages = yield Message.find({ roomId }).sort({ createdAt: 1 });
        if (messages.length === 0) {
            return res.status(404).json({ success: false, message: 'No messages found' });
        }
        res.status(200).json(messages);
    }
    catch (error) {
        console.error("❌ Failed to fetch messages:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
})));
// Post a message in a room
router.post('/:roomId', protect, asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sender, content } = req.body;
    const { roomId } = req.params;
    // Validate sender exists
    const userExists = yield User.findById(sender);
    if (!userExists) {
        return res.status(400).json({ success: false, message: 'Invalid sender' });
    }
    // Validate content is not empty
    if (!sender || !content) {
        return res.status(400).json({ success: false, error: 'Sender and content are required' });
    }
    // Create and save the message
    const message = new Message({ roomId, sender, content });
    yield message.save();
    res.status(201).json(message);
})));
export default router;
