import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const getPopularTimesProcedure = publicProcedure
  .input(z.object({ 
    venueId: z.string(),
    dayOfWeek: z.number().min(0).max(6).optional(), // 0 = Sunday, 6 = Saturday
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }))
  .query(async ({ input }) => {
    try {
      let query = supabase
        .from('venue_interactions')
        .select('arrival_time, timestamp, venue_id')
        .eq('venue_id', input.venueId)
        .not('arrival_time', 'is', null);

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

      // Filter by day of week if specified
      let filteredInteractions = interactions || [];
      if (input.dayOfWeek !== undefined) {
        filteredInteractions = filteredInteractions.filter(interaction => {
          const date = new Date(interaction.timestamp);
          return date.getDay() === input.dayOfWeek;
        });
      }

      // Process time slot data
      const timeSlotCounts: Record<string, number> = {};
      
      filteredInteractions.forEach(interaction => {
        if (interaction.arrival_time) {
          timeSlotCounts[interaction.arrival_time] = (timeSlotCounts[interaction.arrival_time] || 0) + 1;
        }
      });

      // Convert to array format with time slots
      const timeSlots = [
        '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', 
        '22:00', '22:30', '23:00', '23:30', '00:00', '00:30', 
        '01:00', '01:30', '02:00'
      ];

      const popularTimesData = timeSlots.map(timeSlot => ({
        time: timeSlot,
        count: timeSlotCounts[timeSlot] || 0,
        percentage: 0 // Will be calculated below
      }));

      // Calculate percentages
      const maxCount = Math.max(...popularTimesData.map(slot => slot.count), 1);
      popularTimesData.forEach(slot => {
        slot.percentage = maxCount > 0 ? (slot.count / maxCount) * 100 : 0;
      });

      // Determine if currently live/busy
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinutes >= 30 ? '30' : '00'}`;
      
      const currentSlotData = popularTimesData.find(slot => slot.time === currentTimeSlot);
      const averageCount = popularTimesData.reduce((sum, slot) => sum + slot.count, 0) / popularTimesData.length;
      const isCurrentlyBusy = currentSlotData && currentSlotData.count > averageCount * 1.2;

      const result = {
        venueId: input.venueId,
        timeSlots: popularTimesData,
        isCurrentlyBusy,
        currentTimeSlot,
        totalInteractions: filteredInteractions.length,
        peakTime: popularTimesData.reduce((peak, slot) => 
          slot.count > peak.count ? slot : peak, 
          popularTimesData[0]
        )
      };
      
      return {
        success: true,
        data: result,
        message: 'Popular times data retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting popular times:', error);
      return {
        success: false,
        error: 'Internal server error',
        data: null
      };
    }
  });

export default getPopularTimesProcedure;