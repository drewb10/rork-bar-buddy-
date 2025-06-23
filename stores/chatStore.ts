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
  lastMessageTime: number; // For rate limiting
  loadMessages: (venueId: string) => Promise<void>;
  sendMessage: (venueId: string, content: string) => Promise<void>;
  createOrGetSession: (venueId: string) => Promise<ChatSession>;
  subscribeToMessages: (venueId: string) => void;
  unsubscribeFromMessages: () => void;
  cleanup: () => void;
  clearError: () => void;
  resetChatOnAppReopen: () => void;
}

// Content moderation filters
const HATE_SPEECH_PATTERNS = [
  // Racial/ethnic slurs and hate speech
  /\b(n[i1]gg[ae3]r|n[i1]gg[ae3]|sp[i1]c|ch[i1]nk|g[o0][o0]k|w[e3]tb[a4]ck|b[e3][a4]n[e3]r|cr[a4]ck[e3]r)\b/i,
  // Religious hate
  /\b(k[i1]k[e3]|j[e3]w[s5]|m[u0]sl[i1]m[s5]?\s*(are|is).*(terrorist|bomb|evil))\b/i,
  // LGBTQ+ slurs
  /\b(f[a4]gg[o0]t|f[a4]g|tr[a4]nn[y1]|d[y1]k[e3])\b/i,
  // Gender-based hate
  /\b(wh[o0]r[e3]|sl[u0]t|b[i1]tch|c[u0]nt)\s*(are|is).*(worthless|stupid|trash)/i,
  // General hate patterns
  /\b(kill\s*(all|every)|genocide|lynch|hang\s*(all|every))\b/i,
];

const VIOLENCE_THREAT_PATTERNS = [
  /\b(kill|murder|shoot|stab|bomb|attack|hurt|beat\s*up|fight\s*me)\b/i,
  /\b(gonna\s*(kill|hurt|beat)|will\s*(kill|hurt|beat)|going\s*to\s*(kill|hurt|beat))\b/i,
  /\b(meet\s*me\s*(outside|after)|lets\s*fight|wanna\s*fight)\b/i,
  /\b(bring\s*a\s*(gun|knife|weapon)|school\s*shooter)\b/i,
];

const BULLYING_HARASSMENT_PATTERNS = [
  /\b(ugly|fat|stupid|loser|freak|weird)\s*(ass|face|person|girl|guy|boy)\b/i,
  /\b(nobody\s*likes\s*you|everyone\s*hates\s*you|kill\s*yourself|kys)\b/i,
  /\b(you\s*should\s*(die|disappear|leave))\b/i,
];

const SEXUAL_HARASSMENT_PATTERNS = [
  /\b(send\s*nudes|show\s*(me\s*)?(your|ur)\s*(tits|ass|pussy|dick))\b/i,
  /\b(wanna\s*(fuck|hook\s*up|bang)|dtf|netflix\s*and\s*chill)\b/i,
  /\b(rape|sexual\s*assault|non\s*consensual)\b/i,
  /\b(daddy|mommy)\s*(issues|kink)/i,
];

const PII_PATTERNS = [
  // Phone numbers
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
  /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/,
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  // Social media handles
  /\b(instagram|insta|snapchat|snap|tiktok|twitter|ig|sc)[\s:]*[@]?[A-Za-z0-9._-]+\b/i,
  // Full names (basic pattern)
  /\b[A-Z][a-z]+\s+[A-Z][a-z]+\s*(jr|sr|iii|iv)?\b/,
  // Addresses
  /\b\d+\s+[A-Za-z\s]+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|place|pl)\b/i,
];

const SPAM_ADVERTISING_PATTERNS = [
  /\b(follow\s*me|dm\s*me|message\s*me|add\s*me)\b/i,
  /\b(promo\s*code|discount|sale|buy\s*now|click\s*here)\b/i,
  /\b(crypto|bitcoin|nft|investment|make\s*money)\b/i,
  /\b(onlyfans|premium\s*content|subscribe)\b/i,
];

const PROFANITY_PATTERNS = [
  /\b(fuck|shit|damn|hell|ass|bitch|bastard|crap)\b/i,
];

// Rate limiting: 5 seconds between messages
const RATE_LIMIT_MS = 5000;

// Check if we're in development mode
const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';

const moderateContent = (content: string): { isAllowed: boolean; reason?: string; userMessage?: string } => {
  const trimmedContent = content.trim().toLowerCase();
  
  // Check for hate speech
  for (const pattern of HATE_SPEECH_PATTERNS) {
    if (pattern.test(trimmedContent)) {
      return { 
        isAllowed: false, 
        reason: 'Hate speech is not allowed', 
        userMessage: 'Your message contains inappropriate content and cannot be sent.'
      };
    }
  }
  
  // Check for violence/threats
  for (const pattern of VIOLENCE_THREAT_PATTERNS) {
    if (pattern.test(trimmedContent)) {
      return { 
        isAllowed: false, 
        reason: 'Threats and violent content are not allowed', 
        userMessage: 'Your message contains inappropriate content and cannot be sent.'
      };
    }
  }
  
  // Check for bullying/harassment
  for (const pattern of BULLYING_HARASSMENT_PATTERNS) {
    if (pattern.test(trimmedContent)) {
      return { 
        isAllowed: false, 
        reason: 'Bullying and harassment are not allowed', 
        userMessage: 'Your message contains inappropriate content and cannot be sent.'
      };
    }
  }
  
  // Check for sexual harassment
  for (const pattern of SEXUAL_HARASSMENT_PATTERNS) {
    if (pattern.test(trimmedContent)) {
      return { 
        isAllowed: false, 
        reason: 'Sexual harassment is not allowed', 
        userMessage: 'Your message contains inappropriate content and cannot be sent.'
      };
    }
  }
  
  // Check for PII
  for (const pattern of PII_PATTERNS) {
    if (pattern.test(content)) { // Use original content for PII to preserve case
      return { 
        isAllowed: false, 
        reason: 'Personal information sharing is not allowed for your safety', 
        userMessage: 'Please don\'t share personal information for your safety.'
      };
    }
  }
  
  // Check for spam/advertising
  for (const pattern of SPAM_ADVERTISING_PATTERNS) {
    if (pattern.test(trimmedContent)) {
      return { 
        isAllowed: false, 
        reason: 'Spam and advertising are not allowed', 
        userMessage: 'Your message contains inappropriate content and cannot be sent.'
      };
    }
  }
  
  return { isAllowed: true };
};

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

