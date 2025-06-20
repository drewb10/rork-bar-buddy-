import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const completeBingoProcedure = publicProcedure
  .input(z.object({ 
    userId: z.string().optional(),
    timestamp: z.string(),
    sessionId: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      const { data, error } = await supabase
        .from('bingo_card_completions')
        .insert({
          user_id: input.userId || 'anonymous',
          completed_at: input.timestamp,
          session_id: input.sessionId,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return {
          success: false,
          error: error.message,
          message: 'Failed to track bingo completion'
        };
      }

      console.log('Bingo card completed in Supabase:', data);
      
      return {
        success: true,
        completionId: data.id,
        message: 'Bingo completion tracked successfully'
      };
    } catch (error) {
      console.error('Error tracking bingo completion:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to track bingo completion'
      };
    }
  });

export default completeBingoProcedure;