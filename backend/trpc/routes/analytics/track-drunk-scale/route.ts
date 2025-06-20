import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const trackDrunkScaleProcedure = publicProcedure
  .input(z.object({ 
    userId: z.string().optional(),
    drunkScale: z.number().min(1).max(10),
    timestamp: z.string(),
    sessionId: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      const { error } = await supabase
        .from('drunk_scale_entries')
        .insert({
          user_id: input.userId || 'anonymous',
          drunk_scale: input.drunkScale,
          timestamp: input.timestamp,
          session_id: input.sessionId,
        });

      if (error) {
        console.error('Supabase error:', error);
        return {
          success: false,
          error: error.message,
          message: 'Failed to track drunk scale'
        };
      }

      console.log('Drunk scale tracked in Supabase:', input);
      
      return {
        success: true,
        message: 'Drunk scale tracked successfully'
      };
    } catch (error) {
      console.error('Error tracking drunk scale:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to track drunk scale'
      };
    }
  });

export default trackDrunkScaleProcedure;