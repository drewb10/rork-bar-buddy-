import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const getFriendRequestsProcedure = publicProcedure
  .input(z.object({ 
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      const { data: requests, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          from_user:user_profiles!friend_requests_from_user_id_fkey(*)
        `)
        .eq('to_user_id', input.userId)
        .eq('status', 'pending');

      if (error) {
        console.error('Supabase error:', error);
        return {
          success: false,
          error: error.message,
          requests: []
        };
      }

      return {
        success: true,
        requests: requests || [],
        message: 'Friend requests retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting friend requests:', error);
      return {
        success: false,
        error: 'Internal server error',
        requests: []
      };
    }
  });

export default getFriendRequestsProcedure;