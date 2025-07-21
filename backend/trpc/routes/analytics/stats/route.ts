import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { safeSupabase } from "@/lib/supabase";

// Get user statistics
export const getUserStatsProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    period: z.enum(['lifetime', 'yearly', 'monthly', 'weekly']).optional().default('lifetime')
  }))
  .query(async ({ input }) => {
    try {
      if (!safeSupabase || safeSupabase === null) {
        // Return demo stats
        return {
          user_id: input.userId,
          stats_period: input.period,
          venues_visited: 12,
          total_visits: 28,
          favorite_venue_id: 'venue_001',
          favorite_drink_type: 'Beer',
          most_active_day: 'friday',
          most_active_time: '20:00-22:00',
          friends_made: 5,
          photos_shared: 15,
          reviews_written: 3,
          trophies_earned: 2,
          tasks_completed: 8,
          total_xp_earned: 1250
        };
      }

      const { data, error } = await safeSupabase
        .from('user_stats')
        .select('*')
        .eq('user_id', input.userId)
        .eq('stats_period', input.period)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching user stats:', error);
        throw new Error(`Failed to fetch user stats: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error in getUserStats:', error);
      throw new Error('Failed to fetch user statistics');
    }
  });

// Get leaderboard
export const getLeaderboardProcedure = publicProcedure
  .input(z.object({
    limit: z.number().optional().default(10),
    orderBy: z.enum(['xp', 'bars_hit', 'nights_out']).optional().default('xp')
  }))
  .query(async ({ input }) => {
    try {
      if (!safeSupabase || safeSupabase === null) {
        // Return demo leaderboard
        return [
          {
            user_id: 'user_1',
            username: 'nightowl_87',
            display_name: 'Night Owl',
            xp: 5420,
            level: 6,
            bars_hit: 15,
            nights_out: 12,
            current_rank: 'Buzzed Beginner',
            xp_rank: 1
          },
          {
            user_id: 'user_2',
            username: 'barhopper_23',
            display_name: 'Bar Hopper',
            xp: 4180,
            level: 5,
            bars_hit: 22,
            nights_out: 8,
            current_rank: 'Buzzed Beginner',
            xp_rank: 2
          },
          {
            user_id: 'user_3',
            username: 'party_king',
            display_name: 'Party King',
            xp: 3750,
            level: 4,
            bars_hit: 18,
            nights_out: 15,
            current_rank: 'Buzzed Beginner',
            xp_rank: 3
          }
        ];
      }

      const orderColumn = input.orderBy === 'xp' ? 'xp' : 
                         input.orderBy === 'bars_hit' ? 'bars_hit' : 'nights_out';

      const { data, error } = await safeSupabase
        .from('user_leaderboard')
        .select('*')
        .order(orderColumn, { ascending: false })
        .limit(input.limit);

      if (error) {
        console.error('❌ Error fetching leaderboard:', error);
        throw new Error(`Failed to fetch leaderboard: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getLeaderboard:', error);
      throw new Error('Failed to fetch leaderboard');
    }
  });

// Record venue interaction
export const recordVenueInteractionProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    venueId: z.string(),
    venueName: z.string().optional(),
    interactionType: z.enum(['visit', 'like', 'check_in', 'photo', 'review', 'share']),
    sessionId: z.string().optional(),
    nightOutId: z.string().optional(),
    details: z.object({
      arrivalTime: z.string().optional(),
      departureTime: z.string().optional(),
      drunkScaleRating: z.number().min(0).max(10).optional(),
      beersConsumed: z.number().optional().default(0),
      shotsConsumed: z.number().optional().default(0),
      poolGamesPlayed: z.number().optional().default(0),
      dartGamesPlayed: z.number().optional().default(0),
      photosTaken: z.number().optional().default(0)
    }).optional()
  }))
  .mutation(async ({ input }) => {
    try {
      if (!safeSupabase || safeSupabase === null) {
        console.warn('Supabase not configured - interaction recording skipped');
        return { success: true, message: 'Demo mode - interaction not persisted' };
      }

      const interactionData = {
        user_id: input.userId,
        venue_id: input.venueId,
        venue_name: input.venueName,
        interaction_type: input.interactionType,
        session_id: input.sessionId,
        night_out_id: input.nightOutId,
        arrival_time: input.details?.arrivalTime,
        departure_time: input.details?.departureTime,
        drunk_scale_rating: input.details?.drunkScaleRating,
        beers_consumed: input.details?.beersConsumed || 0,
        shots_consumed: input.details?.shotsConsumed || 0,
        pool_games_played: input.details?.poolGamesPlayed || 0,
        dart_games_played: input.details?.dartGamesPlayed || 0,
        photos_taken: input.details?.photosTaken || 0,
        timestamp: new Date().toISOString()
      };

      const { data, error } = await safeSupabase
        .from('venue_interactions')
        .insert(interactionData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error recording venue interaction:', error);
        throw new Error(`Failed to record interaction: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Error in recordVenueInteraction:', error);
      throw new Error('Failed to record venue interaction');
    }
  });