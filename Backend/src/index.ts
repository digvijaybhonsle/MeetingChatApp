import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import roomRoutes from "./routes/roomRoutes";

dotenv.config();

const app = express();
const server = http.createServer(app); // HTTP server
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", credentials: true },
});

app.use(cors());
app.use(express.json());
app.use("/api/rooms", roomRoutes);

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
