import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

interface ChatSession {
  id: string;
  anonymous_name: string;
  venue_id: string;
}

interface RawMessageFromSupabase {
  id: string;
  session_id: string;
  content: string;
  timestamp: string;
  created_at: string;
  chat_sessions: ChatSession | null;
}

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
      if (!venueId || venueId.trim() === '') {
        throw new Error('Venue ID is required and cannot be empty');
      }

      const { data: messagesWithSessions, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          session_id,
          content,
          timestamp,
          created_at,
          chat_sessions!inner(
            id,
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

      const transformedMessages: TransformedMessage[] = (messagesWithSessions as unknown as RawMessageFromSupabase[])?.map(msg => {
        const sessionData = msg.chat_sessions;

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