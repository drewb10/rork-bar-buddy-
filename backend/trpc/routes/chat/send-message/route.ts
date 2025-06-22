import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

interface LocalSessionInfo {
  id: string;
  venue_id: string;
  anonymous_name: string;
}

export const sendMessageProcedure = publicProcedure
  .input(z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    venueId: z.string().min(1, "Venue ID is required"),
    content: z.string().min(1, "Message content is required").max(500, "Message too long"),
  }))
  .mutation(async ({ input }) => {
    const { sessionId, venueId, content } = input;

    try {
      if (!sessionId || sessionId.trim() === '') {
        throw new Error('Session ID is required and cannot be empty');
      }
      
      if (!venueId || venueId.trim() === '') {
        throw new Error('Venue ID is required and cannot be empty');
      }
      
      if (!content || content.trim() === '') {
        throw new Error('Message content is required and cannot be empty');
      }

      const trimmedContent = content.trim();
      if (trimmedContent.length === 0) {
        throw new Error('Message content cannot be empty after trimming');
      }

      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id, venue_id, anonymous_name')
        .eq('id', sessionId)
        .eq('venue_id', venueId)
        .single();

      if (sessionError || !session) {
        throw new Error('Invalid session or session does not belong to this venue');
      }

      const typedSession = session as LocalSessionInfo;

      const { data: newMessage, error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          content: trimmedContent,
        })
        .select(`
          id,
          session_id,
          content,
          timestamp,
          created_at
        `)
        .single();

      if (insertError) {
        throw new Error(`Failed to insert message: ${insertError.message}`);
      }

      const messageWithDetails = {
        ...newMessage,
        anonymous_name: typedSession.anonymous_name,
        venue_id: typedSession.venue_id,
      };

      return { success: true, message: messageWithDetails };
    } catch (error) {
      console.error('Send message error:', error);
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export default sendMessageProcedure;