"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const room_1 = require("../models/room");
const router = express_1.default.Router();
router.post("/create", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hostId, videoUrl } = req.body;
        const newRoom = new room_1.Room({ hostId, videoUrl, users: [hostId] });
        yield newRoom.save();
        res.status(201).json(newRoom);
    }
    catch (error) {
        res.status(500).json({ error: "Error creating room" });
    }
}));
router.post("/join", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId, userId } = req.body;
        const room = yield room_1.Room.findById(roomId);
        if (!room)
            return res.status(404).json({ error: "Room not found" });
        if (!room.users.includes(userId)) {
            room.users.push(userId);
            yield room.save();
        }
        res.json(room);
    }
    catch (error) {
        res.status(500).json({ error: "Error joining room" });
    }
}));
router.get("/:roomId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const room = yield room_1.Room.findById(req.params.roomId).populate("users");
        if (!room)
            return res.status(404).json({ error: "Room not found" });
        res.json(room);
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching room" });
    }
}));
exports.default = router;
