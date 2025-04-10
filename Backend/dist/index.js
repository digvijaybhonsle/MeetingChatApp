"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const roomRoutes_1 = __importDefault(require("./routes/roomRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app); // HTTP server
const io = new socket_io_1.Server(server, {
    cors: { origin: "http://localhost:5173", credentials: true },
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api/rooms", roomRoutes_1.default);
app.get("/", (req, res) => {
    res.send("Backend is running...");
});
// WebSocket connection
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    // Join a Room
    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
    });
    // Sync Video (Play, Pause, Seek)
    socket.on("video-action", ({ roomId, action }) => {
        socket.to(roomId).emit("video-action", action);
    });
    // Handle Chat Messages
    socket.on("chat-message", ({ roomId, message }) => {
        io.to(roomId).emit("chat-message", message);
    });
    // Handle Disconnection
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});
// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
