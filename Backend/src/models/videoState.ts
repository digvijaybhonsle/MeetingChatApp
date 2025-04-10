import mongoose from "mongoose";

const videoStateSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    state: { type: String, enum: ["play", "pause", "seek"], required: true },
    timestamp: { type: Number, required: true }, // video time in seconds
  },
  { timestamps: true }
);

const VideoState = mongoose.model("VideoState", videoStateSchema);
export default VideoState;
