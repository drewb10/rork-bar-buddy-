import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const completeTaskProcedure = publicProcedure
  .input(z.object({ 
    taskId: z.string(),
    userId: z.string().optional(),
    timestamp: z.string(),
    sessionId: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      const { data, error } = await supabase
        .from('bingo_completions')
        .insert({
          user_id: input.userId || 'anonymous',
          task_id: input.taskId,
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
          message: 'Failed to track bingo task completion'
        };
      }

      console.log('Bingo task completed in Supabase:', data);
      
      return {
        success: true,
        completionId: data.id,
        message: 'Bingo task completion tracked successfully'
      };
    } catch (error) {
      console.error('Error tracking bingo task:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to track bingo task completion'
      };
    }
  });

export default completeTaskProcedure;