import React, { useEffect, useState } from "react";
import axios from "axios";
import "./css/roomjoin.css";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import socket from "../socket";

interface Room {
  _id: string;
  hostId: string;
  videoUrl: string;
  users: string[];
  createdAt: string; 
}

const RoomJoin: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [joinedRooms] = useState<Room[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [roomIdToJoin, setRoomIdToJoin] = useState("");
  const [searchRoomId, setSearchRoomId] = useState("");
  const [searchResult, setSearchResult] = useState<Room | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const navigate = useNavigate();

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Ensure token exists before API requests
  const checkToken = () => {
    if (!token) {
      setError("Please log in to continue.");
      navigate("/login");
      return false;
    }
    return true;
  };

  // ✅ Attach socket events correctly inside the component
  useEffect(() => {
    if (!checkToken()) return;

    const socket = io("http://localhost:5000", {
      query: { token }, // Pass token for socket authentication
    });

    socket.on("newRoom", (newRoom: Room) => {
      setRooms((prev) => [...prev, newRoom]);
    });

    socket.on("roomUserUpdate", () => {
      fetchRooms(); // Or handle specific room update
    });

    return () => {
      socket.off("newRoom");
      socket.off("roomUserUpdate");
    };
  }, [token]);

  const fetchRooms = async () => {
    if (!checkToken()) return;

    try {
      const res = await axios.get(
        "http://localhost:5000/api/rooms",
        axiosConfig
      );
      setRooms(res.data);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError("Failed to fetch rooms.");
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // ✅ Validate video URL
  const isValidUrl = (url: string) => {
    const pattern =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|.+)\S*$/;
    return pattern.test(url);
  };

  const handleCreateRoom = async () => {
    setError("");

    if (!videoUrl.trim() || !userId || !token) {
      return setError("Video URL is required and user must be logged in.");
    }

    if (!isValidUrl(videoUrl.trim())) {
      return setError("Please enter a valid video URL.");
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/rooms/create",
        {
          hostId: userId,
          videoUrl: videoUrl.trim(),
        },
        axiosConfig
      );

      // Emit socket event
      socket.emit("roomCreated", res.data);

      setRooms((prev) => [...prev, res.data]);
      alert("Room created successfully!");
      setVideoUrl("");
    } catch (err) {
      console.error("Error creating room:", err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.error || "Failed to create room.");
      } else {
        setError("Failed to create room.");
      }
    }
  };

  const handleJoinRoom = async () => {
    setError("");

    if (!roomIdToJoin.trim() || !userId || !token) {
      return setError("Room ID and user ID are required.");
    }

    try {
      await axios.post(
        "http://localhost:5000/api/rooms/join",
        { roomId: roomIdToJoin.trim(), userId },
        axiosConfig
      );

      // Emit user join for real-time
      socket.emit("userJoined", {
        roomId: roomIdToJoin.trim(),
        user: userId,
      });

      alert("Joined room successfully!");
      setRoomIdToJoin("");
      navigate(`/rooms/${roomIdToJoin}`);
    } catch (err) {
      console.error("Error joining room:", err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.error || "Failed to join room.");
      } else {
        setError("Failed to join room.");
      }
      setRoomIdToJoin("");
    }
  };

  const handleSearchRoom = async () => {
    if (!searchRoomId.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(
        `http://localhost:5000/api/rooms/${searchRoomId.trim()}`,
        axiosConfig
      );
      setSearchResult(res.data);
    } catch (err) {
      console.error("Error searching room:", err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.error || "Room not found.");
      } else {
        setError("Room not found.");
      }
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "/";
  };

  return (
    <div className="room-container">
      <div className="room-header">
        <h2>Room Portal</h2>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="room-actions">
        <input
          type="text"
          placeholder="Enter Room ID to Join"
          value={roomIdToJoin}
          onChange={(e) => setRoomIdToJoin(e.target.value)}
        />
        <button onClick={handleJoinRoom}>Join Room</button>

        <input
          type="text"
          placeholder="Search Room by ID"
          value={searchRoomId}
          onChange={(e) => setSearchRoomId(e.target.value)}
        />
        <button onClick={handleSearchRoom}>Search Room</button>
      </div>

      <div className="create-room-form">
        <h4>Create a Room</h4>
        <input
          type="text"
          placeholder="Enter Video URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        <button onClick={handleCreateRoom}>Create Room</button>
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Loading...</div>}

      {searchResult && (
        <div className="search-result">
          <h4>Search Result:</h4>
          <p>
            <strong>ID:</strong> {searchResult._id}
          </p>
          <p>
            <strong>Host ID:</strong> {searchResult.hostId}
          </p>
          <p>
            <strong>Video URL:</strong> {searchResult.videoUrl}
          </p>
          <p>
            <strong>Users:</strong> {searchResult.users.length}
          </p>
        </div>
      )}

      <div className="rooms-list">
        <h3>All Available Rooms</h3>
        {rooms
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ) // Sorting by newest
          .map((room) => (
            <div className="room-card" key={room._id}>
              <p>
                <strong>ID:</strong> {room._id}
              </p>
              <p>
                <strong>Video URL:</strong> {room.videoUrl}
              </p>
              <p>
                <strong>Users:</strong> {room.users.length}
              </p>
            </div>
          ))}
      </div>

      <div className="rooms-list joined">
        <h3>My Joined Rooms</h3>
        {joinedRooms.length === 0 ? (
          <p>No rooms joined yet.</p>
        ) : (
          joinedRooms.map((room) => (
            <div className="room-card" key={room._id}>
              <p>
                <strong>ID:</strong> {room._id}
              </p>
              <p>
                <strong>Video URL:</strong> {room.videoUrl}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomJoin;
