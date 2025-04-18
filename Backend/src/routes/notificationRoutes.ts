// routes/notificationRoutes.ts
import express from 'express';
import Notification from '../models/notification';
import { protect } from '../middleware/authmiddleware';
import asyncHandler from '../utils/asyncHandler';

const router = express.Router();

// ✅ Get all notifications for the logged-in user
router.get('/', protect, asyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }
    const notifications = await Notification.find({ recipientId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
}));

// ✅ Mark a specific notification as read
router.patch('/:id/read', protect, asyncHandler(async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
}));

// ✅ Optional: Delete a notification
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete notification" });
  }
}));

export default router;
