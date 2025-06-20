import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const sendMessageProcedure = publicProcedure
  .input(z.object({
    sessionId: z.string(),
    venueId: z.string(),
    content: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { sessionId, venueId, content } = input;

    try {
      const { data: newMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          venue_id: venueId,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, message: newMessage };
    } catch (error) {
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export default sendMessageProcedure;