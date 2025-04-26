var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import User from '../models/user';
import { protect } from '../middleware/authmiddleware';
import asyncHandler from '../utils/asyncHandler';
const router = express.Router();
router.get('/profile', protect, asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch profile" });
    }
})));
router.put('/profile', protect, asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedUser = yield User.findByIdAndUpdate(req.userId, req.body, {
        new: true,
    }).select('-password');
    if (!updatedUser) {
        res.status(404);
        throw new Error('User not found');
    }
    res.status(200).json(updatedUser);
})));
export default router;
