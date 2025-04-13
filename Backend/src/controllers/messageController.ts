import { Request, Response } from "express";
import Message from "../models/message";

export const getMessages = async (req: Request, res: Response) => {
  try {
    const messages = await Message.find({ roomId: req.params.id }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { sender, content } = req.body;
    const message = new Message({ roomId: req.params.id, sender, content });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
};
