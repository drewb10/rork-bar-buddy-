import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// In a real app, this would save to a database
const bingoTaskCompletions: any[] = [];

export default publicProcedure
  .input(z.object({ 
    taskId: z.string(),
    userId: z.string().optional(),
    timestamp: z.string(),
    sessionId: z.string().optional(),
  }))
  .mutation(({ input }) => {
    // Store the bingo task completion
    const completion = {
      ...input,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    
    bingoTaskCompletions.push(completion);
    
    console.log('Bingo task completed:', completion);
    
    return {
      success: true,
      completionId: completion.id,
      message: 'Bingo task completion tracked successfully'
    };
  });