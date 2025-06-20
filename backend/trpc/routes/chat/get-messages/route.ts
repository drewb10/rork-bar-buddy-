import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const getMessagesSchema = z.object({
  venueId: z.string(),
  limit: z.number().optional().default(50),
});

export const getMessagesProcedure = publicProcedure
  .input(getMessagesSchema)
  .query(async ({ input }) => {
    const { venueId, limit } = input;

    try {
      // In a real app, this would query Supabase
      // For now, return mock messages based on venueId
      
      const mockMessages = [
        {
          id: `msg_1_${venueId}`,
          venueId,
          userId: 'anon_user_1',
          content: 'Anyone here tonight?',
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        },
        {
          id: `msg_2_${venueId}`,
          venueId,
          userId: 'anon_user_2',
          content: 'Yeah! Great crowd tonight 🍻',
          timestamp: new Date(Date.now() - 240000).toISOString(), // 4 minutes ago
        },
        {
          id: `msg_3_${venueId}`,
          venueId,
          userId: 'anon_user_3',
          content: 'The music is awesome!',
          timestamp: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
        },
        {
          id: `msg_4_${venueId}`,
          venueId,
          userId: 'anon_user_4',
          content: 'First time here, loving the vibe!',
          timestamp: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
        },
      ];

      return mockMessages.slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to get messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export default getMessagesProcedure;