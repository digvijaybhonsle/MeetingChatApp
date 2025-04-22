import { create } from "zustand";

interface Message {
  _id?: string;
  roomId: string;
  sender: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  senderName?: string;
}

interface ChatState {
  messages: Message[];
  setMessages: (msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  setMessages: (msgs) => set({ messages: msgs }),
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),
}));
