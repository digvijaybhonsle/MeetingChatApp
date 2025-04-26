var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Room } from "../models/room";
export const createRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hostId, videoUrl } = req.body;
        const newRoom = new Room({ hostId, videoUrl, users: [hostId] });
        yield newRoom.save();
        res.status(201).json(newRoom);
    }
    catch (error) {
        res.status(500).json({ error: "Error creating room" });
    }
});
export const getAllRooms = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rooms = yield Room.find();
        res.status(200).json(rooms);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch rooms" });
    }
});
