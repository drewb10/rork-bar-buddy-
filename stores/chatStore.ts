import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  session_id: string;
  content: string;
  likes: number;
  timestamp: string;
  anonymous_name: string;
  venue_id: string;
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

// Type for message with joined session data (as returned by Supabase)
interface MessageWithJoinedSession {
  id: string;
  session_id: string;
  content: string;
  likes: number;
  timestamp: string;
  is_flagged: boolean;
  created_at: string;
  chat_sessions: {
    anonymous_name: string;
    venue_id: string;
  };
}

// Type for message with session data for likes (as returned by Supabase)
interface MessageForLikeWithJoinedSession {
  id: string;
  likes: number;
  chat_sessions: {
    venue_id: string;
  };
}

interface ChatState {
  messages: ChatMessage[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  subscription: any;
  loadMessages: (venueId: string) => Promise<void>;
  sendMessage: (venueId: string, content: string) => Promise<void>;
  likeMessage: (messageId: string, venueId?: string) => Promise<void>;
  createOrGetSession: (venueId: string) => Promise<ChatSession>;
  subscribeToMessages: (venueId: string) => void;
  unsubscribeFromMessages: () => void;
  cleanup: () => void;
  clearError: () => void;
}

// Generate a persistent user ID for anonymous chat
const getUserId = async (): Promise<string> => {
  let userId = '';
  
  if (Platform.OS === 'web') {
    // For web, use localStorage for persistence
    userId = localStorage.getItem('barbuddy-anonymous-user-id') || '';
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
      localStorage.setItem('barbuddy-anonymous-user-id', userId);
    }
  } else {
    // For mobile, use AsyncStorage
    try {
      userId = await AsyncStorage.getItem('barbuddy-anonymous-user-id') || '';
      if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
        await AsyncStorage.setItem('barbuddy-anonymous-user-id', userId);
      }
    } catch (error) {
      console.error('Failed to get/set user ID:', error);
      // Fallback to session-based ID
      userId = 'user_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
    }
  }
  
  return userId;
};

