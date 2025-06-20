import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const likeMessageProcedure = publicProcedure
  .input(z.object({
    messageId: z.string().min(1, "Message ID is required"),
    venueId: z.string().min(1, "Venue ID is required").optional(),
  }))
  .mutation(async ({ input }) => {
    const { messageId, venueId } = input;

    try {
      // Validate message ID
      if (!messageId) {
        throw new Error('Message ID is required');
      }

      // Get current message with venue verification if provided
      const query = supabase
        .from('chat_messages')
        .select('id, likes, venue_id')
        .eq('id', messageId);

      if (venueId) {
        query.eq('venue_id', venueId);
      }

      const { data: currentMessage, error: fetchError } = await query.single();

      if (fetchError || !currentMessage) {
        throw new Error('Message not found or access denied');
      }

      // Increment likes count
      const { data: updatedMessage, error: updateError } = await supabase
        .from('chat_messages')
        .update({ likes: (currentMessage.likes || 0) + 1 })
        .eq('id', messageId)
        .select('id, likes, venue_id')
        .single();

      if (updateError) {
        throw new Error(`Failed to update likes: ${updateError.message}`);
      }

      return { 
        success: true, 
        message: updatedMessage,
        newLikeCount: updatedMessage.likes 
      };
    } catch (error) {
      console.error('Like message error:', error);
      throw new Error(`Failed to like message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export default likeMessageProcedure;