import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const declineFriendRequestProcedure = publicProcedure
  .input(z.object({ 
    requestId: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('id', input.requestId);

      if (error) {
        console.error('Supabase error:', error);
        return {
          success: false,
          error: error.message,
          message: 'Failed to decline friend request'
        };
      }

      return {
        success: true,
        message: 'Friend request declined successfully'
      };
    } catch (error) {
      console.error('Error declining friend request:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to decline friend request'
      };
    }
  });

export default declineFriendRequestProcedure;