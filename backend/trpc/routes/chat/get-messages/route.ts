import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const getMessagesProcedure = publicProcedure
  .input(z.object({
    venueId: z.string(),
    limit: z.number().optional().default(50),
  }))
  .query(async ({ input }) => {
    const { venueId, limit } = input;

    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          chat_sessions!inner(anonymous_name)
        `)
        .eq('venue_id', venueId)
        .order('timestamp', { ascending: true })
        .limit(limit);

      if (error) throw error;

      // Transform messages to include anonymous_name
      const transformedMessages = messages?.map(msg => ({
        ...msg,
        anonymous_name: msg.chat_sessions.anonymous_name,
      })) || [];

      return { success: true, messages: transformedMessages };
    } catch (error) {
      throw new Error(`Failed to get messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export default getMessagesProcedure;