import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export default publicProcedure
  .input(z.object({ 
    venueId: z.string(),
    userId: z.string().optional(),
    arrivalTime: z.string().optional(),
    timestamp: z.string(),
    sessionId: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      const { error } = await supabase
        .from('venue_interactions')
        .insert({
          user_id: input.userId || 'anonymous',
          venue_id: input.venueId,
          interaction_type: 'like',
          arrival_time: input.arrivalTime,
          timestamp: input.timestamp,
          session_id: input.sessionId,
        });

      if (error) {
        console.error('Supabase error:', error);
        return {
          success: false,
          error: error.message,
          message: 'Failed to track interaction'
        };
      }

      console.log('Venue interaction tracked in Supabase:', input);
      
      return {
        success: true,
        message: 'Interaction tracked successfully'
      };
    } catch (error) {
      console.error('Error tracking interaction:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to track interaction'
      };
    }
  });