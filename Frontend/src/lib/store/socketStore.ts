// store/socketStore.ts
import { create } from 'zustand'

interface SocketStore {
  isConnected: boolean
  currentRoom: string
  setConnected: (status: boolean) => void
  setRoom: (roomId: string) => void
}

export const useSocketStore = create<SocketStore>((set) => ({
  isConnected: false,
  currentRoom: "",
  setConnected: (status) => set({ isConnected: status }),
  setRoom: (roomId) => set({ currentRoom: roomId })
}))
