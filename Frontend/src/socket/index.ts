// socket/socket.ts
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  withCredentials: true,
  transports: ["websocket"], // Optional for better performance
});

export default socket;