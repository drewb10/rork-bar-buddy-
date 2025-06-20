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
      const { data: messages, error } = await supabase
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
      const transformedMessages = messages?.map(msg => {
        // Safely access session data from the joined result
        const sessionData = msg?.chat_sessions;
        const anonymousName = Array.isArray(sessionData) 
          ? sessionData[0]?.anonymous_name 
          : sessionData?.anonymous_name;
        const sessionVenueId = Array.isArray(sessionData) 
          ? sessionData[0]?.venue_id 
          : sessionData?.venue_id;
        
        return {
          ...msg,
          anonymous_name: anonymousName || 'Anonymous Buddy',
          venue_id: sessionVenueId || venueId,
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