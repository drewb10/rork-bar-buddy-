import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

// Type for message with joined session data (as returned by Supabase)
interface MessageWithJoinedSession {
  id: string;
  likes: number;
  session_id: string;
  chat_sessions: {
    id: string;
    venue_id: string;
  };
}

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

      // Get current message with venue verification through session join
      const { data: messageData, error: fetchError } = await supabase
        .from('chat_messages')
        .select(`
          id, 
          likes,
          session_id,
          chat_sessions!inner(
            id,
            venue_id
          )
        `)
        .eq('id', messageId)
        .single();

      if (fetchError || !messageData) {
        throw new Error('Message not found or access denied');
      }

      const messageWithSession = messageData as MessageWithJoinedSession;
      const sessionVenueId = messageWithSession.chat_sessions.venue_id;

      // Verify venue access if venueId is provided
      if (venueId && sessionVenueId !== venueId) {
        throw new Error('Message does not belong to the specified venue');
      }

      // Increment likes count
      const { data: updatedMessage, error: updateError } = await supabase
        .from('chat_messages')
        .update({ likes: (messageWithSession.likes || 0) + 1 })
        .eq('id', messageId)
        .select('id, likes')
        .single();

      if (updateError) {
        throw new Error(`Failed to update likes: ${updateError.message}`);
      }

      return { 
        success: true, 
        message: {
          id: updatedMessage.id,
          likes: updatedMessage.likes,
          venue_id: sessionVenueId,
        },
        newLikeCount: updatedMessage.likes 
      };
    } catch (error) {
      console.error('Like message error:', error);
      throw new Error(`Failed to like message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export default likeMessageProcedure;