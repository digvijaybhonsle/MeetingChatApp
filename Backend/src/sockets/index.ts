import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import VideoState from "../models/videoState";
import Message from "../models/message";
import { Room } from "../models/room";
import Notification from "../models/notification";

let io: Server<DefaultEventsMap, DefaultEventsMap>;

interface RoomUserMap {
  [roomId: string]: Set<string>;
}

const roomUsers: RoomUserMap = {};

// Helper function to get users of a room
const getRoomUsers = (roomId: string): { count: number; users: string[] } => {
  const users = Array.from(roomUsers[roomId] || []);
  return { count: users.length, users };
};
const socketToUser: { [socketId: string]: string } = {};

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    socket.on("join-room", async ({ roomId, userId }) => {
      socket.join(roomId);
      socketToUser[socket.id] = userId;

      const roomState = getRoomUsers(roomId);
      socket.emit("video:sync", roomState);

      if (!roomUsers[roomId]) roomUsers[roomId] = new Set();
      roomUsers[roomId].add(userId);

      console.log(`👥 ${userId} joined room: ${roomId}`);

      const latestState = await VideoState.findOne({ roomId }).sort({ createdAt: -1 });
      if (latestState) socket.emit("video-sync", latestState);

      const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
      socket.emit("chat-history", messages);

      io.to(roomId).emit("room-users", {
        count: roomUsers[roomId].size,
        users: Array.from(roomUsers[roomId]),
      });
    });

    socket.on("chat-message", async ({ roomId, message }) => {
      const { sender, senderName, content } = message;
      if (!roomId || !sender || !content) return;

      const newMessage = new Message({
        roomId,
        sender,
        content,
        senderName,
      });
      await newMessage.save();

      await new Notification({
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
    });

    socket.on("typing", ({ roomId, username }) => {
      socket.to(roomId).emit("typing", { username });
    });

    socket.on("stop-typing", ({ roomId, username }) => {
      socket.to(roomId).emit("stop-typing", { username });
    });

    socket.on("leave-room", async ({ roomId, userId }) => {
      socket.leave(roomId);
      if (roomUsers[roomId]) {
        roomUsers[roomId].delete(userId);
      }

      const room = await Room.findById(roomId);
      if (room) {
        room.users = room.users.filter((id: any) => id.toString() !== userId);
        await room.save();
      }

      console.log(`👤 ${userId} left room: ${roomId}`);
      socket.to(roomId).emit("user-left", { userId });

      io.to(roomId).emit("room-users", {
        count: roomUsers[roomId]?.size || 0,
        users: Array.from(roomUsers[roomId] || []),
      });
    });

    socket.on("video:play", async ({ roomId, currentTime }) => {
      try {
        socket.to(roomId).emit("video:play", { currentTime });
        const state = new VideoState({ roomId, state: "play", timestamp: Date.now(), currentTime });
        await state.save();
        io.to(roomId).emit("video-sync", state);
      } catch (err) {
        console.error("Error in video play sync:", err);
      }
    });
    
    socket.on("video:pause", async ({ roomId, currentTime }) => {
      try {
        socket.to(roomId).emit("video:pause", { currentTime });
        const state = new VideoState({ roomId, state: "pause", timestamp: Date.now(), currentTime });
        await state.save();
        io.to(roomId).emit("video-sync", state);
      } catch (err) {
        console.error("Error in video pause sync:", err);
      }
    });
    

    socket.on("video:seek", async (data) => {
      const { roomId, currentTime, state, timestamp } = data;
      if (!roomId || currentTime == null || !state || timestamp == null) {
        console.error("Missing video:seek fields", data);
        return;
      }
      try {
        await VideoState.create({ roomId, currentTime, state, timestamp });
      } catch (err) {
        console.error("Error saving video state:", err);
      }
    });

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
