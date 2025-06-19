import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export default publicProcedure
  .input(z.object({ 
    venueId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }))
  .query(async ({ input }) => {
    try {
      let query = supabase
        .from('venue_interactions')
        .select('*');

      if (input.venueId) {
        query = query.eq('venue_id', input.venueId);
      }

      if (input.startDate) {
        query = query.gte('timestamp', input.startDate);
      }

      if (input.endDate) {
        query = query.lte('timestamp', input.endDate);
      }

      const { data: interactions, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return {
          success: false,
          error: error.message,
          data: null
        };
      }

      // Process analytics data
      const totalInteractions = interactions?.length || 0;
      const uniqueUsers = new Set(interactions?.map(i => i.user_id)).size;
      
      // Popular times analysis
      const timeCounts: Record<string, number> = {};
      interactions?.forEach(interaction => {
        if (interaction.arrival_time) {
          timeCounts[interaction.arrival_time] = (timeCounts[interaction.arrival_time] || 0) + 1;
        }
      });

      const popularTimes = Object.entries(timeCounts)
        .map(([time, count]) => ({ time, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      // Venue breakdown
      const venueCounts: Record<string, number> = {};
      interactions?.forEach(interaction => {
        venueCounts[interaction.venue_id] = (venueCounts[interaction.venue_id] || 0) + 1;
      });

      const venueBreakdown = Object.entries(venueCounts)
        .map(([venueId, count]) => ({ venueId, interactions: count }))
        .sort((a, b) => b.interactions - a.interactions);

      // Daily stats (last 5 days)
      const dailyStats: { date: string; interactions: number }[] = [];
      for (let i = 4; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const dayInteractions = interactions?.filter(interaction => 
          interaction.timestamp.startsWith(dateString)
        ).length || 0;

        dailyStats.push({ date: dateString, interactions: dayInteractions });
      }

      const analyticsData = {
        totalInteractions,
        uniqueUsers,
        popularTimes,
        venueBreakdown,
        dailyStats
      };
      
      return {
        success: true,
        data: analyticsData,
        message: 'Analytics data retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        success: false,
        error: 'Internal server error',
        data: null
      };
    }
  });