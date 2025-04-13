import express from 'express';
import Message from '../models/message'; // Assuming a Message model

const router = express.Router();

// Get messages for a room
router.get('/:roomId', async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Post a new message
router.post('/:roomId', async (req, res) => {
  const { sender, content } = req.body;
  try {
    const message = new Message({ roomId: req.params.roomId, sender, content });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
