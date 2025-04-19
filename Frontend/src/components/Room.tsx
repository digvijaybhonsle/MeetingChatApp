import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import "./css/room.css";
import VideoControl from "./VideoControl";

interface Room {
  _id: string;
  hostId: string;
  videoUrl: string;
  users: string[];
}

interface MessageData {
  sender: string;
  content: string;
  createdAt: string;
}

const socket = io("http://localhost:5000");

const Room: React.FC = () => {
  const { roomId } = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId] = useState(localStorage.getItem("userId"));
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const axiosConfig = React.useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token]
  );

  // Listen for new chat messages in real-time
  useEffect(() => {
    socket.on("chat-message", (newMessage: MessageData) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.off("chat-message");
    };
  }, []);

  // Fetch room details and messages when roomId changes
  useEffect(() => {
    if (!roomId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [roomRes, messageRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/rooms/${roomId}`, axiosConfig),
          axios.get(`http://localhost:5000/api/messages/${roomId}`, axiosConfig),
        ]);
        setRoom(roomRes.data);
        setMessages(messageRes.data);
      } catch {
        setError("Failed to fetch room or messages.");
      }
      setLoading(false);
    };

    fetchData();
  }, [roomId, axiosConfig]);

  // Handle sending chat message
  const handleSendMessage = () => {
    if (!message.trim() || !userId || !roomId) return;

    const messageData = {
      roomId,
      message: {
        sender: userId,
        content: message,
      },
    };

    const newMessage: MessageData = {
      sender: userId,
      content: message,
      createdAt: new Date().toISOString(),
    };

    // Update local messages immediately
    setMessages((prev) => [...prev, newMessage]);

    // Emit message to server
    socket.emit("chat-message", messageData);

    // Clear input after sending
    setMessage("");
  };

  // Handle leaving the room
  const handleLeaveRoom = () => {
    if (!roomId || !userId) return;

    axios
      .post(
        `http://localhost:5000/api/rooms/${roomId}/leave`,
        { roomId, userId },
        axiosConfig
      )
      .then(() => {
        socket.emit("userLeft", { roomId, userId });
        navigate("/joinroom");
      })
      .catch(() => setError("Failed to leave room."));
  };

  // Format timestamp into a readable string (HH:MM)
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isHost = userId === room?.hostId;

  return (
    <div className="room-container">
      {room && (
        <div className="room-layout">
          {/* Video Section */}
          <div className="video-section">
            <div className="video-header">
              <h2 style={{ color: "white", marginTop: "-120px" }}>
                Room: {room._id}
              </h2>
              <button className="leave-btn" onClick={handleLeaveRoom}>
                Leave Room
              </button>
            </div>

            <VideoControl
              videoURL={room.videoUrl}
              roomId={room._id}
              isHost={isHost}
            />
          </div>

          {/* Chat Section */}
          <div className="chat-section">
            <div className="chat-header">
              <h3>Chat</h3>
            </div>
            <div className="messages">
              {loading ? (
                <div className="loading">Loading messages...</div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message ${msg.sender === userId ? "own-message" : ""}`}
                  >
                    <div className="meta">
                      <strong>{msg.sender === userId ? "You" : msg.sender}</strong>{" "}
                      <span className="timestamp">
                        {formatTimestamp(msg.createdAt)}
                      </span>
                    </div>
                    <div className="content">{msg.content}</div>
                  </div>
                ))
              )}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
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
