import React, { useEffect, useRef, useState } from "react";
import socket from "../socket/index";
import "./css/VideoControl.css";

interface VideoControlProps {
  videoURL: string;
  roomId: string;
  userId: string;
}

interface VideoSyncPayload {
  roomId: string;
  currentTime: number;
  state: "playing" | "paused";
  timestamp: number;
}

const VideoControl: React.FC<VideoControlProps> = ({ videoURL, roomId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Reference for the video container
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const seekTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync video play state across users
  useEffect(() => {
    const handleSyncState = ({
      currentTime,
      state,
    }: VideoSyncPayload) => {
      const video = videoRef.current;
      if (!video) return;

      if (state === "playing") {
        video.currentTime = currentTime;
        if (!isPlaying) {
          video.play().catch(() => {});
        }
      } else if (state === "paused") {
        video.pause();
      }
    };

    socket.on("video:sync", handleSyncState);

    return () => {
      socket.off("video:sync", handleSyncState);
    };
  }, [isPlaying]);

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

  // Play/Pause toggle
  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      socket.emit("video:sync", {
        roomId,
        currentTime: video.currentTime,
        state: "paused",
        timestamp: Date.now(),
      });
    } else {
      video.play().catch(() => {});
      socket.emit("video:sync", {
        roomId,
        currentTime: video.currentTime,
        state: "playing",
        timestamp: Date.now(),
      });
    }

    setIsPlaying(!isPlaying);
  };

  // Seek to specific time
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    if (seekTimeout.current) {
      clearTimeout(seekTimeout.current);
    }

    seekTimeout.current = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;

      video.currentTime = seekTime;
      socket.emit("video:sync", {
        roomId,
        currentTime: seekTime,
        state: isPlaying ? "playing" : "paused",
        timestamp: Date.now(),
      });
    }, 300);
  };

  // Volume control
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
    }
  };

  // Fullscreen toggle
  const handleFullScreen = () => {
    const videoContainer = containerRef.current;
    if (!videoContainer) return;
  
    if (!isFullscreen) {
      // Enter fullscreen mode
      videoContainer.classList.add('fullscreen');
      videoRef.current?.requestFullscreen?.();
    } else {
      // Exit fullscreen mode
      videoContainer.classList.remove('fullscreen');
      document.exitFullscreen?.();
    }
  
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="video-control">
      <div ref={containerRef} className="video-container">
        <video
          ref={videoRef}
          className="video-player"
          src={videoURL}
          controls={false}
        />
      </div>
      <div className="video-time">{`Time: ${Math.floor(currentTime)} / ${Math.floor(duration)}`}</div>
      <div className="video-controls">
        <button className="video-button" onClick={handlePlayPause}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          className="video-slider"
        />
        <input
          type="range"
          min="0"
          max="1"
          value={volume}
          step="0.01"
          onChange={handleVolumeChange}
          className="video-volume"
        />
        <button className="video-button" onClick={handleFullScreen}>
          Fullscreen
        </button>
      </div>
    </div>
  );
};

export default VideoControl;
