import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import VideoState from "../models/videoState";
import Message from "../models/message";

let io: Server<DefaultEventsMap, DefaultEventsMap>;

interface RoomUserMap {
  [roomId: string]: Set<string>;
}
const roomUsers: RoomUserMap = {};

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Update this to your frontend
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    socket.on("join-room", async ({ roomId, userId }) => {
      socket.join(roomId);
      if (!roomUsers[roomId]) roomUsers[roomId] = new Set();
      roomUsers[roomId].add(userId);

      // Sync video state on join
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

    socket.on("chat-message", async ({ roomId, message }) => {
      await new Message(message).save(); // optional if not already saved in route
      io.to(roomId).emit("chat-message", message);
    });

    socket.on("video-action", ({ roomId, action }) => {
      socket.to(roomId).emit("video-action", action);
    });

    socket.on("disconnecting", () => {
      for (const roomId of socket.rooms) {
        if (roomUsers[roomId]) {
          roomUsers[roomId].delete(socket.id); // optionally map userId to socket
          io.to(roomId).emit("room-users", {
            count: roomUsers[roomId].size,
            users: Array.from(roomUsers[roomId]),
          });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};

export const getSocketInstance = () => io;
