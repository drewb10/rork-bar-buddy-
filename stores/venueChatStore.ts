import { create } from 'zustand';

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

// Mock data for demonstration (in real app, this would come from Supabase)
let mockSessions: ChatSession[] = [];
let mockMessages: ChatMessage[] = [];

export const useVenueChatStore = create<VenueChatState>()((set, get) => ({
  messages: [],
  currentSession: null,
  isLoading: false,
  error: null,

  createOrGetSession: async (venueId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const userId = getUserId();
      
      // Check if session exists for this venue and user
      let session = mockSessions.find(s => s.venue_id === venueId && s.user_id === userId);
      
      if (!session) {
        // Create new session
        const anonymousName = generateAnonymousName();
        session = {
          id: `session_${Math.random().toString(36).substr(2, 9)}`,
          user_id: userId,
          venue_id: venueId,
          anonymous_name: anonymousName,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
        };
        mockSessions.push(session);
      }
      
      set({ currentSession: session, isLoading: false });
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
      
      // Filter messages for this venue (reset daily at 5 AM)
      const now = new Date();
      const resetTime = new Date(now);
      resetTime.setHours(5, 0, 0, 0);
      
      // If it's before 5 AM, use yesterday's 5 AM as reset time
      if (now.getHours() < 5) {
        resetTime.setDate(resetTime.getDate() - 1);
      }
      
      const venueMessages = mockMessages.filter(msg => 
        msg.venue_id === venueId && 
        new Date(msg.created_at) >= resetTime
      );
      
      set({ messages: venueMessages, isLoading: false });
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
      
      const newMessage: ChatMessage = {
        id: `msg_${Math.random().toString(36).substr(2, 9)}`,
        session_id: currentSession.id,
        venue_id: venueId,
        content,
        anonymous_name: currentSession.anonymous_name,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      
      // Add to mock storage
      mockMessages.push(newMessage);
      
      // Add the new message to the local state
      const { messages } = get();
      set({ messages: [...messages, newMessage] });
      
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
        const now = new Date();
        const resetTime = new Date(now);
        resetTime.setHours(5, 0, 0, 0);
        
        if (now.getHours() < 5) {
          resetTime.setDate(resetTime.getDate() - 1);
        }
        
        const venueMessages = mockMessages.filter(msg => 
          msg.venue_id === venueId && 
          new Date(msg.created_at) >= resetTime
        );
        
        const { messages } = get();
        // Only update if we have new messages
        if (venueMessages.length !== messages.length) {
          set({ messages: venueMessages });
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