import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  session_id: string;
  content: string;
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

interface RawMessageFromSupabase {
  id: string;
  session_id: string;
  message: string;  // Database uses 'message' column
  timestamp: string;
  created_at: string;
  chat_sessions: {
    id: string;
    anonymous_name: string;
    venue_id: string;
  } | null;
}

interface ChatState {
  messages: ChatMessage[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  subscription: any;
  appStartTime: number; // Track when app started
  loadMessages: (venueId: string) => Promise<void>;
  sendMessage: (venueId: string, content: string) => Promise<void>;
  createOrGetSession: (venueId: string) => Promise<ChatSession>;
  subscribeToMessages: (venueId: string) => void;
  unsubscribeFromMessages: () => void;
  cleanup: () => void;
  clearError: () => void;
  resetChatOnAppReopen: () => void;
}

const getUserId = async (): Promise<string> => {
  let userId = '';
  
  if (Platform.OS === 'web') {
    userId = localStorage.getItem('barbuddy-anonymous-user-id') || '';
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
      localStorage.setItem('barbuddy-anonymous-user-id', userId);
    }
  } else {
    try {
      userId = await AsyncStorage.getItem('barbuddy-anonymous-user-id') || '';
      if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
        await AsyncStorage.setItem('barbuddy-anonymous-user-id', userId);
      }
    } catch (error) {
      console.error('Failed to get/set user ID:', error);
      userId = 'user_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
    }
  }
  
  return userId;
};

