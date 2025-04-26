import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
// Routes
import roomRoutes from "./routes/roomRoutes";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import messageRoutes from "./routes/messageRoutes";
import videoStateRoutes from "./routes/videostateRoutes";
import notificationRoutes from "./routes/notificationRoutes";
// Middleware
import { protect } from "./middleware/authmiddleware";
import errorHandler from "./utils/errorHandler";
// Socket Initialization
import { initSocket } from "./sockets/index";
// Load environment variables
dotenv.config();
const app = express();
const server = http.createServer(app);
// Middleware
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());
// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/video-chat";
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
});
// API Routes
app.use("/api/rooms", protect, roomRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", protect, messageRoutes); // 🔁 Chat History Endpoint
app.use("/api/video-state", videoStateRoutes);
app.use('/api/notifications', notificationRoutes);
// Root route
app.get("/", (_req, res) => {
    res.send("✅ Backend is running...");
});
// Error & 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});
app.use(errorHandler);
// Init socket after all middleware
initSocket(server);
// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
