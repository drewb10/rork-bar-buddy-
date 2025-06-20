import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const addFriendProcedure = publicProcedure
  .input(z.object({ 
    userId: z.string(),
    friendId: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
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
          message: 'Failed to add friend'
        };
      }

      return {
        success: true,
        message: 'Friend added successfully'
      };
    } catch (error) {
      console.error('Error adding friend:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to add friend'
      };
    }
  });

export default addFriendProcedure;