const generateAnonymousName = (userId: string): string => {
  const adjectives = [
    'Cool', 'Happy', 'Chill', 'Fun', 'Wild', 'Smooth', 'Fresh', 'Bold',
    'Epic', 'Rad', 'Zen', 'Swift', 'Bright', 'Clever', 'Witty', 'Groovy'
  ];
  const nouns = [
    'Buddy', 'Pal', 'Friend', 'Mate', 'Champ', 'Hero', 'Star', 'Legend',
    'Ninja', 'Wizard', 'Phoenix', 'Tiger', 'Eagle', 'Wolf', 'Bear', 'Fox'
  ];
  
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
  appStartTime: Date.now(), // Initialize with current time

  clearError: () => set({ error: null }),

  resetChatOnAppReopen: () => {
    // Clear all chat-related state to ensure fresh start
    set({ 
      messages: [], 
      currentSession: null, 
      error: null,
      isLoading: false,
      appStartTime: Date.now() // Update app start time
    });
    
    // Clean up any existing subscriptions
    get().unsubscribeFromMessages();
  },

  createOrGetSession: async (venueId: string): Promise<ChatSession> => {
    try {
      set({ isLoading: true, error: null });
      
      if (!venueId || venueId.trim() === '') {
        throw new Error('Venue ID is required and cannot be empty');
      }

      const userId = await getUserId();
      
      // Check for existing session with better error handling
      const { data: existingSession, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn('Session fetch error (non-critical):', fetchError);
        // Don't throw error, continue with creating new session
      }

      if (existingSession) {
        // Update last_active timestamp with error handling
        const { data: updatedSession, error: updateError } = await supabase
          .from('chat_sessions')
          .update({ last_active: new Date().toISOString() })
          .eq('id', existingSession.id)
          .select()
          .single();
        
        if (updateError) {
          console.warn('Failed to update session timestamp (non-critical):', updateError);
          // Use existing session if update fails
        }
        
        const session = updatedSession || existingSession;
        set({ currentSession: session, isLoading: false });
        return session;
      }

      // Create new session with error handling
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
        console.warn('Session creation error:', createError);
        throw new Error('Failed to create chat session. Please try again.');
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
      
      if (!venueId || venueId.trim() === '') {
        throw new Error('Venue ID is required and cannot be empty');
      }

      // Only load messages that were created after app start time to ensure fresh chat
      const appStartTime = get().appStartTime;
      const startTimeISO = new Date(appStartTime).toISOString();

      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          session_id,
          message,
          timestamp,
          created_at,
          chat_sessions!inner(
            id,
            anonymous_name,
            venue_id
          )
        `)
        .eq('chat_sessions.venue_id', venueId)
        .gte('created_at', startTimeISO) // Only load messages after app start
        .order('timestamp', { ascending: true })
        .limit(100);

      if (error) {
        console.warn('Messages query error (non-critical):', error);
        // Don't throw error, just set empty messages
        set({ messages: [], isLoading: false });
        return;
      }

      const transformedMessages: ChatMessage[] = (messagesData as unknown as RawMessageFromSupabase[])?.map(msg => {
        const sessionData = msg.chat_sessions;

        return {
          id: msg.id,
          session_id: msg.session_id,
          content: msg.message,  // Map 'message' to 'content' for frontend
          timestamp: msg.timestamp,
          created_at: msg.created_at,
          anonymous_name: sessionData?.anonymous_name || 'Anonymous Buddy',
          venue_id: sessionData?.venue_id || venueId,
        };
      }).filter(msg => {
        return msg.venue_id === venueId;
      }) || [];

      set({ messages: transformedMessages, isLoading: false });
    } catch (error) {
      console.warn('Failed to load messages (non-critical):', error);
      set({ error: null, isLoading: false, messages: [] }); // Don't show error to user
    }
  },

  sendMessage: async (venueId: string, content: string): Promise<void> => {
    try {
      set({ isLoading: true, error: null });
      
      if (!venueId || venueId.trim() === '') {
        throw new Error('Venue ID is required and cannot be empty');
      }

      if (!content || content.trim() === '') {
        throw new Error('Message content is required and cannot be empty');
      }

      const trimmedContent = content.trim();
      if (trimmedContent.length === 0) {
        throw new Error('Message content cannot be empty after trimming');
      }

      const session = get().currentSession || await get().createOrGetSession(venueId);

      // Insert message with 'message' column name
      const { data: newMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: session.id,
          message: trimmedContent,  // Use 'message' column name
        })
        .select(`
          id,
          session_id,
          message,
          timestamp,
          created_at
        `)
        .single();

      if (error) {
        console.warn('Insert message error:', error);
        throw new Error('Failed to send message. Please try again.');
      }

      const transformedMessage: ChatMessage = {
        ...newMessage,
        content: newMessage.message,  // Map 'message' to 'content' for frontend
        anonymous_name: session.anonymous_name,
        venue_id: session.venue_id,
      };

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

  subscribeToMessages: (venueId: string): void => {
    try {
      if (!venueId || venueId.trim() === '') {
        console.warn('Cannot subscribe: Venue ID is required and cannot be empty');
        return;
      }

      // Clean up existing subscription first to prevent multiple subscriptions
      get().unsubscribeFromMessages();

      // Create a unique channel name to avoid conflicts
      const channelName = `chat_messages_${venueId}_${Date.now()}`;
      
      const subscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
          },
          async (payload) => {
            try {
              // Only process messages created after app start time
              const appStartTime = get().appStartTime;
              const messageCreatedAt = new Date(payload.new.created_at).getTime();
              
              if (messageCreatedAt < appStartTime) {
                return; // Ignore messages from before app start
              }

              // Verify the message belongs to the current venue
              const { data: sessionData, error: sessionError } = await supabase
                .from('chat_sessions')
                .select('id, anonymous_name, venue_id')
                .eq('id', payload.new.session_id)
                .single();

              if (sessionError) {
                console.warn('Failed to get session data for new message (non-critical):', sessionError);
                return;
              }

              // Only add message if it belongs to the current venue
              if (sessionData?.venue_id !== venueId) {
                return;
              }

              const newMessage: ChatMessage = {
                id: payload.new.id,
                session_id: payload.new.session_id,
                content: payload.new.message,  // Map 'message' to 'content'
                timestamp: payload.new.timestamp,
                created_at: payload.new.created_at,
                anonymous_name: sessionData?.anonymous_name || 'Anonymous Buddy',
                venue_id: sessionData?.venue_id || venueId,
              };

              const currentMessages = get().messages;
              // Prevent duplicate messages
              if (!currentMessages.find(msg => msg.id === newMessage.id)) {
                set({ messages: [...currentMessages, newMessage] });
              }
            } catch (error) {
              console.warn('Failed to process new message (non-critical):', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to chat for venue ${venueId}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.warn(`Failed to subscribe to chat for venue ${venueId} (non-critical)`);
            // Don't show error to user, just log it
          } else if (status === 'CLOSED') {
            console.log(`Chat subscription closed for venue ${venueId}`);
          }
        });

      set({ subscription });
    } catch (error) {
      console.warn('Failed to subscribe to messages (non-critical):', error);
      // Don't show error to user
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
      console.warn('Failed to unsubscribe from messages (non-critical):', error);
    }
  },

  cleanup: (): void => {
    try {
      get().unsubscribeFromMessages();
      set({ 
        messages: [], 
        currentSession: null, 
        error: null,
        isLoading: false 
      });
    } catch (error) {
      console.warn('Error during cleanup (non-critical):', error);
    }
  },
}));