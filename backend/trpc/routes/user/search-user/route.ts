import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const searchUserProcedure = publicProcedure
  .input(z.object({ 
    query: z.string().min(1),
    currentUserId: z.string().optional(),
  }))
  .query(async ({ input }) => {
    try {
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .or(`username.ilike.%${input.query}%,first_name.ilike.%${input.query}%,last_name.ilike.%${input.query}%`)
        .neq('user_id', input.currentUserId || '')
        .limit(10);

      if (error) {
        console.error('Supabase error:', error);
        return {
          success: false,
          error: error.message,
          users: []
        };
      }

      return {
        success: true,
        users: users || [],
        message: 'Users found successfully'
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        success: false,
        error: 'Internal server error',
        users: []
      };
    }
  });

export default searchUserProcedure;