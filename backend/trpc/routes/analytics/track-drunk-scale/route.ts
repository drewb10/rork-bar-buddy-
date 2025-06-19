import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// In a real app, this would save to a database
const drunkScaleRatings: any[] = [];

export default publicProcedure
  .input(z.object({ 
    rating: z.number().min(1).max(10),
    userId: z.string().optional(),
    timestamp: z.string(),
    sessionId: z.string().optional(),
  }))
  .mutation(({ input }) => {
    // Store the drunk scale rating
    const rating = {
      ...input,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    
    drunkScaleRatings.push(rating);
    
    console.log('New drunk scale rating tracked:', rating);
    
    return {
      success: true,
      ratingId: rating.id,
      message: 'Drunk scale rating tracked successfully'
    };
  });