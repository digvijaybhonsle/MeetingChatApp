import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Routes
import roomRoutes from "./routes/roomRoutes";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import messageRoutes from "./routes/messageRoutes";
import videoStateRoutes from "./routes/videostateRoutes";

//middleware
import { protect } from "./middleware/authmiddleware";
import errorHandler from "./utils/errorHandler";

dotenv.config();
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// CORS configuration
// const corsOptions = {
//   origin:
//     process.env.NODE_ENV === "production"
//       ? "https://yourfrontenddomain.com" // Deployed frontend
//       : "http://localhost:5173",         // Vite or React local frontend
//   credentials: true, // Allow cookies, headers
// };

// Middleware
app.use(cors());
app.use(express.json());
app.use(errorHandler);
// app.use(cors(corsOptions));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/video-chat";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// Routes
app.use("/api/rooms", protect , roomRoutes);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/video-state", videoStateRoutes);

// Data Structures to track real-time state
const roomUsers = new Map<string, Set<string>>();  // Tracks users in rooms
const latestVideoState = new Map<string, { state: string; timestamp: number }>(); // Tracks video state per room

// Socket.IO Events
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // User joins a room
  socket.on("join-room", (roomId: string) => {
    socket.join(roomId);

    // Add to room user set
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Set());
    }
    roomUsers.get(roomId)!.add(socket.id);

    console.log(`✅ ${socket.id} joined room: ${roomId}`);

    // Emit updated user count
    io.to(roomId).emit("room-users", {
      count: roomUsers.get(roomId)!.size,
      users: Array.from(roomUsers.get(roomId)!),
    });

    // Sync latest video state to new user
    if (latestVideoState.has(roomId)) {
      socket.emit("video-sync", latestVideoState.get(roomId));
    }
  });

  // Chat message
  socket.on("chat-message", ({ roomId, message }) => {
    io.to(roomId).emit("chat-message", message);
  });

  // Video play, pause, or seek
  socket.on("video-action", ({ roomId, action, timestamp }) => {
    latestVideoState.set(roomId, { state: action, timestamp });
    socket.to(roomId).emit("video-action", { action, timestamp });
  });

  // Typing indicators
  socket.on("typing", ({ roomId, username }) => {
    socket.to(roomId).emit("typing", { username });
  });

  socket.on("stop-typing", ({ roomId, username }) => {
    socket.to(roomId).emit("stop-typing", { username });
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    roomUsers.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        io.to(roomId).emit("room-users", {
          count: users.size,
          users: Array.from(users),
        });
      }
    });
  });
});

// Root route
app.get("/", (_req, res) => {
  res.send("✅ Backend is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
