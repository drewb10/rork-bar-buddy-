import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  session_id: string;
  venue_id: string;
  content: string;
  likes: number;
  timestamp: string;
  anonymous_name: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  venue_id: string;
  anonymous_name: string;
  created_at: string;
  last_active: string;
}

interface ChatState {
  messages: ChatMessage[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  subscription: any;
  loadMessages: (venueId: string) => Promise<void>;
  sendMessage: (venueId: string, content: string) => Promise<void>;
  likeMessage: (messageId: string) => Promise<void>;
  createOrGetSession: (venueId: string) => Promise<ChatSession>;
  subscribeToMessages: (venueId: string) => void;
  unsubscribeFromMessages: () => void;
  cleanup: () => void;
}

// Generate a simple user ID for anonymous chat
const getUserId = async () => {
  let userId = '';
  
  if (Platform.OS === 'web') {
    // For web, use sessionStorage
    userId = sessionStorage.getItem('anonymous-user-id') || '';
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('anonymous-user-id', userId);
    }
  } else {
    // For mobile, use AsyncStorage
    try {
      userId = await AsyncStorage.getItem('anonymous-user-id') || '';
      if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem('anonymous-user-id', userId);
      }
    } catch (error) {
      // Fallback to session-based ID
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
    }
  }
  
  return userId;
};

// Generate anonymous name - changed from "Fun Friend" to "Buddy"
const generateAnonymousName = (userId: string) => {
  const adjectives = ['Cool', 'Happy', 'Chill', 'Fun', 'Wild', 'Smooth', 'Fresh', 'Bold'];
  const adjIndex = userId.length % adjectives.length;
  return `${adjectives[adjIndex]} Buddy`;
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  currentSession: null,
  isLoading: false,
  subscription: null,

  createOrGetSession: async (venueId: string) => {
    try {
      const userId = await getUserId();
      
      // Check if session already exists
      const { data: existingSession, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .single();

      if (existingSession && !fetchError) {
        // Update last_active
        const { data: updatedSession } = await supabase
          .from('chat_sessions')
          .update({ last_active: new Date().toISOString() })
          .eq('id', existingSession.id)
          .select()
          .single();
        
        const session = updatedSession || existingSession;
        set({ currentSession: session });
        return session;
      }

      // Create new session
      const anonymousName = generateAnonymousName(userId);
      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          venue_id: venueId,
          anonymous_name: anonymousName,
        })
        .select()
        .single();

      if (createError) throw createError;

      set({ currentSession: newSession });
      return newSession;
    } catch (error) {
      console.error('Failed to create or get session:', error);
      throw error;
    }
  },

  loadMessages: async (venueId: string) => {
    try {
      set({ isLoading: true });
      
      // Get messages with session info for anonymous names
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          chat_sessions!inner(anonymous_name)
        `)
        .eq('venue_id', venueId)
        .order('timestamp', { ascending: true })
        .limit(50);

      if (error) throw error;

      // Transform messages to include anonymous_name
      const transformedMessages = messages?.map(msg => ({
        ...msg,
        anonymous_name: msg.chat_sessions.anonymous_name,
      })) || [];

      set({ messages: transformedMessages, isLoading: false });
    } catch (error) {
      console.error('Failed to load messages:', error);
      set({ isLoading: false });
    }
  },

  sendMessage: async (venueId: string, content: string) => {
    try {
      set({ isLoading: true });
      
      // Ensure we have a session
      const session = get().currentSession || await get().createOrGetSession(venueId);

      const { data: newMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: session.id,
          venue_id: venueId,
          content: content.trim(),
        })
        .select(`
          *,
          chat_sessions!inner(anonymous_name)
        `)
        .single();

      if (error) throw error;

      // Transform message to include anonymous_name
      const transformedMessage = {
        ...newMessage,
        anonymous_name: newMessage.chat_sessions.anonymous_name,
      };

      // Add the new message to current messages
      const currentMessages = get().messages;
      set({ 
        messages: [...currentMessages, transformedMessage],
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  likeMessage: async (messageId: string) => {
    try {
      // First get the current likes count
      const { data: currentMessage, error: fetchError } = await supabase
        .from('chat_messages')
        .select('likes')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      // Increment likes count
      const { data, error } = await supabase
        .from('chat_messages')
        .update({ likes: (currentMessage.likes || 0) + 1 })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const currentMessages = get().messages;
      const updatedMessages = currentMessages.map(msg =>
        msg.id === messageId ? { ...msg, likes: data.likes } : msg
      );
      set({ messages: updatedMessages });
    } catch (error) {
      console.error('Failed to like message:', error);
    }
  },

  subscribeToMessages: (venueId: string) => {
    // Unsubscribe from any existing subscription
    get().unsubscribeFromMessages();

    const subscription = supabase
      .channel(`chat_messages_${venueId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `venue_id=eq.${venueId}`,
        },
        async (payload) => {
          // Get the session info for the new message
          const { data: sessionData } = await supabase
            .from('chat_sessions')
            .select('anonymous_name')
            .eq('id', payload.new.session_id)
            .single();

          const newMessage = {
            ...payload.new,
            anonymous_name: sessionData?.anonymous_name || 'Anonymous Buddy',
          } as ChatMessage;

          const currentMessages = get().messages;
          // Only add if not already in messages (avoid duplicates)
          if (!currentMessages.find(msg => msg.id === newMessage.id)) {
            set({ messages: [...currentMessages, newMessage] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `venue_id=eq.${venueId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          const currentMessages = get().messages;
          const updatedMessages = currentMessages.map(msg =>
            msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
          );
          set({ messages: updatedMessages });
        }
      )
      .subscribe();

    set({ subscription });
  },

  unsubscribeFromMessages: () => {
    const { subscription } = get();
    if (subscription) {
      supabase.removeChannel(subscription);
      set({ subscription: null });
    }
  },

  cleanup: () => {
    get().unsubscribeFromMessages();
    set({ messages: [], currentSession: null });
  },
}));