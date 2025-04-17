import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import VideoState from "../models/videoState";
import Message from "../models/message";

let io: Server<DefaultEventsMap, DefaultEventsMap>;

interface RoomUserMap {
  [roomId: string]: Set<string>;
}

const roomUsers: RoomUserMap = {};
const socketToUser: { [socketId: string]: string } = {}; // Map socket ID to user ID

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Join Room
    socket.on("join-room", async ({ roomId, userId }) => {
      socket.join(roomId);
      if (!roomUsers[roomId]) roomUsers[roomId] = new Set();
      roomUsers[roomId].add(userId);
      socketToUser[socket.id] = userId;

      // Sync latest video state
      const latestState = await VideoState.findOne({ roomId }).sort({ createdAt: -1 });
      if (latestState) {
        socket.emit("video-sync", latestState);
      }

      // Send updated user list
      io.to(roomId).emit("room-users", {
        count: roomUsers[roomId].size,
        users: Array.from(roomUsers[roomId]),
      });
    });

    // Chat messaging
    socket.on("chat-message", async ({ roomId, message }) => {
      await new Message(message).save();
      io.to(roomId).emit("chat-message", message);
    });

    // Video actions (play, pause, seek)
    socket.on("video-action", ({ roomId, action }) => {
      socket.to(roomId).emit("video-action", action);
    });

    // Typing indicators (optional)
    socket.on("typing", ({ roomId, username }) => {
      socket.to(roomId).emit("typing", { username });
    });

    socket.on("stop-typing", ({ roomId, username }) => {
      socket.to(roomId).emit("stop-typing", { username });
    });

    // Cleanup on disconnect
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
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};

export const getSocketInstance = () => io;
