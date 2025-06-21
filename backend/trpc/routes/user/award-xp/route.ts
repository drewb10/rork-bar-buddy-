import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

const XP_VALUES = {
  visit_new_bar: 25,
  participate_event: 50,
  bring_friend: 30,
  complete_night_out: 100,
  special_achievement: 75,
  live_music: 40,
  featured_drink: 20,
  bar_game: 35,
};

export const awardXPProcedure = publicProcedure
  .input(z.object({ 
    userId: z.string(),
    activityType: z.enum(['visit_new_bar', 'participate_event', 'bring_friend', 'complete_night_out', 'special_achievement', 'live_music', 'featured_drink', 'bar_game']),
    description: z.string(),
    venueId: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      const xpAmount = XP_VALUES[input.activityType];
      
      // Get current user profile
      const { data: currentProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', input.userId)
        .single();

      if (fetchError || !currentProfile) {
        return {
          success: false,
          error: 'User profile not found',
          message: 'Failed to award XP'
        };
      }

      // Create new XP activity
      const newActivity = {
        id: Math.random().toString(36).substr(2, 9),
        type: input.activityType,
        xpAwarded: xpAmount,
        timestamp: new Date().toISOString(),
        description: input.description,
      };

      // Update profile with new XP and activity
      const updatedXPActivities = [...(currentProfile.xp_activities as any[] || []), newActivity];
      const updatedXP = currentProfile.xp + xpAmount;
      
      let updateData: any = {
        xp: updatedXP,
        xp_activities: updatedXPActivities,
      };

      // Update specific counters based on activity type
      switch (input.activityType) {
        case 'visit_new_bar':
          if (input.venueId && !currentProfile.visited_bars.includes(input.venueId)) {
            updateData.visited_bars = [...currentProfile.visited_bars, input.venueId];
          }
          break;
        case 'participate_event':
          updateData.events_attended = currentProfile.events_attended + 1;
          break;
        case 'bring_friend':
          updateData.friends_referred = currentProfile.friends_referred + 1;
          break;
        case 'live_music':
          updateData.live_events_attended = currentProfile.live_events_attended + 1;
          break;
        case 'featured_drink':
          updateData.featured_drinks_tried = currentProfile.featured_drinks_tried + 1;
          break;
        case 'bar_game':
          updateData.bar_games_played = currentProfile.bar_games_played + 1;
          break;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', input.userId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return {
          success: false,
          error: error.message,
          message: 'Failed to award XP'
        };
      }

      return {
        success: true,
        xpAwarded: xpAmount,
        totalXP: updatedXP,
        message: `Awarded ${xpAmount} XP for ${input.description}`
      };
    } catch (error) {
      console.error('Error awarding XP:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to award XP'
      };
    }
  });

export default awardXPProcedure;