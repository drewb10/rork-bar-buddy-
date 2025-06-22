import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

// Type for raw message response from Supabase
interface RawMessageFromSupabase {
  id: string;
  session_id: string;
  content: string;
  timestamp: string;
  created_at: string;
  chat_sessions: {
    anonymous_name: string;
    venue_id: string;
  }[];
}

// Type for transformed message
interface TransformedMessage {
  id: string;
  session_id: string;
  content: string;
  timestamp: string;
  created_at: string;
  anonymous_name: string;
  venue_id: string;
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

      // Get messages for this venue with proper inner join
      const { data: messagesWithSessions, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          session_id,
          content,
          timestamp,
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

      // Transform messages to include anonymous_name and venue_id at top level
      const transformedMessages: TransformedMessage[] = (messagesWithSessions as unknown as RawMessageFromSupabase[])?.map(msg => {
        // Handle chat_sessions as array and get first element
        const sessionData = Array.isArray(msg.chat_sessions) ? msg.chat_sessions[0] : msg.chat_sessions;

        return {
          id: msg.id,
          session_id: msg.session_id,
          content: msg.content,
          timestamp: msg.timestamp,
          created_at: msg.created_at,
          anonymous_name: sessionData?.anonymous_name || 'Anonymous Buddy',
          venue_id: sessionData?.venue_id || venueId,
        };
      }).filter(msg => {
        return msg.venue_id === venueId;
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