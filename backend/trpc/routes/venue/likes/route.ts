import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { safeSupabase } from "@/lib/supabase";

// Toggle venue like
export const toggleVenueLikeProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    venueId: z.string(),
    venueName: z.string().optional(),
    venueCategory: z.string().optional()
  }))
  .mutation(async ({ input }) => {
    try {
      if (!safeSupabase || safeSupabase === null) {
        console.warn('Supabase not configured - like toggle skipped');
        return { success: true, isLiked: true, message: 'Demo mode - likes not persisted' };
      }

      // Check if like already exists
      const { data: existingLike, error: selectError } = await safeSupabase
        .from('bar_likes')
        .select('id')
        .eq('user_id', input.userId)
        .eq('venue_id', input.venueId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('❌ Error checking existing like:', selectError);
        throw new Error(`Failed to check existing like: ${selectError.message}`);
      }

      if (existingLike) {
        // Remove like
        const { error: deleteError } = await safeSupabase
          .from('bar_likes')
          .delete()
          .eq('user_id', input.userId)
          .eq('venue_id', input.venueId);

        if (deleteError) {
          console.error('❌ Error removing like:', deleteError);
          throw new Error(`Failed to remove like: ${deleteError.message}`);
        }

        return { success: true, isLiked: false };
      } else {
        // Add like
        const { data, error: insertError } = await safeSupabase
          .from('bar_likes')
          .insert({
            user_id: input.userId,
            venue_id: input.venueId,
            venue_name: input.venueName,
            venue_category: input.venueCategory,
            liked_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error adding like:', insertError);
          throw new Error(`Failed to add like: ${insertError.message}`);
        }

        return { success: true, isLiked: true, data };
      }
    } catch (error) {
      console.error('❌ Error in toggleVenueLike:', error);
      throw new Error('Failed to toggle venue like');
    }
  });

// Get user's liked venues
export const getUserLikedVenuesProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    limit: z.number().optional().default(50)
  }))
  .query(async ({ input }) => {
    try {
      if (!safeSupabase || safeSupabase === null) {
        // Return demo data
        return [
          {
            id: 'demo-like-1',
            user_id: input.userId,
            venue_id: 'venue_001',
            venue_name: 'The Rusty Anchor',
            venue_category: 'Sports Bar',
            liked_at: new Date().toISOString(),
            is_favorite: false
          },
          {
            id: 'demo-like-2',
            user_id: input.userId,
            venue_id: 'venue_002',
            venue_name: 'Craft & Co.',
            venue_category: 'Brewery',
            liked_at: new Date().toISOString(),
            is_favorite: true
          }
        ];
      }

      const { data, error } = await safeSupabase
        .from('bar_likes')
        .select('*')
        .eq('user_id', input.userId)
        .order('liked_at', { ascending: false })
        .limit(input.limit);

      if (error) {
        console.error('❌ Error fetching user likes:', error);
        throw new Error(`Failed to fetch user likes: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getUserLikedVenues:', error);
      throw new Error('Failed to fetch user liked venues');
    }
  });

// Get global venue likes
export const getGlobalVenueLikesProcedure = publicProcedure
  .query(async () => {
    try {
      if (!safeSupabase || safeSupabase === null) {
        // Return demo data
        return [
          { venue_id: 'venue_001', venue_name: 'The Rusty Anchor', total_likes: 150 },
          { venue_id: 'venue_002', venue_name: 'Downtown Sports Bar', total_likes: 203 },
          { venue_id: 'venue_003', venue_name: 'Craft & Co.', total_likes: 89 },
          { venue_id: 'venue_004', venue_name: 'The Night Spot', total_likes: 134 }
        ];
      }

      const { data, error } = await safeSupabase
        .from('global_bar_likes')
        .select('venue_id, venue_name, total_likes')
        .order('total_likes', { ascending: false });

      if (error) {
        console.error('❌ Error loading global like counts:', error);
        throw new Error(`Failed to fetch global likes: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getGlobalVenueLikes:', error);
      throw new Error('Failed to fetch global venue likes');
    }
  });

// Get venue like count
export const getVenueLikeCountProcedure = publicProcedure
  .input(z.object({
    venueId: z.string()
  }))
  .query(async ({ input }) => {
    try {
      if (!safeSupabase || safeSupabase === null) {
        // Return demo count
        const demoCounts: { [key: string]: number } = {
          'venue_001': 150,
          'venue_002': 203,
          'venue_003': 89,
          'venue_004': 134
        };
        return { venue_id: input.venueId, total_likes: demoCounts[input.venueId] || 0 };
      }

      const { data, error } = await safeSupabase
        .from('global_bar_likes')
        .select('venue_id, total_likes')
        .eq('venue_id', input.venueId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching venue like count:', error);
        throw new Error(`Failed to fetch venue like count: ${error.message}`);
      }

      return data || { venue_id: input.venueId, total_likes: 0 };
    } catch (error) {
      console.error('❌ Error in getVenueLikeCount:', error);
      throw new Error('Failed to fetch venue like count');
    }
  });