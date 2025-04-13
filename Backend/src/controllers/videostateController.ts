import { Request, Response } from "express";
import VideoState from "../models/videoState";

export const updateVideoState = async (req: Request, res: Response) => {
  try {
    const { state, timestamp } = req.body;
    const videoState = new VideoState({ roomId: req.params.id, state, timestamp });
    await videoState.save();
    res.status(201).json(videoState);
  } catch (err) {
    res.status(500).json({ error: "Failed to update video state" });
  }
};
