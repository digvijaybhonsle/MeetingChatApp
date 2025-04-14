import { Request, Response, NextFunction } from "express";
import { Room } from "../models/room";  // Assuming you have a Room model

const isRoomCreator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    
    if (room.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to access this room" });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

export { isRoomCreator };
