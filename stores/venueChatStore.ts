import { create } from 'zustand';
import { trpcClient } from '@/lib/trpc';

interface ChatMessage {
  id: string;
  session_id: string;
  content: string;
  timestamp: string;
  created_at: string;
  anonymous_name: string;
  venue_id: string;
}

interface ChatSession {
  id: string;
  user_id: string;
  venue_id: string;
  anonymous_name: string;
  created_at: string;
  last_active: string;
}

interface VenueChatState {
  messages: ChatMessage[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createOrGetSession: (venueId: string) => Promise<void>;
  loadMessages: (venueId: string) => Promise<void>;
  sendMessage: (venueId: string, content: string) => Promise<void>;
  subscribeToMessages: (venueId: string) => void;
  unsubscribeFromMessages: () => void;
  cleanup: () => void;
  clearError: () => void;
}

// Generate a random anonymous name
const generateAnonymousName = (): string => {
  const adjectives = ['Cool', 'Happy', 'Chill', 'Fun', 'Wild', 'Epic', 'Rad', 'Zen', 'Bold', 'Swift'];
  const nouns = ['Buddy', 'Pal', 'Friend', 'Mate', 'Dude', 'Champ', 'Star', 'Hero', 'Ace', 'Pro'];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  return `${adjective}${noun}${number}`;
};

// Generate a simple user ID (in a real app, this would come from auth)
const getUserId = (): string => {
  let userId = localStorage?.getItem?.('barbuddy_user_id');
  if (!userId) {
    userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    localStorage?.setItem?.('barbuddy_user_id', userId);
  }
  return userId;
};

export const useVenueChatStore = create<VenueChatState>()((set, get) => ({
  messages: [],
  currentSession: null,
  isLoading: false,
  error: null,

  createOrGetSession: async (venueId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const userId = getUserId();
      const anonymousName = generateAnonymousName();
      
      const result = await trpcClient.chat.createSession.mutate({
        userId,
        venueId,
        anonymousName,
      });
      
      if (result.success) {
        set({ currentSession: result.session, isLoading: false });
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create session',
        isLoading: false 
      });
    }
  },

  loadMessages: async (venueId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const result = await trpcClient.chat.getMessages.query({
        venueId,
        limit: 100,
      });
      
      if (result.success) {
        set({ messages: result.messages, isLoading: false });
      } else {
        throw new Error('Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load messages',
        isLoading: false 
      });
    }
  },

  sendMessage: async (venueId: string, content: string) => {
    const { currentSession } = get();
    
    if (!currentSession) {
      throw new Error('No active session');
    }
    
    try {
      set({ error: null });
      
      const result = await trpcClient.chat.sendMessage.mutate({
        sessionId: currentSession.id,
        venueId,
        content,
      });
      
      if (result.success) {
        // Add the new message to the local state
        const { messages } = get();
        set({ messages: [...messages, result.message] });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to send message');
    }
  },

  subscribeToMessages: (venueId: string) => {
    // In a real implementation, this would set up real-time subscriptions
    // For now, we'll just poll for new messages every few seconds
    const pollInterval = setInterval(async () => {
      try {
        const result = await trpcClient.chat.getMessages.query({
          venueId,
          limit: 100,
        });
        
        if (result.success) {
          const { messages } = get();
          // Only update if we have new messages
          if (result.messages.length !== messages.length) {
            set({ messages: result.messages });
          }
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 5000); // Poll every 5 seconds
    
    // Store the interval ID for cleanup
    (get() as any).pollInterval = pollInterval;
  },

  unsubscribeFromMessages: () => {
    const pollInterval = (get() as any).pollInterval;
    if (pollInterval) {
      clearInterval(pollInterval);
      delete (get() as any).pollInterval;
    }
  },

  cleanup: () => {
    get().unsubscribeFromMessages();
    set({ 
      messages: [], 
      currentSession: null, 
      error: null 
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));