import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export default publicProcedure
  .input(z.object({ 
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', input.userId)
        .single();

      if (error) {
        console.log('User not found in Supabase:', input.userId);
        return {
          success: false,
          user: null,
          message: 'User not found'
        };
      }

      console.log('User found in Supabase:', user);
      return {
        success: true,
        user: {
          userId: user.user_id,
          firstName: user.first_name,
          lastName: user.last_name,
          profilePicture: user.profile_pic,
          nightsOut: user.total_nights_out,
          barsHit: user.total_bars_hit,
          rankTitle: user.ranking,
        },
        message: 'User found successfully'
      };
    } catch (error) {
      console.error('Error searching user:', error);
      return {
        success: false,
        user: null,
        message: 'Internal server error'
      };
    }
  });