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

      // Get current message with venue verification through session join
      const { data: messageWithSession, error: fetchError } = await supabase
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

      if (fetchError || !messageWithSession) {
        throw new Error('Message not found or access denied');
      }

      // Extract session data - handle both array and object cases
      const sessionData = messageWithSession.chat_sessions;
      let sessionVenueId: string;
      
      if (Array.isArray(sessionData)) {
        if (sessionData.length === 0) {
          throw new Error('No session data found');
        }
        sessionVenueId = sessionData[0].venue_id;
      } else {
        sessionVenueId = sessionData.venue_id;
      }

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