import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import VideoState from "../models/videoState";
import Message from "../models/message";
import { Room } from "../models/room";
import Notification from '../models/notification';

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
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Join Room
    socket.on("join-room", async ({ roomId, userId }) => {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
      if (!roomUsers[roomId]) roomUsers[roomId] = new Set();
      roomUsers[roomId].add(userId);
      socketToUser[socket.id] = userId;

      // Sync latest video state
      const latestState = await VideoState.findOne({ roomId }).sort({ createdAt: -1 });
      if (latestState) {
        socket.emit("video-sync", latestState);
      }

      // Notify others in the room about new user
      io.to(roomId).emit("room-users", {
        count: roomUsers[roomId].size,
        users: Array.from(roomUsers[roomId]),
      });
    });

    // Real-time Chat
    socket.on("chat-message", async (messageData: { roomId: string; message: { sender: string; content: string } }) => {
      const { roomId, message } = messageData;

      if (!roomId) {
        console.error("❌ No roomId provided in chat message");
        return;
      }

      try {
        // Create the message with roomId and sender info
        const newMessage = new Message({
          roomId,
          sender: message.sender,
          content: message.content
        });

        await newMessage.save();

        await new Notification({
          recipientId: roomId, // or individual userId if required
          senderId: message.sender,
          type: "message",
          content: `${message.sender} sent a message`,
        }).save();

        io.to(roomId).emit("new-notification", {
          type: "message",
          senderId: message.sender,
          content: `${message.sender} sent a message`,
        });

        // Emit to all clients in the same room
        io.to(roomId).emit("chat-message", newMessage);
      } catch (error) {
        console.error("❌ Failed to save message:", error);
      }
    });

    // Leave Room
    socket.on('leave-room', async ({ roomId, userId }) => {
      // Remove user from socket room
      socket.leave(roomId);
    
      // Remove user from database as well (same logic as in your route)
      try {
        const room = await Room.findById(roomId);
        if (room && room.users.includes(userId)) {
          room.users = room.users.filter((participantId: { equals: (arg0: any) => any; }) => !participantId.equals(userId));
          await room.save();
        }
    
        // Emit to other users that someone left
        socket.to(roomId).emit('user-left', { userId, roomId });
    
        console.log(`User ${userId} left room: ${roomId}`);
      } catch (error) {
        console.error('Error handling leave-room socket event:', error);
      }
    });

    // Typing indicators
    socket.on("typing", ({ roomId, username }) => {
      socket.to(roomId).emit("typing", { username });
    });

    socket.on("stop-typing", ({ roomId, username }) => {
      socket.to(roomId).emit("stop-typing", { username });
    });

    // Video sync actions
    socket.on("video-action", ({ roomId, action }) => {
      socket.to(roomId).emit("video-action", action);
    });

    // Disconnect logic
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
