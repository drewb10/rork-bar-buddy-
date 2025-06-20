import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const sendMessageSchema = z.object({
  venueId: z.string(),
  userId: z.string(),
  content: z.string().min(1).max(200),
});

export const sendMessageProcedure = publicProcedure
  .input(sendMessageSchema)
  .mutation(async ({ input }) => {
    const { venueId, userId, content } = input;

    try {
      // In a real app, this would save to Supabase
      // For now, we'll just return success
      
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

      // Mock database save
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        venueId,
        userId,
        content,
        timestamp: new Date().toISOString(),
      };

      return { success: true, message };
    } catch (error) {
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export default sendMessageProcedure;