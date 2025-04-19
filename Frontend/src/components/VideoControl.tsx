import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./css/VideoControl.css";

const socket = io("http://localhost:5000");

interface VideoControlProps {
  videoURL: string;
  roomId: string;
  isHost: boolean;
}

const VideoControl: React.FC<VideoControlProps> = ({
  videoURL,
  roomId,
  isHost,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // Sync local time updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
    };

    const loaded = () => {
      setDuration(video.duration);
    };

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", loaded);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", loaded);
    };
  }, []);

  // Emit sync events if host
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      if (isHost && !isSyncing) {
        socket.emit("video:play", { roomId, currentTime: video.currentTime });
      }
    };

    const handlePause = () => {
      if (isHost && !isSyncing) {
        socket.emit("video:pause", { roomId, currentTime: video.currentTime });
      }
    };

    const handleSeek = () => {
      if (isHost && !isSyncing) {
        socket.emit("video:seek", { roomId, currentTime: video.currentTime });
      }
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("seeked", handleSeek);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeked", handleSeek);
    };
  }, [isHost, roomId, isSyncing]);

  // Listen to socket events for non-host
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playListener = ({ currentTime }: { currentTime: number }) => {
      if (!isHost) {
        setIsSyncing(true);
        if (Math.abs(video.currentTime - currentTime) > 0.5) {
            videoRef.current!.currentTime = currentTime;
        }
        video.play().finally(() => {
          setIsSyncing(false);
          setIsPlaying(true);
        });
      }
    };

    const pauseListener = ({ currentTime }: { currentTime: number }) => {
      if (!isHost) {
        setIsSyncing(true);
        videoRef.current!.currentTime = currentTime;
        video.pause();
        setIsPlaying(false);
        setTimeout(() => setIsSyncing(false), 300);
      }
    };

    const seekListener = ({ currentTime }: { currentTime: number }) => {
      if (!isHost) {
        setIsSyncing(true);
        videoRef.current!.currentTime = currentTime;
        setTimeout(() => setIsSyncing(false), 300);
      }
    };

    socket.on("video:play", playListener);
    socket.on("video:pause", pauseListener);
    socket.on("video:seek", seekListener);

    return () => {
      socket.off("video:play", playListener);
      socket.off("video:pause", pauseListener);
      socket.off("video:seek", seekListener);
    };
  }, [isHost]);

  // Host play/pause
  const handleCustomPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.play();
    setIsPlaying(true);
  };

  const handleCustomPause = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
  };

  const handleSeekSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!document.fullscreenElement) {
      video.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = parseFloat(e.target.value);
    video.volume = vol;
    setVolume(vol);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="video-control">
      <video
        ref={videoRef}
        src={videoURL}
        className="video-player"
        controls={false}
      />

      <div className="video-time">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      {isHost && (
        <input
          type="range"
          min={0}
          max={duration}
          value={currentTime}
          onChange={handleSeekSlider}
          step={0.1}
          className="video-slider"
        />
      )}

      <div className="video-controls">
        {isHost ? (
          <>
            <button
              onClick={isPlaying ? handleCustomPause : handleCustomPlay}
              className="video-button"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>

            <button onClick={toggleFullscreen} className="video-button">
              Fullscreen
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              className="video-volume"
            />
          </>
        ) : (
          <span className="video-locked-message">🔒 Controlled by host</span>
        )}
      </div>
    </div>
  );
};

export default VideoControl;
