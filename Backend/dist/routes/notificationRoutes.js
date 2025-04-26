var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// routes/notificationRoutes.ts
import express from 'express';
import Notification from '../models/notification';
import { protect } from '../middleware/authmiddleware';
import asyncHandler from '../utils/asyncHandler';
const router = express.Router();
// ✅ Get all notifications for the logged-in user
// router.get('/', protect, asyncHandler(async (req, res) => {
//   try {
//     if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
//     const notifications = await Notification.find({
//       recipientId: req.userId,
//     }).sort({ createdAt: -1 });
//     res.status(200).json(notifications);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch notifications" });
//   }
// }));
// ✅ Mark a specific notification as read
router.patch('/:id/read', protect, asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
        res.status(200).json(notification);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
})));
// ✅ Optional: Delete a notification
router.delete('/:id', protect, asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Notification.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Notification deleted" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete notification" });
    }
})));
export default router;
