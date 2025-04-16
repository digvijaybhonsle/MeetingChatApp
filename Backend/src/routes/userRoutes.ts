import express from 'express';
import User from '../models/user';
import { protect } from '../middleware/authmiddleware';
import asyncHandler from '../utils/asyncHandler';

const router = express.Router();

router.get('/profile', protect, asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password"); 
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}));

router.put(
  '/profile',
  protect,
  asyncHandler(async (req, res) => {
    const updatedUser = await User.findByIdAndUpdate(req.userId, req.body, {
      new: true,
    }).select('-password');

    if (!updatedUser) {
      res.status(404);
      throw new Error('User not found');
    }

    res.status(200).json(updatedUser);
  })
);

export default router;
