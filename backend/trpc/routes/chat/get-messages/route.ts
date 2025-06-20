import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

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
      const transformedMessages = messagesWithSessions?.map(msg => {
        // Handle session data - can be array or object
        const sessionData = msg.chat_sessions;
        let anonymousName: string;
        let sessionVenueId: string;
        
        if (Array.isArray(sessionData)) {
          anonymousName = sessionData[0]?.anonymous_name || 'Anonymous Buddy';
          sessionVenueId = sessionData[0]?.venue_id || venueId;
        } else {
          anonymousName = (sessionData as any)?.anonymous_name || 'Anonymous Buddy';
          sessionVenueId = (sessionData as any)?.venue_id || venueId;
        }
        
        return {
          ...msg,
          anonymous_name: anonymousName,
          venue_id: sessionVenueId,
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