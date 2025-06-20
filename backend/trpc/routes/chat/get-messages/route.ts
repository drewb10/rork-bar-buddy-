import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

interface MessageWithSession {
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

export const getMessagesProcedure = publicProcedure
  .input(z.object({
    venueId: z.string().min(1, "Venue ID is required"),
    limit: z.number().min(1).max(200).optional().default(100),
  }))
  .query(async ({ input }) => {
    const { venueId, limit } = input;

    try {
      // Validate venue ID
      if (!venueId) {
        throw new Error('Venue ID is required');
      }

      // Get messages with session info for anonymous names, filtered by venue through join
      const { data: messagesWithSessions, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
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
      const transformedMessages = (messagesWithSessions as MessageWithSession[])?.map(msg => {
        return {
          ...msg,
          anonymous_name: msg.chat_sessions.anonymous_name || 'Anonymous Buddy',
          venue_id: msg.chat_sessions.venue_id,
        };
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