// Generate fun anonymous names
const generateAnonymousName = (userId: string): string => {
  const adjectives = [
    'Cool', 'Happy', 'Chill', 'Fun', 'Wild', 'Smooth', 'Fresh', 'Bold',
    'Epic', 'Rad', 'Zen', 'Swift', 'Bright', 'Clever', 'Witty', 'Groovy'
  ];
  const nouns = [
    'Buddy', 'Pal', 'Friend', 'Mate', 'Champ', 'Hero', 'Star', 'Legend',
    'Ninja', 'Wizard', 'Phoenix', 'Tiger', 'Eagle', 'Wolf', 'Bear', 'Fox'
  ];
  
  // Use userId to generate consistent but random-looking name
  const adjIndex = userId.charCodeAt(0) % adjectives.length;
  const nounIndex = userId.charCodeAt(userId.length - 1) % nouns.length;
  const number = (userId.charCodeAt(Math.floor(userId.length / 2)) % 99) + 1;
  
  return `${adjectives[adjIndex]}${nouns[nounIndex]}${number}`;
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  currentSession: null,
  isLoading: false,
  error: null,
  subscription: null,

  clearError: () => set({ error: null }),

  createOrGetSession: async (venueId: string): Promise<ChatSession> => {
    try {
      set({ isLoading: true, error: null });
      
      if (!venueId) {
        throw new Error('Venue ID is required');
      }

      const userId = await getUserId();
      
      // Check if session already exists for this user and venue
      const { data: existingSession, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingSession) {
        // Update last_active timestamp
        const { data: updatedSession, error: updateError } = await supabase
          .from('chat_sessions')
          .update({ last_active: new Date().toISOString() })
          .eq('id', existingSession.id)
          .select()
          .single();
        
        if (updateError) {
          console.warn('Failed to update session timestamp:', updateError);
          // Continue with existing session even if timestamp update fails
        }
        
        const session = updatedSession || existingSession;
        set({ currentSession: session, isLoading: false });
        return session;
      }

      // Create new session with venue_id
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

      if (createError) {
        throw createError;
      }

      set({ currentSession: newSession, isLoading: false });
      return newSession;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      console.error('Failed to create or get session:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadMessages: async (venueId: string): Promise<void> => {
    try {
      set({ isLoading: true, error: null });
      
      if (!venueId) {
        throw new Error('Venue ID is required');
      }

      // Get messages with session info for anonymous names, filtered by venue through join
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          chat_sessions:chat_sessions(
            anonymous_name,
            venue_id
          )
        `)
        .eq('chat_sessions.venue_id', venueId)
        .order('timestamp', { ascending: true })
        .limit(100);

      if (error) {
        throw error;
      }

      // Transform messages to include anonymous_name and venue_id
      const transformedMessages = (messagesData as MessageWithJoinedSession[])?.map(msg => ({
        ...msg,
        anonymous_name: msg.chat_sessions?.anonymous_name || 'Anonymous Buddy',
        venue_id: msg.chat_sessions?.venue_id || venueId,
      })) || [];

      set({ messages: transformedMessages, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load messages';
      console.error('Failed to load messages:', error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  sendMessage: async (venueId: string, content: string): Promise<void> => {
    try {
      set({ isLoading: true, error: null });
      
      if (!venueId) {
        throw new Error('Venue ID is required');
      }

      if (!content.trim()) {
        throw new Error('Message content is required');
      }

      // Ensure we have a session
      const session = get().currentSession || await get().createOrGetSession(venueId);

      // Insert message with content field
      const { data: newMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: session.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Transform message to include anonymous_name and venue_id from session
      const transformedMessage = {
        ...newMessage,
        anonymous_name: session.anonymous_name,
        venue_id: session.venue_id,
      };

      // Add the new message to current messages
      const currentMessages = get().messages;
      set({ 
        messages: [...currentMessages, transformedMessage],
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      console.error('Failed to send message:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  likeMessage: async (messageId: string, venueId?: string): Promise<void> => {
    try {
      if (!messageId) {
        throw new Error('Message ID is required');
      }

      // Get current message with session data to verify venue and get likes
      const { data: messageData, error: fetchError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          likes,
          chat_sessions:chat_sessions(
            venue_id
          )
        `)
        .eq('id', messageId)
        .single();

      if (fetchError || !messageData) {
        throw new Error('Message not found');
      }

      const messageForLike = messageData as MessageForLikeWithJoinedSession;
      
      if (!messageForLike.chat_sessions) {
        throw new Error('Session data not found');
      }

      const sessionVenueId = messageForLike.chat_sessions.venue_id;

      // Verify venue access if venueId is provided
      if (venueId && sessionVenueId !== venueId) {
        throw new Error('Message does not belong to the specified venue');
      }

      // Increment likes count
      const { data, error } = await supabase
        .from('chat_messages')
        .update({ likes: (messageForLike.likes || 0) + 1 })
        .eq('id', messageId)
        .select('id, likes')
        .single();

      if (error) {
        throw error;
      }

      // Update local state only if this message belongs to the current venue
      const currentMessages = get().messages;
      const messageExists = currentMessages.find(msg => msg.id === messageId);
      
      if (messageExists) {
        const updatedMessages = currentMessages.map(msg =>
          msg.id === messageId ? { ...msg, likes: data.likes } : msg
        );
        set({ messages: updatedMessages });
      }
    } catch (error) {
      console.error('Failed to like message:', error);
      // Don't set error state for like failures as they're not critical
    }
  },

  subscribeToMessages: (venueId: string): void => {
    try {
      if (!venueId) {
        console.error('Cannot subscribe: Venue ID is required');
        return;
      }

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
          },
          async (payload) => {
            try {
              // Get the session info for the new message to check venue and get anonymous name
              const { data: sessionData } = await supabase
                .from('chat_sessions')
                .select('anonymous_name, venue_id')
                .eq('id', payload.new.session_id)
                .single();

              // Only process messages for the current venue
              if (sessionData?.venue_id !== venueId) {
                return;
              }

              const newMessage = {
                ...payload.new,
                anonymous_name: sessionData?.anonymous_name || 'Anonymous Buddy',
                venue_id: sessionData?.venue_id || venueId,
              } as ChatMessage;

              const currentMessages = get().messages;
              // Only add if not already in messages (avoid duplicates)
              if (!currentMessages.find(msg => msg.id === newMessage.id)) {
                set({ messages: [...currentMessages, newMessage] });
              }
            } catch (error) {
              console.error('Failed to process new message:', error);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
          },
          async (payload) => {
            try {
              // Get the session info to check venue
              const { data: sessionData } = await supabase
                .from('chat_sessions')
                .select('venue_id')
                .eq('id', payload.new.session_id)
                .single();

              // Only process updates for the current venue
              if (sessionData?.venue_id !== venueId) {
                return;
              }

              const updatedMessage = payload.new as ChatMessage;
              const currentMessages = get().messages;
              const updatedMessages = currentMessages.map(msg =>
                msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
              );
              set({ messages: updatedMessages });
            } catch (error) {
              console.error('Failed to process message update:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to chat for venue ${venueId}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Failed to subscribe to chat for venue ${venueId}`);
          }
        });

      set({ subscription });
    } catch (error) {
      console.error('Failed to subscribe to messages:', error);
    }
  },

  unsubscribeFromMessages: (): void => {
    try {
      const { subscription } = get();
      if (subscription) {
        supabase.removeChannel(subscription);
        set({ subscription: null });
        console.log('Unsubscribed from chat messages');
      }
    } catch (error) {
      console.error('Failed to unsubscribe from messages:', error);
    }
  },

  cleanup: (): void => {
    get().unsubscribeFromMessages();
    set({ 
      messages: [], 
      currentSession: null, 
      error: null,
      isLoading: false 
    });
  },
}));