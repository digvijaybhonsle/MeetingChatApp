import mongoose from "mongoose";

const videoStateSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  state: { type: String, enum: ["playing", "paused"], required: true },
  timestamp: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model("VideoState", videoStateSchema);
