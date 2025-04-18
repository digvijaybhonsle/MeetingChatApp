import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import "./css/room.css";

interface Room {
  _id: string;
  hostId: string;
  videoUrl: string;
  users: string[];
}

const socket = io("http://localhost:5000");

const Room: React.FC = () => {
  const { roomId } = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [userId] = useState(localStorage.getItem("userId"));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const axiosConfig = useMemo(() => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  // ✅ Real-time message handling through socket
  useEffect(() => {
    socket.on("newMessage", (newMessage: string) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      socket.off("newMessage");
      socket.disconnect(); // Disconnect socket on unmount
    };
  }, []);

  // ✅ Fetch room details when roomId changes
  useEffect(() => {
    if (!roomId) return;

    const fetchRoom = async () => {
      try {
        setLoading(true);
        setError(""); // Clear any old errors
        const res = await axios.get(`http://localhost:5000/api/rooms/${roomId}`, axiosConfig);
        setRoom(res.data);
      } catch {
        setError("Failed to fetch room.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId, axiosConfig]);

  // ✅ Handle sending message
  const handleSendMessage = () => {
    if (!message.trim() || !userId || !roomId) return;
    socket.emit("sendMessage", { message, roomId, userId });
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSendMessage();
  };

  // ✅ Handle leaving the room
  const handleLeaveRoom = () => {
    if (!roomId || !userId) return;

    axios
      .post(`http://localhost:5000/api/rooms/leave`, { roomId, userId }, axiosConfig)
      .then(() => {
        socket.emit("userLeft", { roomId, userId });
        navigate("/room-join");
      })
      .catch(() => setError("Failed to leave room."));
  };

  return (
    <div className="room-container">
      {loading && <div className="loading">Loading room...</div>}

      {room && (
        <div className="room-layout">
          {/* Video Section */}
          <div className="video-section">
            <h2>Room: {room._id}</h2>
            <iframe
              width="100%"
              height="100%"
              src={room.videoUrl}
              title="Room Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
            <button className="leave-btn" onClick={handleLeaveRoom}>
              Leave Room
            </button>
          </div>

          {/* Chat Section */}
          <div className="chat-section">
            <div className="chat-header">
              <h3>Chat</h3>
            </div>
            <div className="messages">
              {messages.map((msg, index) => (
                <div key={index} className="message">
                  {msg}
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default Room;
