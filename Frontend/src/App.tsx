import { useEffect } from "react";
import { io } from "socket.io-client";
import Auth from "./components/Auth";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoomJoin from "./components/JoinRoom";
import Room from "./components/Room";
import NotificationProvider from "./components/NotificationProvider";

const socket = io("http://localhost:5000");

function App() {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to socket:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from socket");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Router>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/joinroom" element={<RoomJoin />} />
          <Route path="/rooms/:roomId" element={<Room />} />
        </Routes>
      </NotificationProvider>
    </Router>
  );
}

export default App;
