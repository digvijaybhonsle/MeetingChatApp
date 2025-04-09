import express from "express";
import { Room } from "../models/room";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { hostId, videoUrl } = req.body;
    const newRoom = new Room({ hostId, videoUrl, users: [hostId] });
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ error: "Error creating room" });
  }
});

router.post("/join", async (req, res) => {
  try {
    const { roomId, userId } = req.body;
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (!room.users.includes(userId)) {
      room.users.push(userId);
      await room.save();
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: "Error joining room" });
  }
});

router.get("/:roomId", async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId).populate("users");
    if (!room) return res.status(404).json({ error: "Room not found" });

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: "Error fetching room" });
  }
});

export default router;