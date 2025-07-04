/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import socket from "../socket/index";
import "./css/videoControl.css";
import { videoStore } from "../lib/store/videoStore"; // Zustand store

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT: any;
  }
}

interface VideoControlProps {
  videoURL: string;
  roomId: string;
  userId: string;
}

const extractYouTubeVideoId = (url: string) => {
  const regExp =
    /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
};

const VideoControl: React.FC<VideoControlProps> = ({ videoURL, roomId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);
  const seekTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isYouTube, setIsYouTube] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);

  const isPlaying = videoStore((state) => state.isPlaying);
  const currentTime = videoStore((state) => state.currentTime);
  const duration = videoStore((state) => state.duration);
  const volume = videoStore((state) => state.volume);
  const isFullscreen = videoStore((state) => state.isFullscreen);

  const setPlaying = videoStore((state) => state.playVideo);
  const setPaused = videoStore((state) => state.pauseVideo);
  const setCurrentTime = videoStore((state) => state.updateCurrentTime);
  const setDuration = videoStore((state) => state.updateDuration);
  const setVolume = videoStore((state) => state.updateVolume);
  const toggleFullscreen = videoStore((state) => state.toggleFullscreen);

  useEffect(() => {
    setIsYouTube(
      videoURL.includes("youtube.com") || videoURL.includes("youtu.be")
    );
    setIsClientReady(true); // Now safe to render based on client-only data
  }, [videoURL]);

  useEffect(() => {
    const handleSync = ({
      currentTime,
      state,
    }: {
      currentTime: number;
      state: "playing" | "paused";
    }) => {
      const video = videoRef.current;
      if (!video) return;

      if (isSyncing.current) return;

      isSyncing.current = true;

      // Sync video time and state (play or pause)
      if (Math.abs(video.currentTime - currentTime) > 0.5) {
        video.currentTime = currentTime;
      }

      if (state === "playing") {
        video.play();
        setPlaying();
      } else {
        video.pause();
        setPaused();
      }

      setTimeout(() => (isSyncing.current = false), 300);  // Clear sync flag
    };

    socket.on("video:sync", handleSync);
    return () => {
      socket.off("video:sync", handleSync);
    };
  }, [setPlaying, setPaused]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDurationHandler = () => setDuration(video.duration);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDurationHandler);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDurationHandler);
    };
  }, [setCurrentTime, setDuration]);

  const emitSync = (state: "playing" | "paused", time?: number) => {
    const video = videoRef.current;
    if (!video) return;

    socket.emit("video:sync", {
      roomId,
      currentTime: time ?? video.currentTime,
      state,
      timestamp: Date.now(),
    });
  };

  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video || isSyncing.current) return;

    isSyncing.current = true;
    if (video.paused) {
      await video.play();
      setPlaying();
      emitSync("playing");  // Emit sync immediately after play
    } else {
      video.pause();
      setPaused();
      emitSync("paused");  // Emit sync immediately after pause
    }

    setTimeout(() => (isSyncing.current = false), 300);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);

    if (seekTimeout.current) clearTimeout(seekTimeout.current);

    seekTimeout.current = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;

      // Sync the video time and emit the seek event
      video.currentTime = time;

      emitSync(video.paused ? "paused" : "playing", time); // Emit the new seek time
      setCurrentTime(time);  // Update currentTime immediately
    }, 100);  // Shortened delay for better feedback
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
    }
  };

  const handleFullScreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    toggleFullscreen();
  };

  const renderVideoPlayer = () => {
    if (!isClientReady) {
      return (
        <div style={{ height: 400, backgroundColor: "#000" }}>Loading...</div>
      );
    }

    if (isYouTube) {
      return (
        <div id="yt-player-container">
          <div id="yt-player" />
        </div>
      );
    } else {
      return (
        <video
          ref={videoRef}
          className="video-player"
          src={videoURL}
          controls={false}
        />
      );
    }
  };

  useEffect(() => {
    if (isYouTube && window && typeof window !== "undefined") {
      const playerScript = document.createElement("script");
      playerScript.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(playerScript);

      window.onYouTubeIframeAPIReady = () => {
        const videoId = extractYouTubeVideoId(videoURL);
        if (!videoId) {
          console.error("Invalid YouTube URL:", videoURL);
          return;
        }

        new window.YT.Player("yt-player", {
          videoId,
          events: {
            onStateChange: (event: any) => {
              // Prevent recursive updates
              if (isSyncing.current) return;

              const videoState =
                event.data === window.YT.PlayerState.PLAYING
                  ? "playing"
                  : "paused";
              emitSync(videoState);
            },
            onReady: (event: any) => {
              event.target.playVideo();
            },
          },
        });
      };
    }
  }, [videoURL, isYouTube]);

  return (
    <div className="video-control">
      <div ref={containerRef} className="video-container">
        {renderVideoPlayer()}
      </div>
      <div className="video-time">
        {/* Time: {Math.floor(currentTime)} / {Math.floor(duration)} */}
      </div>
      <div className="video-controls">
        <button className="video-button" onClick={handlePlayPause}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onInput={handleSeek}
          className="video-slider"
        />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="video-volume"
        />
        <button className="video-button" onClick={handleFullScreen}>
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
      </div>
    </div>
  );
};

export default VideoControl;
