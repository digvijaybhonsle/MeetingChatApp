import { Request, Response } from "express";
import { Room } from "../models/room.js";

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { hostId, videoUrl } = req.body;
    const newRoom = new Room({ hostId, videoUrl, users: [hostId] });
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ error: "Error creating room" });
  }
};

export const getAllRooms = async (_req: Request, res: Response) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
};
