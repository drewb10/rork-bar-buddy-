import { create } from 'zustand';
import { trpcClient } from '@/lib/trpc';

export interface ChatMessage {
  id: string;
  venueId: string;
  userId: string;
  content: string;
  timestamp: string;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  loadMessages: (venueId: string) => Promise<void>;
  sendMessage: (venueId: string, content: string) => Promise<void>;
}

// Generate a simple user ID for anonymous chat
const getUserId = () => {
  let userId = '';
  if (typeof window !== 'undefined') {
    // For web, use sessionStorage instead of localStorage
    userId = sessionStorage.getItem('anonymous-user-id') || '';
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('anonymous-user-id', userId);
    }
  } else {
    // For mobile, generate a session-based ID
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
  }
  return userId;
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,

  loadMessages: async (venueId: string) => {
    try {
      set({ isLoading: true });
      const messages = await trpcClient.chat.getMessages.query({ venueId });
      set({ messages, isLoading: false });
    } catch (error) {
      console.error('Failed to load messages:', error);
      set({ isLoading: false });
    }
  },

  sendMessage: async (venueId: string, content: string) => {
    try {
      set({ isLoading: true });
      const userId = getUserId();
      
      const newMessage = await trpcClient.chat.sendMessage.mutate({
        venueId,
        userId,
        content,
      });

      // Add the new message to the current messages
      const currentMessages = get().messages;
      set({ 
        messages: [...currentMessages, newMessage],
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      set({ isLoading: false });
      throw error;
    }
  },
}));