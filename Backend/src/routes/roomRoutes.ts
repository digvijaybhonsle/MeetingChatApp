import express from "express";
import { Room } from "../models/room";
import Message from "../models/message";
import VideoState from "../models/videoState";

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

router.get("/", async (_req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete room" });
  }
})

// GET chat messages for a room
router.get("/:id/messages", async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.id }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST new message to a room
router.post("/:id/messages", async (req, res) => {
  const { sender, content } = req.body;
  try {
    const message = new Message({ roomId: req.params.id, sender, content });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});


// POST video state for a room
router.post("/:id/video-state", async (req, res) => {
  const { state, timestamp } = req.body;
  try {
    const videoState = new VideoState({ roomId: req.params.id, state, timestamp });
    await videoState.save();
    res.status(201).json(videoState);
  } catch (error) {
    res.status(500).json({ error: "Failed to update video state" });
  }
});


export default router;