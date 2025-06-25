import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  likes?: number;
  isLiked?: boolean;
}

interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  lastResetAt: Date;
}

interface ChatState {
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  sendMessage: (text: string) => Promise<void>;
  likeMessage: (messageId: string) => void;
  resetChatOnAppReopen: () => void;
  checkAndResetDaily: () => void;
  clearError: () => void;
}

const createNewSession = (): ChatSession => ({
  id: Math.random().toString(36).substr(2, 9),
  messages: [],
  createdAt: new Date(),
  lastResetAt: new Date(),
});

const shouldResetAt5AM = (lastResetAt: Date): boolean => {
  const now = new Date();
  const resetTime = new Date(now);
  resetTime.setHours(5, 0, 0, 0);
  
  // If it's past 5 AM today and last reset was before today's 5 AM, reset
  if (now >= resetTime && lastResetAt < resetTime) {
    return true;
  }
  
  // If it's before 5 AM today, check if last reset was before yesterday's 5 AM
  if (now < resetTime) {
    const yesterdayResetTime = new Date(resetTime);
    yesterdayResetTime.setDate(yesterdayResetTime.getDate() - 1);
    return lastResetAt < yesterdayResetTime;
  }
  
  return false;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      isLoading: false,
      error: null,

      sendMessage: async (text: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { currentSession } = get();
          let session = currentSession;
          
          if (!session) {
            session = createNewSession();
          }

          // Add user message
          const userMessage: Message = {
            id: Math.random().toString(36).substr(2, 9),
            text,
            isUser: true,
            timestamp: new Date(),
          };

          const updatedMessages = [...session.messages, userMessage];

          // Update session with user message
          set({
            currentSession: {
              ...session,
              messages: updatedMessages,
            },
          });

          // Prepare messages for AI API
          const messages = updatedMessages.map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.text,
          }));

          // Add system message for context
          const systemMessage = {
            role: 'system',
            content: 'You are BarBuddy, a friendly AI assistant for a bar and nightlife app. Help users with questions about bars, drinks, nightlife, and social activities. Keep responses conversational and fun.',
          };

          // Call AI API
          const response = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [systemMessage, ...messages],
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to get AI response');
          }

          const data = await response.json();
          
          // Add AI response
          const aiMessage: Message = {
            id: Math.random().toString(36).substr(2, 9),
            text: data.completion,
            isUser: false,
            timestamp: new Date(),
            likes: 0,
            isLiked: false,
          };

          const finalMessages = [...updatedMessages, aiMessage];

          set({
            currentSession: {
              ...session,
              messages: finalMessages,
            },
            isLoading: false,
          });

        } catch (error) {
          console.error('Error sending message:', error);
          set({
            error: 'Failed to send message. Please try again.',
            isLoading: false,
          });
        }
      },

      likeMessage: (messageId: string) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const updatedMessages = currentSession.messages.map(msg => {
          if (msg.id === messageId && !msg.isUser) {
            return {
              ...msg,
              isLiked: !msg.isLiked,
              likes: (msg.likes || 0) + (msg.isLiked ? -1 : 1),
            };
          }
          return msg;
        });

        set({
          currentSession: {
            ...currentSession,
            messages: updatedMessages,
          },
        });
      },

      resetChatOnAppReopen: () => {
        const { currentSession } = get();
        
        // Check if we need to reset based on 5 AM rule
        if (!currentSession || shouldResetAt5AM(currentSession.lastResetAt)) {
          const newSession = createNewSession();
          set({ currentSession: newSession });
        }
      },

      checkAndResetDaily: () => {
        const { currentSession } = get();
        
        if (currentSession && shouldResetAt5AM(currentSession.lastResetAt)) {
          const newSession = createNewSession();
          set({ currentSession: newSession });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentSession: state.currentSession,
      }),
    }
  )
);