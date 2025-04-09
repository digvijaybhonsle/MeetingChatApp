import mongoose from "mongoose"

const RoomSchema = new mongoose.Schema({
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    videoUrl: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now }
  });
  
  export const Room = mongoose.model("Room", RoomSchema);