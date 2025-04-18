import express from "express";
import { Room } from "../models/room";
import { protect } from "../middleware/authmiddleware";
import asyncHandler from "../utils/asyncHandler";

const router = express.Router();

// Create a new room
router.post(
  "/create",
  protect, 
  asyncHandler(async (req, res) => {
    const { hostId, videoUrl } = req.body;

    // Make sure that hostId and videoUrl are provided
    if (!hostId || !videoUrl) {
      return res.status(400).json({ error: "Host ID and Video URL are required" });
    }

    const newRoom = new Room({ hostId, videoUrl, users: [hostId] });

    // Save the room and return the newly created room
    await newRoom.save();
    res.status(201).json(newRoom);
  })
);

// Join a room
router.post(
  "/join",
  protect, // Ensure the user is authenticated before joining a room
  asyncHandler(async (req, res) => {
    const { roomId, userId } = req.body;

    // Find the room by ID
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Add the user to the room if not already present
    if (!room.users.includes(userId)) {
      room.users.push(userId);
      await room.save();
    }

    res.status(200).json(room); 
  })
);

// Get a room by ID
router.get(
  "/:roomId",
  asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.roomId).populate("users");
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.status(200).json(room); // Return the room with populated users
  })
);

// Get all rooms
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rooms = await Room.find();
    res.status(200).json(rooms); // Return all rooms
  })
);

// Leave a room
router.post('/:id/leave',
  protect,
  asyncHandler(async (req, res) => {
    const roomId = req.params.id;
    const { userId } = req.body;

    try {
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Remove user from users array
      room.users = room.users.filter(
        (participantId) => !participantId.equals(userId)
      );

      await room.save();

      res.status(200).json({ message: "User left the room successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to leave the room" });
    }
  })
);


export default router;