// Check if it's past 5 AM today and messages should be reset
const shouldResetMessages = (messageTimestamp: string): boolean => {
  try {
    const now = new Date();
    const messageDate = new Date(messageTimestamp);
    
    // Get today's 5 AM
    const today5AM = new Date();
    today5AM.setHours(5, 0, 0, 0);
    
    // If it's before 5 AM today, use yesterday's 5 AM as cutoff
    if (now.getHours() < 5) {
      today5AM.setDate(today5AM.getDate() - 1);
    }
    
    // Message should be hidden if it's older than the last 5 AM reset
    return messageDate < today5AM;
  } catch {
    return false;
  }
};

// Create user-friendly error messages
const createUserError = (originalError: Error): Error => {
  const message = originalError.message;
  
  // Log the detailed error for development
  if (isDevelopment) {
    console.error('Chat Error (Dev):', originalError);
  }
  
  // Rate limiting errors - show countdown
  if (message.includes('Please wait') && message.includes('seconds')) {
    return originalError; // Keep the countdown message as is
  }
  
  // Content moderation errors - use user-friendly message
  if (message.includes('Personal information sharing') ||
      message.includes('Hate speech') ||
      message.includes('Threats and violent content') ||
      message.includes('Bullying and harassment') ||
      message.includes('Sexual harassment') ||
      message.includes('Spam and advertising')) {
    return new Error('Your message cannot be sent. Please check our community guidelines.');
  }
  
  // Network/connection errors
  if (message.includes('Failed to create session') ||
      message.includes('Failed to insert message') ||
      message.includes('Failed to fetch messages')) {
    return new Error('Connection issue. Please check your internet and try again.');
  }
  
  // Generic fallback for any other errors
  return new Error('Unable to send message. Please try again.');
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  currentSession: null,
  isLoading: false,
  error: null,
  subscription: null,
  appStartTime: Date.now(), // Initialize with current time
  lastMessageTime: 0, // Initialize rate limiting

  clearError: () => set({ error: null }),

  resetChatOnAppReopen: () => {
    // Clear all chat-related state to ensure fresh start
    set({ 
      messages: [], 
      currentSession: null, 
      error: null,
      isLoading: false,
      appStartTime: Date.now(), // Update app start time
      lastMessageTime: 0 // Reset rate limiting
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
      const userError = createUserError(error as Error);
      set({ error: userError.message, isLoading: false });
      throw userError;
    }
  },

  loadMessages: async (venueId: string): Promise<void> => {
    try {
      set({ isLoading: true, error: null });
      
      if (!venueId || venueId.trim() === '') {
        throw new Error('Venue ID is required and cannot be empty');
      }

      // Calculate cutoff time for daily reset (5 AM)
      const now = new Date();
      const cutoffTime = new Date();
      cutoffTime.setHours(5, 0, 0, 0);
      
      // If it's before 5 AM today, use yesterday's 5 AM as cutoff
      if (now.getHours() < 5) {
        cutoffTime.setDate(cutoffTime.getDate() - 1);
      }

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
        .gte('created_at', cutoffTime.toISOString()) // Only load messages after 5 AM cutoff
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
        return msg.venue_id === venueId && !shouldResetMessages(msg.created_at);
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

      // Rate limiting check
      const now = Date.now();
      const { lastMessageTime } = get();
      if (now - lastMessageTime < RATE_LIMIT_MS) {
        const remainingTime = Math.ceil((RATE_LIMIT_MS - (now - lastMessageTime)) / 1000);
        throw new Error(`Please wait ${remainingTime} seconds before sending another message`);
      }

      // Content moderation
      const moderationResult = moderateContent(trimmedContent);
      if (!moderationResult.isAllowed) {
        // Log detailed reason for development
        if (isDevelopment) {
          console.warn('Message blocked:', moderationResult.reason);
        }
        
        // Throw user-friendly error
        throw new Error(moderationResult.userMessage || 'Your message cannot be sent. Please check our community guidelines.');
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
        isLoading: false,
        lastMessageTime: now // Update last message time for rate limiting
      });
    } catch (error) {
      const userError = createUserError(error as Error);
      set({ error: userError.message, isLoading: false });
      throw userError;
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
              // Check if message should be reset due to daily cutoff
              if (shouldResetMessages(payload.new.created_at)) {
                return; // Ignore messages that should be reset
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