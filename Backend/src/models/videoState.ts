import mongoose from "mongoose";

const videoStateSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      ref: "Room",
      required: true,
    },
    currentTime: {
      type: Number, 
      required: true,
    },
    state: {
      type: String,
      required: true, 
      default: "paused",
    },
    timestamp: {
      type: Number,
      required: true,
      default: () => Date.now(),
    },
  },
  {
    timestamps: true, 
  }
);

export default mongoose.model("VideoState", videoStateSchema);
