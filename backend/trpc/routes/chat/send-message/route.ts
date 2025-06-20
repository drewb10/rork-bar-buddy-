import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

const sendMessageSchema = z.object({
  venueId: z.string(),
  sessionId: z.string(),
  content: z.string().min(1).max(200),
});

export const sendMessageProcedure = publicProcedure
  .input(sendMessageSchema)
  .mutation(async ({ input }) => {
    const { venueId, sessionId, content } = input;

    try {
      // Basic profanity filter
      const inappropriateWords = [
        'fuck', 'shit', 'damn', 'bitch', 'ass', 'hell',
        'sex', 'porn', 'nude', 'naked', 'drug', 'drugs',
        'weed', 'cocaine', 'heroin', 'meth', 'ecstasy',
        'kill', 'die', 'death', 'suicide', 'murder',
        'hate', 'racist', 'nazi', 'terrorist'
      ];

      const lowerContent = content.toLowerCase();
      const containsInappropriate = inappropriateWords.some(word => 
        lowerContent.includes(word)
      );

      if (containsInappropriate) {
        throw new Error('Message contains inappropriate content');
      }

      // Insert message into Supabase
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          venue_id: venueId,
          content: content.trim(),
        })
        .select(`
          *,
          chat_sessions!inner(anonymous_name)
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        message: {
          ...message,
          anonymous_name: message.chat_sessions.anonymous_name,
        },
      };
    } catch (error) {
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export default sendMessageProcedure;