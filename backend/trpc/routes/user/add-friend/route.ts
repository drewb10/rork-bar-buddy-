import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// In a real app, this would save to a database
const friendConnections: any[] = [];

export default publicProcedure
  .input(z.object({ 
    userId: z.string(),
    friendUserId: z.string(),
  }))
  .mutation(({ input }) => {
    // Store the friend connection
    const connection = {
      ...input,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    
    friendConnections.push(connection);
    
    console.log('Friend connection created:', connection);
    
    return {
      success: true,
      connectionId: connection.id,
      message: 'Friend added successfully'
    };
  });