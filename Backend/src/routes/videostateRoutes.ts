import express from 'express';
import VideoState from '../models/videoState';
import { protect } from '../middleware/authmiddleware';
import { Room } from '../models/room';  
import asyncHandler from '../utils/asyncHandler';

const router = express.Router();

// Get video state for a room
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const roomId = req.params.id;

    // Validate roomId exists
    const roomExists = await Room.findById(roomId);
    if (!roomExists) {
      return res.status(404).json({ error: "Room not found" });
    }

    const videoState = await VideoState.findOne({ roomId });

    if (!videoState) {
      return res.status(404).json({ error: "No video state found for this room" });
    }

    res.status(200).json(videoState);
  } catch (error) {
    console.error("❌ Failed to fetch video state:", error);
    res.status(500).json({ error: "Failed to fetch video state" });
  }
}));

// Update video state for a room
router.post('/:id/update', asyncHandler(async (req, res) => {
  const { state, timestamp } = req.body;
  const roomId = req.params.id;

  // Validate roomId exists
  const roomExists = await Room.findById(roomId);
  if (!roomExists) {
    return res.status(404).json({ error: "Room not found" });
  }

  // Validate state
  const validStates = ["paused", "playing", "buffering"];
  if (!validStates.includes(state)) {
    return res.status(400).json({ error: "Invalid video state" });
  }

  try {
    const videoState = await VideoState.findOneAndUpdate(
      { roomId }, 
      { state, timestamp }, 
      { new: true, upsert: true }  
    );

    res.status(201).json(videoState);
  } catch (error) {
    console.error("❌ Failed to update video state:", error);
    res.status(500).json({ error: "Failed to update video state" });
  }
}));

export default router;
