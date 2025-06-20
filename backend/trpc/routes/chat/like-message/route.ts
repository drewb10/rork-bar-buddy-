import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

const likeMessageSchema = z.object({
  messageId: z.string(),
});

export const likeMessageProcedure = publicProcedure
  .input(likeMessageSchema)
  .mutation(async ({ input }) => {
    const { messageId } = input;

    try {
      // Increment likes count
      const { data: message, error } = await supabase
        .from('chat_messages')
        .update({ likes: supabase.sql`likes + 1` })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, message };
    } catch (error) {
      throw new Error(`Failed to like message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export default likeMessageProcedure;