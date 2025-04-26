var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import VideoState from '../models/videoState';
import { Room } from '../models/room';
import asyncHandler from '../utils/asyncHandler';
const router = express.Router();
// Get video state for a room
router.get('/:id', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.params.id;
        // Validate roomId exists
        const roomExists = yield Room.findById(roomId);
        if (!roomExists) {
            return res.status(404).json({ error: "Room not found" });
        }
        const videoState = yield VideoState.findOne({ roomId });
        if (!videoState) {
            return res.status(404).json({ error: "No video state found for this room" });
        }
        res.status(200).json(videoState);
    }
    catch (error) {
        console.error("❌ Failed to fetch video state:", error);
        res.status(500).json({ error: "Failed to fetch video state" });
    }
})));
// Update video state for a room
router.post('/:id/update', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { state, timestamp } = req.body;
    const roomId = req.params.id;
    // Validate roomId exists
    const roomExists = yield Room.findById(roomId);
    if (!roomExists) {
        return res.status(404).json({ error: "Room not found" });
    }
    // Validate state
    const validStates = ["paused", "playing", "buffering"];
    if (!validStates.includes(state)) {
        return res.status(400).json({ error: "Invalid video state" });
    }
    try {
        const videoState = yield VideoState.findOneAndUpdate({ roomId }, { state, timestamp }, { new: true, upsert: true });
        res.status(201).json(videoState);
    }
    catch (error) {
        console.error("❌ Failed to update video state:", error);
        res.status(500).json({ error: "Failed to update video state" });
    }
})));
export default router;
