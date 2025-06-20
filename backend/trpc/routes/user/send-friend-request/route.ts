import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const sendFriendRequestProcedure = publicProcedure
  .input(z.object({ 
    fromUserId: z.string(),
    toUserId: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .insert({
          from_user_id: input.fromUserId,
          to_user_id: input.toUserId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return {
          success: false,
          error: error.message,
          message: 'Failed to send friend request'
        };
      }

      return {
        success: true,
        requestId: data.id,
        message: 'Friend request sent successfully'
      };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to send friend request'
      };
    }
  });

export default sendFriendRequestProcedure;