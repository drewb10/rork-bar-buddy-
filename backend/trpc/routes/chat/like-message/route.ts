import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

const likeMessageSchema = z.object({
  messageId: z.string(),
});

const likeMessageProcedure = publicProcedure
  .input(likeMessageSchema)
  .mutation(async ({ input }) => {
    const { messageId } = input;

    try {
      // First get the current likes count
      const { data: currentMessage, error: fetchError } = await supabase
        .from('chat_messages')
        .select('likes')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      // Increment likes count
      const { data: message, error } = await supabase
        .from('chat_messages')
        .update({ likes: (currentMessage.likes || 0) + 1 })
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