import express from 'express';
import VideoState from '../models/videoState';

const router = express.Router();

// Get video state for a room
router.get('/:id', async (req, res) => {
  try {
    const videoState = await VideoState.findOne({ roomId: req.params.id });
    res.status(200).json(videoState);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch video state" });
  }
});

// Update video state for a room
router.post('/:id/update', async (req, res) => {
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
