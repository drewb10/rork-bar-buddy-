import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export default publicProcedure
  .input(z.object({ 
    userId: z.string(),
    friendUserId: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .insert({
          user_id: input.userId,
          friend_user_id: input.friendUserId,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return {
          success: false,
          error: error.message,
          message: 'Failed to add friend'
        };
      }

      console.log('Friend connection created in Supabase:', data);
      
      return {
        success: true,
        connectionId: data.id,
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