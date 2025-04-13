import express from 'express';
import Notification from '../models/notification'  // Assuming Notification model

const router = express.Router();

// Get notifications for a user
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

export default router;
