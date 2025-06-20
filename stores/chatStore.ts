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
  sendMessage: (venueId: string, content: string) => Promise<void>;
  loadMessages: (venueId: string) => Promise<void>;
  clearMessages: () => void;
}

// Generate a simple anonymous user ID for this session
const generateAnonymousUserId = (): string => {
  const stored = localStorage?.getItem('anonymous-user-id');
  if (stored) return stored;
  
  const id = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage?.setItem('anonymous-user-id', id);
  return id;
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,

  sendMessage: async (venueId: string, content: string) => {
    try {
      set({ isLoading: true });
      
      const userId = generateAnonymousUserId();
      const message: ChatMessage = {
        id: `${Date.now()}_${Math.random()}`,
        venueId,
        userId,
        content,
        timestamp: new Date().toISOString(),
      };

      // Add message optimistically
      set(state => ({
        messages: [...state.messages, message]
      }));

      // Send to backend
      await trpcClient.chat.sendMessage.mutate({
        venueId,
        userId,
        content,
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove the optimistic message on error
      set(state => ({
        messages: state.messages.filter(m => m.id !== `${Date.now()}_${Math.random()}`)
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  loadMessages: async (venueId: string) => {
    try {
      set({ isLoading: true });
      
      const messages = await trpcClient.chat.getMessages.query({ venueId });
      set({ messages });
      
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Use mock messages for now
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          venueId,
          userId: 'user1',
          content: 'Anyone here tonight?',
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        },
        {
          id: '2',
          venueId,
          userId: 'user2',
          content: 'Yeah! Great crowd tonight 🍻',
          timestamp: new Date(Date.now() - 240000).toISOString(), // 4 minutes ago
        },
        {
          id: '3',
          venueId,
          userId: 'user3',
          content: 'The music is awesome!',
          timestamp: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
        },
      ];
      set({ messages: mockMessages });
    } finally {
      set({ isLoading: false });
    }
  },

  clearMessages: () => {
    set({ messages: [] });
  },
}));