var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Room } from "../models/room"; // Assuming you have a Room model
const isRoomCreator = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const room = yield Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ error: "Room not found" });
        }
        if (!req.user || room.hostId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Not authorized to access this room" });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});
export { isRoomCreator };
