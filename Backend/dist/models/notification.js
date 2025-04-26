import mongoose, { Schema } from "mongoose";
const NotificationSchema = new Schema({
    recipientId: { type: String, required: true },
    senderId: { type: String }, // optional
    type: {
        type: String,
        enum: ["message", "join", "leave", "video"],
        required: true,
    },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });
const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
