var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Message from "../models/message";
import { getSocketInstance } from "../sockets/index";
// GET /api/messages/:id (roomId)
export const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.params.id;
        const messages = yield Message.find({ roomId }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});
// POST /api/messages/:id (roomId)
export const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.params.id;
        const { sender, content } = req.body;
        const message = new Message({
            roomId,
            sender,
            content,
        });
        yield message.save();
        // Emit real-time message to all clients in the room
        const io = getSocketInstance();
        io.to(roomId).emit("chat-message", message);
        res.status(201).json(message);
    }
    catch (err) {
        console.error("Send Message Error:", err);
        res.status(500).json({ error: "Failed to send message" });
    }
});
