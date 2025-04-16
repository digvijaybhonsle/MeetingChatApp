import express from 'express';
import Message from '../models/message'; 
import { protect } from '../middleware/authmiddleware';
import asyncHandler from '../utils/asyncHandler';

const router = express.Router();

router.get(
  '/:roomId',
  protect, 
  asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  })
);

router.post(
  '/:roomId',
  protect, 
  asyncHandler(async (req, res) => {
    const { sender, content } = req.body;
    const { roomId } = req.params;

    if (!sender || !content) {
      return res.status(400).json({ success: false, error: 'Sender and content are required' });
    }

    const message = new Message({ roomId, sender, content });
    await message.save();
    res.status(201).json(message);
  })
);

export default router;
