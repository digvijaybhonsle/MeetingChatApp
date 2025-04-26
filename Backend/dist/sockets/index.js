var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Server } from "socket.io";
import VideoState from "../models/videoState";
import Message from "../models/message";
import { Room } from "../models/room";
import Notification from "../models/notification";
let io;
const roomUsers = {};
// Helper function to get users of a room
const getRoomUsers = (roomId) => {
    const users = Array.from(roomUsers[roomId] || []);
    return { count: users.length, users };
};
const socketToUser = {};
export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    io.on("connection", (socket) => {
        console.log(`🔌 Connected: ${socket.id}`);
        socket.on("join-room", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomId, userId }) {
            try {
                socket.join(roomId);
                socketToUser[socket.id] = userId;
                if (!roomUsers[roomId]) {
                    roomUsers[roomId] = new Set();
                }
                roomUsers[roomId].add(userId);
                console.log(`👥 ${userId} joined room: ${roomId}`);
                // Emit current user list to everyone in the room
                io.to(roomId).emit("room-users", {
                    count: roomUsers[roomId].size,
                    users: Array.from(roomUsers[roomId]),
                });
                // Emit latest video sync state to the newly joined user
                const latestState = yield VideoState.findOne({ roomId }).sort({ createdAt: -1 });
                if (latestState) {
                    socket.emit("video:sync", latestState);
                }
                // Send chat history to the new user
                const messages = yield Message.find({ roomId }).sort({ createdAt: 1 });
                socket.emit("chat-history", messages);
            }
            catch (err) {
                console.error("❌ Error during join-room:", err);
                socket.emit("error", { message: "Failed to join room." });
            }
        }));
        socket.on("chat-message", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomId, message }) {
            const { sender, senderName, content } = message;
            if (!roomId || !sender || !content)
                return;
            const newMessage = new Message({
                roomId,
                sender,
                content,
                senderName,
            });
            yield newMessage.save();
            yield new Notification({
                recipientId: roomId,
                senderId: sender,
                type: "message",
                content: `${senderName || "Someone"} sent a message`,
            }).save();
            io.to(roomId).emit("new-notification", {
                type: "message",
                senderId: sender,
                senderName,
                content: `${senderName || "Someone"} sent a message`,
            });
            io.to(roomId).emit("chat-message", {
                _id: newMessage._id,
                sender,
                content,
                createdAt: newMessage.createdAt,
                senderName,
            });
        }));
        socket.on("typing", ({ roomId, username }) => {
            socket.to(roomId).emit("typing", { username });
        });
        socket.on("stop-typing", ({ roomId, username }) => {
            socket.to(roomId).emit("stop-typing", { username });
        });
        socket.on("leave-room", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomId, userId }) {
            var _b;
            socket.leave(roomId);
            if (roomUsers[roomId]) {
                roomUsers[roomId].delete(userId);
            }
            const room = yield Room.findById(roomId);
            if (room) {
                room.users = room.users.filter((id) => id.toString() !== userId);
                yield room.save();
            }
            console.log(`👤 ${userId} left room: ${roomId}`);
            socket.to(roomId).emit("user-left", { userId });
            io.to(roomId).emit("room-users", {
                count: ((_b = roomUsers[roomId]) === null || _b === void 0 ? void 0 : _b.size) || 0,
                users: Array.from(roomUsers[roomId] || []),
            });
        }));
        socket.on("video:play", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomId, currentTime }) {
            try {
                socket.to(roomId).emit("video:play", { currentTime });
                const state = new VideoState({ roomId, state: "play", timestamp: Date.now(), currentTime });
                yield state.save();
                io.to(roomId).emit("video-sync", state);
            }
            catch (err) {
                console.error("Error in video play sync:", err);
            }
        }));
        socket.on("video:pause", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomId, currentTime }) {
            try {
                socket.to(roomId).emit("video:pause", { currentTime });
                const state = new VideoState({ roomId, state: "pause", timestamp: Date.now(), currentTime });
                yield state.save();
                io.to(roomId).emit("video-sync", state);
            }
            catch (err) {
                console.error("Error in video pause sync:", err);
            }
        }));
        socket.on("video:seek", (data) => __awaiter(void 0, void 0, void 0, function* () {
            const { roomId, currentTime, state, timestamp } = data;
            if (!roomId || currentTime == null || !state || timestamp == null) {
                console.error("Missing video:seek fields", data);
                return;
            }
            try {
                yield VideoState.create({ roomId, currentTime, state, timestamp });
            }
            catch (err) {
                console.error("Error saving video state:", err);
            }
        }));
        socket.on("disconnecting", () => {
            const userId = socketToUser[socket.id];
            for (const roomId of socket.rooms) {
                if (roomUsers[roomId]) {
                    roomUsers[roomId].delete(userId);
                    io.to(roomId).emit("room-users", {
                        count: roomUsers[roomId].size,
                        users: Array.from(roomUsers[roomId]),
                    });
                }
            }
            delete socketToUser[socket.id];
        });
        socket.on("disconnect", () => {
            console.log(`❌ Disconnected: ${socket.id}`);
        });
    });
};
export const getSocketInstance = () => io;
