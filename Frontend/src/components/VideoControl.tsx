import React, { useEffect, useRef, useState } from "react";
import socket from "../socket/index";
import "./css/VideoControl.css";
// import { toast } from 'react-toastify';

interface VideoControlProps {
  videoURL: string;
  roomId: string;
  isHost: boolean;
  userId: string;
}

interface VideoSyncPayload {
  roomId: string;
  currentTime: number;
  state: "playing" | "paused";
  timestamp: number;
}

const VideoControl: React.FC<VideoControlProps> = ({
  videoURL,
  roomId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
//   const isSyncingRef = useRef(false);
  const seekTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
    };
  }, []);

  // Sync video play state
  useEffect(() => {
    const handleSyncState = ({
      currentTime,
      state,
    }: VideoSyncPayload) => {
      if (state === "playing" && videoRef.current) {
        videoRef.current.currentTime = currentTime;
        videoRef.current.play().catch(() => {});
      } else if (state === "paused" && videoRef.current) {
        videoRef.current.pause();
      }
    };

    socket.on("video:sync", handleSyncState);

    return () => {
      socket.off("video:sync", handleSyncState);
    };
  }, []);

  // Handle play/pause button click
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        socket.emit("video:sync", {
          roomId,
          currentTime: videoRef.current.currentTime,
          state: "paused",
          timestamp: Date.now(),
        });
      } else {
        videoRef.current.play().catch(() => {});
        socket.emit("video:sync", {
          roomId,
          currentTime: videoRef.current.currentTime,
          state: "playing",
          timestamp: Date.now(),
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle seek action
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    if (seekTimeout.current) {
      clearTimeout(seekTimeout.current);
    }

    seekTimeout.current = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = seekTime;
        socket.emit("video:sync", {
          roomId,
          currentTime: seekTime,
          state: isPlaying ? "playing" : "paused",
          timestamp: Date.now(),
        });
      }
    }, 300);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  return (
    <div className="video-controls">
      <video
        ref={videoRef}
        className="video-player"
        src={videoURL}
        controls={false}
        onClick={handlePlayPause}
      />
      <div className="controls">
        <button className="play-pause" onClick={handlePlayPause}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={handleSeek}
        />
        <input
          type="range"
          min="0"
          max="1"
          value={volume}
          step="0.01"
          onChange={handleVolumeChange}
        />
      </div>
    </div>
  );
};

export default VideoControl;
