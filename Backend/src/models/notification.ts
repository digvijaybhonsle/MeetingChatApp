import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  recipientId: string;
  senderId?: string;
  type: "message" | "join" | "leave" | "video";
  content: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipientId: { type: String, required: true },
    senderId: { type: String }, // optional
    type: {
      type: String,
      enum: ["message", "join", "leave", "video"],
      required: true,
    },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
export default Notification;
