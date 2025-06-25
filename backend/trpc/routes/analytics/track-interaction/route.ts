import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

const shouldResetLikes = (lastLikeReset: string): boolean => {
  try {
    const lastResetDate = new Date(lastLikeReset);
    const now = new Date();
    
    // Reset at 4:59 AM
    const resetTime = new Date(now);
    resetTime.setHours(4, 59, 0, 0);
    
    // If it's past 4:59 AM today and last reset was before today's 4:59 AM, reset
    if (now >= resetTime && lastResetDate < resetTime) {
      return true;
    }
    
    // If it's before 4:59 AM today, check if last reset was before yesterday's 4:59 AM
    if (now < resetTime) {
      const yesterdayResetTime = new Date(resetTime);
      yesterdayResetTime.setDate(yesterdayResetTime.getDate() - 1);
      return lastResetDate < yesterdayResetTime;
    }
    
    return false;
  } catch {
    return false;
  }
};

export const trackInteractionProcedure = publicProcedure
  .input(z.object({ 
    venueId: z.string(),
    userId: z.string().optional(),
    arrivalTime: z.string().optional(),
    timestamp: z.string(),
    sessionId: z.string().optional(),
    interactionType: z.enum(['like', 'check_in']).default('like'),
  }))
  .mutation(async ({ input }) => {
    try {
      const { venueId, userId, arrivalTime, timestamp, sessionId, interactionType } = input;
      const anonymousUserId = userId || `anon-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      // For like interactions, check daily limit
      if (interactionType === 'like') {
        // Check existing likes for this user/venue combination today
        const { data: existingLikes, error: likesError } = await supabase
          .from('venue_interactions')
          .select('*')
          .eq('user_id', anonymousUserId)
          .eq('venue_id', venueId)
          .eq('interaction_type', 'like')
          .order('timestamp', { ascending: false })
          .limit(1);

        if (likesError) {
          console.error('Error checking existing likes:', likesError);
        } else if (existingLikes && existingLikes.length > 0) {
          const lastLike = existingLikes[0];
          
          // Check if user has already liked today (after 4:59 AM reset)
          if (!shouldResetLikes(lastLike.timestamp)) {
            return {
              success: false,
              error: 'Daily like limit reached',
              message: 'You can only like each bar once per day. Likes reset at 4:59 AM.'
            };
          }
        }
      }

      // Track the interaction
      const { error } = await supabase
        .from('venue_interactions')
        .insert({
          user_id: anonymousUserId,
          venue_id: venueId,
          interaction_type: interactionType,
          arrival_time: arrivalTime,
          timestamp: timestamp,
          session_id: sessionId,
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

export default trackInteractionProcedure;