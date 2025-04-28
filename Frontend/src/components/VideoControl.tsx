/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from "react";
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

const VideoControl: React.FC<VideoControlProps> = ({ videoURL, roomId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);
  const seekTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isFullscreen,
    setPlaying,
    setPaused,
    setCurrentTime,
    setDuration,
    setVolume,
    toggleFullscreen,
  } = videoStore((state) => ({
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    duration: state.duration,
    volume: state.volume,
    isFullscreen: state.isFullscreen,
    setPlaying: state.playVideo,
    setPaused: state.pauseVideo,
    setCurrentTime: state.updateCurrentTime,
    setDuration: state.updateDuration,
    setVolume: state.updateVolume,
    toggleFullscreen: state.toggleFullscreen,
  }));

  const isYouTube =
    videoURL.includes("youtube.com") || videoURL.includes("youtu.be");

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

      isSyncing.current = true;
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

      setTimeout(() => (isSyncing.current = false), 300);
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

  const emitSync = React.useCallback(
    (state: "playing" | "paused", time?: number) => {
      const video = videoRef.current;
      if (!video) return;
      socket.emit("video:sync", {
        roomId,
        currentTime: time ?? video.currentTime,
        state,
        timestamp: Date.now(),
      });
    },
    [roomId]
  );

  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video || isSyncing.current) return;

    if (video.paused) {
      await video.play();
      setPlaying();
      if (isYouTube) {
        socket.emit("video:play", { roomId, currentTime: video.currentTime });
      } else {
        emitSync("playing");
      }
    } else {
      video.pause();
      setPaused();
      if (isYouTube) {
        socket.emit("video:pause", { roomId, currentTime: video.currentTime });
      } else {
        emitSync("paused");
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (seekTimeout.current) clearTimeout(seekTimeout.current);

    seekTimeout.current = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = time;
      if (isYouTube) {
        socket.emit("video:seek", {
          roomId,
          currentTime: time,
          state: video.paused ? "paused" : "playing",
          timestamp: Date.now(),
        });
      } else {
        emitSync(video.paused ? "paused" : "playing", time);
      }
      setCurrentTime(time);
    }, 300);
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
    if (!videoURL) {
      return <div>Loading video...</div>; // or you can return null
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
    if (isYouTube) {
      const playerScript = document.createElement("script");
      playerScript.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(playerScript);

      window.onYouTubeIframeAPIReady = () => {
        new window.YT.Player("yt-player", {
          videoId: videoURL.split("v=")[1],
          events: {
            onStateChange: (event: any) => {
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
  }, [videoURL, isYouTube, emitSync]);

  return (
    <div className="video-control">
      <div ref={containerRef} className="video-container">
        {videoURL ? renderVideoPlayer() : <div>Loading Video...</div>}
      </div>
      <div className="video-time">
        {`Time: ${Math.floor(currentTime)} / ${Math.floor(duration)}`}
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
          onChange={handleSeek}
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
