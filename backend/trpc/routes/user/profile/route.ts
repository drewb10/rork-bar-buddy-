import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { safeSupabase } from "@/lib/supabase";

// Get user profile
export const getUserProfileProcedure = publicProcedure
  .input(z.object({
    userId: z.string()
  }))
  .query(async ({ input }) => {
    try {
      if (!safeSupabase || safeSupabase === null) {
        // Return demo data when Supabase is not configured
        return {
          id: 'demo-user-id',
          user_id: input.userId,
          username: 'demo_user',
          display_name: 'Demo User',
          email: 'demo@example.com',
          profile_picture: null,
          bio: 'Demo user profile',
          xp: 1250,
          level: 2,
          bars_hit: 5,
          nights_out: 3,
          photos_taken: 8,
          total_beers: 12,
          total_shots: 6,
          total_pool_games: 3,
          total_dart_games: 2,
          avg_drunk_scale: 6.5,
          current_rank: 'Tipsy Talent',
          rank_level: 1,
          has_completed_onboarding: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      const { data, error } = await safeSupabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', input.userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching user profile:', error);
        throw new Error(`Failed to fetch profile: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error in getUserProfile:', error);
      throw new Error('Failed to fetch user profile');
    }
  });

// Update user profile
export const updateUserProfileProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    updates: z.object({
      display_name: z.string().optional(),
      bio: z.string().optional(),
      profile_picture: z.string().optional(),
      username: z.string().optional(),
    })
  }))
  .mutation(async ({ input }) => {
    try {
      if (!safeSupabase || safeSupabase === null) {
        console.warn('Supabase not configured - profile update skipped');
        return { success: true, message: 'Demo mode - changes not persisted' };
      }

      const { data, error } = await safeSupabase
        .from('user_profiles')
        .update({
          ...input.updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', input.userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating profile:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error in updateUserProfile:', error);
      throw new Error('Failed to update user profile');
    }
  });

// Award XP to user
export const awardXPProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    xpAmount: z.number(),
    reason: z.string(),
    activityType: z.string().optional()
  }))
  .mutation(async ({ input }) => {
    try {
      if (!safeSupabase || safeSupabase === null) {
        console.warn('Supabase not configured - XP award skipped');
        return { success: true, xpAwarded: input.xpAmount };
      }

      // First get current XP
      const { data: currentProfile } = await safeSupabase
        .from('user_profiles')
        .select('xp, level')
        .eq('user_id', input.userId)
        .single();

      if (!currentProfile) {
        throw new Error('User profile not found');
      }

      const newXP = (currentProfile.xp || 0) + input.xpAmount;
      const newLevel = Math.floor(newXP / 1000) + 1;

      // Update user profile with new XP and level
      const { data, error } = await safeSupabase
        .from('user_profiles')
        .update({
          xp: newXP,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', input.userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error awarding XP:', error);
        throw new Error(`Failed to award XP: ${error.message}`);
      }

      return { 
        success: true, 
        xpAwarded: input.xpAmount, 
        totalXP: newXP, 
        newLevel,
        levelUp: newLevel > (currentProfile.level || 1)
      };
    } catch (error) {
      console.error('❌ Error in awardXP:', error);
      throw new Error('Failed to award XP');
    }
  });