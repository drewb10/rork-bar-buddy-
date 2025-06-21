import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const createProfileProcedure = publicProcedure
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
          xp: 0,
          xp_activities: [],
          visited_bars: [],
          events_attended: 0,
          friends_referred: 0,
          live_events_attended: 0,
          featured_drinks_tried: 0,
          bar_games_played: 0,
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

export default createProfileProcedure;