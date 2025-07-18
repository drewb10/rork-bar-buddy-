import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

const XP_VALUES = {
  visit_new_bar: 15,
  participate_event: 50,
  bring_friend: 30,
  complete_night_out: 20,
  special_achievement: 75,
  live_music: 40,
  featured_drink: 20,
  bar_game: 35,
  photo_taken: 10,
  shots: 5,
  scoop_and_scores: 10,
  beers: 5,
  beer_towers: 15,
  funnels: 10,
  shotguns: 10,
  pool_games: 15,
  dart_games: 15,
  drunk_scale_submission: 25,
  like_bar: 5,
  check_in: 10,
  new_member_bonus: 100,
};

export const awardXPProcedure = publicProcedure
  .input(z.object({ 
    userId: z.string(),
    activityType: z.enum([
      'visit_new_bar', 'participate_event', 'bring_friend', 'complete_night_out', 
      'special_achievement', 'live_music', 'featured_drink', 'bar_game', 'photo_taken', 
      'shots', 'scoop_and_scores', 'beers', 'beer_towers', 'funnels', 'shotguns', 
      'pool_games', 'dart_games', 'drunk_scale_submission', 'like_bar', 'check_in', 
      'new_member_bonus'
    ]),
    description: z.string(),
    venueId: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      const xpAmount = XP_VALUES[input.activityType];
      
      if (!xpAmount) {
        return {
          success: false,
          error: 'Invalid activity type',
          message: 'Failed to award XP'
        };
      }
      
      // Get current user profile
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', input.userId)
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
      const updatedXP = (currentProfile.xp || 0) + xpAmount;
      
      let updateData: any = {
        xp: updatedXP,
        xp_activities: updatedXPActivities,
        updated_at: new Date().toISOString(),
      };

      // Update specific counters based on activity type
      switch (input.activityType) {
        case 'visit_new_bar':
          if (input.venueId && !currentProfile.visited_bars?.includes(input.venueId)) {
            updateData.visited_bars = [...(currentProfile.visited_bars || []), input.venueId];
          }
          break;
        case 'photo_taken':
          updateData.photos_taken = (currentProfile.photos_taken || 0) + 1;
          break;
        case 'pool_games':
          updateData.pool_games_won = (currentProfile.pool_games_won || 0) + 1;
          break;
        case 'dart_games':
          updateData.dart_games_won = (currentProfile.dart_games_won || 0) + 1;
          break;
        case 'shots':
          updateData.total_shots = (currentProfile.total_shots || 0) + 1;
          break;
        case 'scoop_and_scores':
          updateData.total_scoop_and_scores = (currentProfile.total_scoop_and_scores || 0) + 1;
          break;
        case 'beers':
          updateData.total_beers = (currentProfile.total_beers || 0) + 1;
          break;
        case 'beer_towers':
          updateData.total_beer_towers = (currentProfile.total_beer_towers || 0) + 1;
          break;
        case 'funnels':
          updateData.total_funnels = (currentProfile.total_funnels || 0) + 1;
          break;
        case 'shotguns':
          updateData.total_shotguns = (currentProfile.total_shotguns || 0) + 1;
          break;
        case 'drunk_scale_submission':
          // Add drunk scale rating to array
          const currentRatings = currentProfile.drunk_scale_ratings || [];
          updateData.drunk_scale_ratings = [...currentRatings];
          updateData.last_drunk_scale_date = new Date().toISOString();
          break;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', input.userId)
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