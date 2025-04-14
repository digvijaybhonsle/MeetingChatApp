import express from "express";
import { Room } from "../models/room";
import { protect } from "../middleware/authmiddleware";

const router = express.Router();

// Create a new room
router.post("/create", protect , async (req, res) => {
  try {
    const { hostId, videoUrl } = req.body;
    const newRoom = new Room({ hostId, videoUrl, users: [hostId] });
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ error: "Error creating room" });
  }
});

// Join a room
// router.post("/join", protect , async (req: express.Request, res: express.Response) => {
//   try {
//     const { roomId, userId } = req.body;
//     const room = await Room.findById(roomId);
//     if (!room) return res.status(404).json({ error: "Room not found" });

//     if (!room.users.includes(userId)) {
//       room.users.push(userId);
//       await room.save();
//     }

//     res.json(room);
//   } catch (error) {
//     res.status(500).json({ error: "Error joining room" });
//   }
// });

// // Get a room by ID
// router.get("/:roomId", async (req: express.Request, res: express.Response) => {
//   try {
//     const room = await Room.findById(req.params.roomId).populate("users");
//     if (!room) return res.status(404).json({ error: "Room not found" });

//     res.json(room);
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching room" });
//   }
// });

// Get all rooms
router.get("/", async (_req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

export default router;
