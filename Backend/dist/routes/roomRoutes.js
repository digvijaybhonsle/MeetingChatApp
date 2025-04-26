var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import { Room } from "../models/room";
import { protect } from "../middleware/authmiddleware";
import asyncHandler from "../utils/asyncHandler";
const router = express.Router();
// Regex to validate YouTube URL
const youtubeUrlRegex = /^(https?\:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/(watch\?v=|embed\/|v\/|.+\/videoseries\?v=)([a-zA-Z0-9_-]{11})$/;
// Create a new room
router.post("/create", protect, asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { hostId, videoUrl } = req.body;
    // Make sure that hostId and videoUrl are provided
    if (!hostId || !videoUrl) {
        return res.status(400).json({ error: "Host ID and Video URL are required" });
    }
    // Validate YouTube URL
    if (!youtubeUrlRegex.test(videoUrl)) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
    }
    const newRoom = new Room({ hostId, videoUrl, users: [hostId] });
    // Save the room and return the newly created room
    yield newRoom.save();
    res.status(201).json(newRoom);
})));
// Join a room
router.post("/join", protect, // Ensure the user is authenticated before joining a room
asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomId, userId } = req.body;
    // Find the room by ID
    const room = yield Room.findById(roomId);
    if (!room) {
        return res.status(404).json({ error: "Room not found" });
    }
    // Add the user to the room if not already present
    if (!room.users.includes(userId)) {
        room.users.push(userId);
        yield room.save();
    }
    res.status(200).json(room);
})));
// Get a room by ID
router.get("/:roomId", asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const room = yield Room.findById(req.params.roomId).populate("users");
    if (!room) {
        return res.status(404).json({ error: "Room not found" });
    }
    res.status(200).json(room); // Return the room with populated users
})));
// Get all rooms
router.get("/", asyncHandler((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const rooms = yield Room.find();
    res.status(200).json(rooms); // Return all rooms
})));
// Leave a room
router.post('/:id/leave', protect, asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const roomId = req.params.id;
    const { userId } = req.body;
    try {
        // Find the room
        const room = yield Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: "Room not found" });
        }
        // Ensure the room has users and that the user is part of it
        if (!room.users || !room.users.includes(userId)) {
            return res.status(400).json({ error: "User is not part of this room" });
        }
        // Remove the user from the room's users array
        room.users = room.users.filter((participantId) => !participantId.equals(userId));
        // Save the room data after removing the user
        yield room.save();
        // Send a response indicating the user has successfully left
        res.status(200).json({ message: "User left the room successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to leave the room" });
    }
})));
export default router;
