import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

// Type for raw message response from Supabase (chat_sessions can be array or single object)
interface RawMessageWithJoinedSession {
  id: string;
  session_id: string;
  content: string;
  timestamp: string;
  is_flagged: boolean;
  created_at: string;
  chat_sessions: {
    anonymous_name: string;
    venue_id: string;
  }[] | {
    anonymous_name: string;
    venue_id: string;
  } | null;
}

// Type for transformed message (chat_sessions is always a single object)
interface MessageWithJoinedSession {
  id: string;
  session_id: string;
  content: string;
  timestamp: string;
  is_flagged: boolean;
  created_at: string;
  chat_sessions: {
    anonymous_name: string;
    venue_id: string;
  } | null;
}

export const getMessagesProcedure = publicProcedure
  .input(z.object({
    venueId: z.string().min(1, "Venue ID is required"),
    limit: z.number().min(1).max(200).optional().default(100),
  }))
  .query(async ({ input }) => {
    const { venueId, limit } = input;

    try {
      // Validate venue ID
      if (!venueId || venueId.trim() === '') {
        throw new Error('Venue ID is required and cannot be empty');
      }

      // Get messages for this venue with proper inner join to ensure single object
      const { data: messagesWithSessions, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          session_id,
          content,
          timestamp,
          is_flagged,
          created_at,
          chat_sessions!inner(
            anonymous_name,
            venue_id
          )
        `)
        .eq('chat_sessions.venue_id', venueId)
        .order('timestamp', { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch messages: ${error.message}`);
      }

      // Transform messages to include anonymous_name and venue_id
      const transformedMessages = (messagesWithSessions as RawMessageWithJoinedSession[])?.map(msg => {
        // Handle case where chat_sessions might still be an array (fallback)
        const sessionData = Array.isArray(msg.chat_sessions) 
          ? msg.chat_sessions[0] 
          : msg.chat_sessions;

        const transformedMessage: MessageWithJoinedSession = {
          ...msg,
          chat_sessions: sessionData,
        };

        return {
          ...transformedMessage,
          anonymous_name: sessionData?.anonymous_name || 'Anonymous Buddy',
          venue_id: sessionData?.venue_id || venueId,
        };
      }).filter(msg => {
        const sessionData = Array.isArray(msg.chat_sessions) 
          ? msg.chat_sessions[0] 
          : msg.chat_sessions;
        return sessionData !== null;
      }) || [];

      return { 
        success: true, 
        messages: transformedMessages,
        count: transformedMessages.length 
      };
    } catch (error) {
      console.error('Get messages error:', error);
      throw new Error(`Failed to get messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export default getMessagesProcedure;