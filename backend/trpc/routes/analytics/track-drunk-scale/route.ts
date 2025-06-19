import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export default publicProcedure
  .input(z.object({ 
    rating: z.number().min(1).max(10),
    userId: z.string().optional(),
    timestamp: z.string(),
    sessionId: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      // For drunk scale ratings, we could create a separate table or store in user_profiles
      // For now, we'll log it and could extend the user_profiles table to track these
      console.log('Drunk scale rating tracked:', input);
      
      // If we want to store these separately, we could create a drunk_scale_ratings table
      // For now, this is handled in the user profile store
      
      return {
        success: true,
        message: 'Drunk scale rating tracked successfully'
      };
    } catch (error) {
      console.error('Error tracking drunk scale rating:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to track drunk scale rating'
      };
    }
  });