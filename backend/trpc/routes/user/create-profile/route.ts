import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export default publicProcedure
  .input(z.object({ 
    userId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    profilePicture: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: input.userId,
          username: `${input.firstName}${input.lastName}`,
          first_name: input.firstName,
          last_name: input.lastName,
          profile_pic: input.profilePicture,
          has_completed_onboarding: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return {
          success: false,
          error: error.message,
          message: 'Failed to create profile'
        };
      }

      console.log('User profile created/updated in Supabase:', data);
      
      return {
        success: true,
        profileId: data.id,
        message: 'Profile created successfully'
      };
    } catch (error) {
      console.error('Error creating profile:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to create profile'
      };
    }
  });