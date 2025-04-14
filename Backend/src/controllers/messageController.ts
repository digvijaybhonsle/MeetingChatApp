import { Request, Response } from "express";
import Message from "../models/message";
import { getSocketInstance } from "../sockets/index";

// GET /api/messages/:id (roomId)
export const getMessages = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.id;
    const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// POST /api/messages/:id (roomId)
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.id;
    const { sender, content } = req.body;

    const message = new Message({
      roomId,
      sender,
      content,
    });

    await message.save();

    // Emit real-time message to all clients in the room
    const io = getSocketInstance();
    io.to(roomId).emit("chat-message", message);

    res.status(201).json(message);
  } catch (err) {
    console.error("Send Message Error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};
