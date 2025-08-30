import { create } from 'zustand';
import { ChatMessage, ChatMessageCreate } from '../types';
import { chatApi } from '../services/api';
import { socketService } from '../services/socket';

interface ChatStore {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  connected: boolean;

  // Actions
  fetchMessages: () => Promise<void>;
  sendMessage: (message: ChatMessageCreate) => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
  addMessage: (message: ChatMessage) => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  connected: false,

  fetchMessages: async () => {
    set({ loading: true, error: null });
    try {
      const messages = await chatApi.getMessages();
      set({ messages, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch messages', loading: false });
    }
  },

  sendMessage: async (messageData: ChatMessageCreate) => {
    try {
      // Send through socket for real-time
      if (socketService.isConnected()) {
        socketService.sendMessage(messageData);
      }
      
      // Also save to database
      await chatApi.createMessage(messageData);
      
      // Refetch messages to update the UI
      await get().fetchMessages();
    } catch (error) {
      set({ error: 'Failed to send message' });
    }
  },

  connectSocket: () => {
    socketService.connect();
    
    // Listen for incoming messages
    socketService.onReceiveMessage((message: ChatMessage) => {
      get().addMessage(message);
    });
    
    set({ connected: true });
  },

  disconnectSocket: () => {
    socketService.disconnect();
    set({ connected: false });
  },

  addMessage: (message: ChatMessage) => {
    const { messages } = get();
    set({ messages: [...messages, message] });
  },

  setError: (error: string | null) => set({ error }),
}));