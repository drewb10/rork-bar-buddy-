import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const acceptFriendRequestProcedure = publicProcedure
  .input(z.object({ 
    requestId: z.string(),
    userId: z.string(),
    friendId: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
      // Update friend request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', input.requestId);

      if (updateError) throw updateError;

      // Add friendship (both directions)
      const { error: error1 } = await supabase
        .from('user_friends')
        .insert({
          user_id: input.userId,
          friend_id: input.friendId,
          status: 'accepted',
        });

      const { error: error2 } = await supabase
        .from('user_friends')
        .insert({
          user_id: input.friendId,
          friend_id: input.userId,
          status: 'accepted',
        });

      if (error1 || error2) {
        console.error('Supabase error:', error1 || error2);
        return {
          success: false,
          error: (error1 || error2)?.message,
          message: 'Failed to accept friend request'
        };
      }

      return {
        success: true,
        message: 'Friend request accepted successfully'
      };
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to accept friend request'
      };
    }
  });

export default acceptFriendRequestProcedure;