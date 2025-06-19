import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// In a real app, this would save to a database
// For now, we'll just log the data
const interactions: any[] = [];

export default publicProcedure
  .input(z.object({ 
    venueId: z.string(),
    userId: z.string().optional(),
    arrivalTime: z.string().optional(),
    timestamp: z.string(),
    sessionId: z.string().optional(),
  }))
  .mutation(({ input }) => {
    // Store the interaction data
    const interaction = {
      ...input,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    
    interactions.push(interaction);
    
    console.log('New venue interaction tracked:', interaction);
    
    return {
      success: true,
      interactionId: interaction.id,
      message: 'Interaction tracked successfully'
    };
  });