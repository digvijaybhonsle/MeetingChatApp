import { create } from "zustand";

interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isFullscreen: boolean;
  playVideo: () => void;
  pauseVideo: () => void;
  updateCurrentTime: (time: number) => void;
  updateDuration: (duration: number) => void;
  updateVolume: (volume: number) => void;
  toggleFullscreen: () => void;
}

export const videoStore = create<VideoState>((set) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isFullscreen: false,

  playVideo: () => set({ isPlaying: true }),
  pauseVideo: () => set({ isPlaying: false }),

  updateCurrentTime: (time: number) => set({ currentTime: time }),
  updateDuration: (duration: number) => set({ duration }),
  updateVolume: (volume: number) => set({ volume }),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
}));
