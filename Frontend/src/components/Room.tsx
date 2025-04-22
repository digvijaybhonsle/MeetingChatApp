/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./css/room.css";
import VideoControl from "./VideoControl";
import { useChatStore } from "../lib/store/chatStore";
import notificationSound from "../assets/notification.wav";
import socket from "../socket/index";

interface Room {
  _id: string;
  hostId: string;
  videoUrl: string;
  users: string[];
}

interface MessageData {
  _id?: string;
  sender: string;
  content: string;
  createdAt: string;
  senderName?: string;
}

const Room: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId] = useState(localStorage.getItem("userId"));
  const [username] = useState(localStorage.getItem("username") || "You");

  const { messages, addMessage, setMessages } = useChatStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem("token");

  const axiosConfig = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token]
  );

  // Scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch room and message data
  useEffect(() => {
    if (!roomId) return;

    const fetchRoomData = async () => {
      setLoading(true);
      try {
        const [roomRes, messageRes] = await Promise.all([ 
          axios.get(`http://localhost:5000/api/rooms/${roomId}`, axiosConfig), 
          axios.get(`http://localhost:5000/api/messages/${roomId}`, axiosConfig),
        ]);
        setRoom(roomRes.data);
        setMessages(
          messageRes.data.map((msg: MessageData) => ({ 
            ...msg, 
            roomId: roomId || "", 
          }))
        );
      } catch (err) {
        setError("Failed to fetch room or messages.");
      }
      setLoading(false);
    };

    fetchRoomData();
  }, [roomId, axiosConfig, setMessages]);

  // Emit join-room once
  useEffect(() => {
    if (roomId && userId) {
      socket.emit("join-room", { roomId, userId });
    }
  }, [roomId, userId]);

  // Handle chat-message once
  useEffect(() => {
    const handleNewMessage = (newMsg: MessageData) => {
      console.log("🔔 New message received via socket:", newMsg);
      if (newMsg.sender !== userId) {
        audioRef.current?.play().catch(() => {});
      }
      addMessage({
        ...newMsg,
        roomId: roomId || "",
        senderName: newMsg.senderName || "Unknown",
      });
    };

    socket.on("chat-message", handleNewMessage);

    return () => {
      socket.off("chat-message", handleNewMessage);
    };
  }, [addMessage, userId, roomId]);

  const handleSendMessage = () => {
    if (!message.trim() || !roomId || !userId || !username) return;

    socket.emit("chat-message", {
      roomId,
      message: {
        sender: userId,
        content: message.trim(),
        senderName: username,
      },
    });

    setMessage("");
  };

  // Handle syncing video state when user joins the room
  useEffect(() => {
    const handleVideoSync = ({
      currentTime,
      state,
    }: {
      currentTime: number;
      state: "playing" | "paused";
    }) => {
      const video = document.querySelector("video");
      if (!video) return;

      video.currentTime = currentTime;
      if (state === "playing") video.play().catch(() => {});
      else video.pause();
    };

    socket.on("video:sync", handleVideoSync);

    return () => {
      socket.off("video:sync", handleVideoSync);
    };
  }, []);

  const handleLeaveRoom = () => {
    if (!roomId || !userId) return;

    axios
      .post(
        `http://localhost:5000/api/rooms/${roomId}/leave`,
        { roomId, userId },
        axiosConfig
      )
      .then(() => {
        socket.emit("leave-room", { roomId, userId });
        navigate("/joinroom");
      })
      .catch(() => setError("Failed to leave room."));
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // const isHost = userId === room?.hostId;

  return (
    <div className="room-container">
      {room && (
        <div className="room-layout">
          <div className="video-section">
            <div className="video-header">
              <h2 style={{ color: "white", marginTop: "-110px" }}>
                Room: {room._id}
              </h2>
              <button className="leave-btn" onClick={handleLeaveRoom}>
                Leave Room
              </button>
            </div>
            <VideoControl
              videoURL={room.videoUrl}
              roomId={room._id}
              userId={userId || ""} 
            />
          </div>

          <div className="chat-section">
            <div className="chat-header">
              <h3>Chat</h3>
            </div>
            <div className="messages">
              {loading ? (
                <div className="loading">Loading messages...</div>
              ) : (
                messages
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(a.createdAt || "").getTime() -
                      new Date(b.createdAt || "").getTime()
                  )
                  .map((msg, index) => (
                    <div
                      key={index}
                      className={`message ${
                        msg.sender === userId ? "own-message" : ""
                      }`}
                    >
                      <div className="meta">
                        <strong>
                          {msg.sender === userId
                            ? "You"
                            : msg.senderName || msg.sender}
                        </strong>
                        <span className="timestamp">
                          {formatTimestamp(msg.createdAt || "")}
                        </span>
                      </div>
                      <div className="content">{msg.content}</div>
                    </div>
                  ))
              )}
              <div ref={chatEndRef} />
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
            <audio ref={audioRef} src={notificationSound} />
          </div>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default Room;
