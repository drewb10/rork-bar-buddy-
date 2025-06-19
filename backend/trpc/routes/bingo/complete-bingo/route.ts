import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// In a real app, this would save to a database
const bingoCompletions: any[] = [];

export default publicProcedure
  .input(z.object({ 
    userId: z.string().optional(),
    timestamp: z.string(),
    sessionId: z.string().optional(),
  }))
  .mutation(({ input }) => {
    // Store the bingo completion
    const completion = {
      ...input,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    
    bingoCompletions.push(completion);
    
    console.log('Bingo card completed:', completion);
    
    return {
      success: true,
      completionId: completion.id,
      message: 'Bingo completion tracked successfully'
    };
  });