import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { Clock, TrendingUp, Heart, Users, Flame } from 'lucide-react-native';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface PopularTimesChartProps {
  venueId: string;
  expanded?: boolean;
}

interface TimeSlotData {
  time: string;
  count: number;
  likes: number;
  isCurrentHour: boolean;
  isLive: boolean;
  isPeak: boolean;
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const TIME_SLOTS = [
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', 
  '22:00', '22:30', '23:00', '23:30', '00:00', '00:30', 
  '01:00', '01:30', '02:00'
];

export default function PopularTimesChart({ venueId, expanded = false }: PopularTimesChartProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { getTimeSlotData, getAllInteractionsForVenue, getLikeCount } = useVenueInteractionStore();
  const [selectedDay, setSelectedDay] = useState(getCurrentDayIndex());
  const [timeSlotData, setTimeSlotData] = useState<TimeSlotData[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [viewMode, setViewMode] = useState<'visits' | 'likes'>('visits');

  useEffect(() => {
    if (venueId) {
      updateChartData();
      const interval = setInterval(updateChartData, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [venueId, selectedDay, viewMode]);

  const updateChartData = () => {
    try {
      if (!venueId) return;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinutes >= 30 ? '30' : '00'}`;
      
      // Get all interactions for this venue
      const allInteractions = getAllInteractionsForVenue(venueId) || [];
      
      // Process time slot data with proper null checks
      const processedData: TimeSlotData[] = TIME_SLOTS.map(timeSlot => {
        if (!timeSlot) {
          return {
            time: '',
            count: 0,
            likes: 0,
            isCurrentHour: false,
            isLive: false,
            isPeak: false
          };
        }

        // Count interactions for this time slot
        const slotInteractions = allInteractions.filter(interaction => 
          interaction && interaction.arrivalTime === timeSlot
        );
        
        const count = slotInteractions.length;
        const likes = slotInteractions.reduce((sum, interaction) => {
          return sum + (interaction?.likes || 0);
        }, 0);
        
        const isCurrentHour = timeSlot === currentTimeSlot && isCurrentlyOpen();
        
        return {
          time: timeSlot,
          count,
          likes,
          isCurrentHour,
          isLive: isCurrentHour && count > getAverageCount(allInteractions),
          isPeak: false // Will be set below
        };
      });

      // Mark peak times (top 3 busiest slots)
      const sortedByActivity = [...processedData]
        .filter(slot => slot && slot.time) // Filter out invalid slots
        .sort((a, b) => 
          viewMode === 'likes' ? b.likes - a.likes : b.count - a.count
        );
      
      sortedByActivity.slice(0, 3).forEach(slot => {
        if (slot && slot.time) {
          const index = processedData.findIndex(s => s && s.time === slot.time);
          if (index !== -1 && processedData[index]) {
            processedData[index].isPeak = true;
          }
        }
      });

      setTimeSlotData(processedData);
      setIsLive(processedData.some(slot => slot && slot.isLive));
    } catch (error) {
      console.warn('Error updating chart data:', error);
      // Set empty data on error
      setTimeSlotData([]);
      setIsLive(false);
    }
  };

  const getAverageCount = (interactions: any[]) => {
    if (!interactions || interactions.length === 0) return 0;
    const totalCount = interactions.reduce((sum, interaction) => {
      return sum + (interaction?.count || 1);
    }, 0);
    return totalCount / TIME_SLOTS.length;
  };

  const isCurrentlyOpen = () => {
    const now = new Date();
    const currentHour = now.getHours();
    // Assume bars are open from 7 PM to 2 AM
    return currentHour >= 19 || currentHour <= 2;
  };

  const handleDayPress = (dayIndex: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedDay(dayIndex);
  };

  const handleTimeSlotPress = (timeSlot: string) => {
    if (!timeSlot) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedTimeSlot(selectedTimeSlot === timeSlot ? null : timeSlot);
  };

  const handleViewModeToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setViewMode(viewMode === 'visits' ? 'likes' : 'visits');
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    if (hour === 0) return '12a';
    if (hour < 12) return `${hour}a`;
    if (hour === 12) return '12p';
    return `${hour - 12}p`;
  };

  const getMaxValue = () => {
    if (!timeSlotData || timeSlotData.length === 0) return 1;
    const values = timeSlotData
      .filter(slot => slot && slot.time)
      .map(slot => viewMode === 'likes' ? slot.likes : slot.count);
    return Math.max(...values, 1);
  };

  const getBarHeight = (slot: TimeSlotData) => {
    if (!slot || !slot.time) return 8;
    const maxHeight = expanded ? 140 : 120;
    const maxValue = getMaxValue();
    const value = viewMode === 'likes' ? slot.likes : slot.count;
    return Math.max((value / maxValue) * maxHeight, 8); // Minimum height of 8
  };

  const getBarColor = (slot: TimeSlotData) => {
    if (!slot || !slot.time) return themeColors.primary + '40';
    if (slot.isCurrentHour) return themeColors.primary;
    if (slot.isPeak) return themeColors.primary + 'CC';
    if (slot.isLive) return themeColors.primary + '80';
    return themeColors.primary + '40';
  };

  const getTotalStats = () => {
    if (!timeSlotData || timeSlotData.length === 0) {
      return { 
        totalVisits: 0, 
        totalLikes: 0, 
        peakTime: { time: '20:00', count: 0, likes: 0 } 
      };
    }

    const validSlots = timeSlotData.filter(slot => slot && slot.time);
    const totalVisits = validSlots.reduce((sum, slot) => sum + (slot?.count || 0), 0);
    const totalLikes = validSlots.reduce((sum, slot) => sum + (slot?.likes || 0), 0);
    const peakTime = validSlots.reduce((peak, slot) => {
      if (!peak || !slot) return peak || { time: '20:00', count: 0, likes: 0 };
      const peakValue = viewMode === 'likes' ? peak.likes : peak.count;
      const slotValue = viewMode === 'likes' ? slot.likes : slot.count;
      return slotValue > peakValue ? slot : peak;
    }, validSlots[0] || { time: '20:00', count: 0, likes: 0 });
    
    return { totalVisits, totalLikes, peakTime };
  };

  const stats = getTotalStats();

  // Don't render if no venue ID
  if (!venueId) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.card }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Clock size={20} color={themeColors.text} />
          <Text style={[styles.title, { color: themeColors.text }]}>
            Popular times
          </Text>
        </View>
        
        {isLive && (
          <View style={[styles.liveIndicator, { backgroundColor: themeColors.primary + '20' }]}>
            <View style={[styles.liveDot, { backgroundColor: themeColors.primary }]} />
            <Text style={[styles.liveText, { color: themeColors.primary }]}>
              Live: Busier than usual
            </Text>
          </View>
        )}
      </View>

      {/* Stats Summary */}
      {expanded && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: themeColors.background }]}>
            <Users size={16} color={themeColors.primary} />
            <Text style={[styles.statNumber, { color: themeColors.text }]}>{stats.totalVisits}</Text>
            <Text style={[styles.statLabel, { color: themeColors.subtext }]}>Total Visits</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: themeColors.background }]}>
            <Heart size={16} color={themeColors.primary} />
            <Text style={[styles.statNumber, { color: themeColors.text }]}>{stats.totalLikes}</Text>
            <Text style={[styles.statLabel, { color: themeColors.subtext }]}>Total Likes</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: themeColors.background }]}>
            <Flame size={16} color={themeColors.primary} />
            <Text style={[styles.statNumber, { color: themeColors.text }]}>
              {stats.peakTime?.time ? formatTime(stats.peakTime.time) : 'N/A'}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.subtext }]}>Peak Time</Text>
          </View>
        </View>
      )}

      {/* View Mode Toggle */}
      {expanded && (
        <View style={styles.toggleContainer}>
          <Pressable
            style={[
              styles.toggleButton,
              viewMode === 'visits' && { backgroundColor: themeColors.primary },
              { borderColor: themeColors.primary }
            ]}
            onPress={handleViewModeToggle}
          >
            <Users size={16} color={viewMode === 'visits' ? 'white' : themeColors.primary} />
            <Text style={[
              styles.toggleText,
              { color: viewMode === 'visits' ? 'white' : themeColors.primary }
            ]}>
              Visits
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.toggleButton,
              viewMode === 'likes' && { backgroundColor: themeColors.primary },
              { borderColor: themeColors.primary }
            ]}
            onPress={handleViewModeToggle}
          >
            <Heart size={16} color={viewMode === 'likes' ? 'white' : themeColors.primary} />
            <Text style={[
              styles.toggleText,
              { color: viewMode === 'likes' ? 'white' : themeColors.primary }
            ]}>
              Likes
            </Text>
          </Pressable>
        </View>
      )}

      {/* Day selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
        contentContainerStyle={styles.daySelectorContent}
      >
        {DAYS.map((day, index) => (
          <Pressable
            key={day}
            style={[
              styles.dayButton,
              selectedDay === index && { 
                borderBottomColor: themeColors.primary,
                borderBottomWidth: 2
              }
            ]}
            onPress={() => handleDayPress(index)}
          >
            <Text
              style={[
                styles.dayText,
                { 
                  color: selectedDay === index ? themeColors.primary : themeColors.subtext,
                  fontWeight: selectedDay === index ? '600' : '400'
                }
              ]}
            >
              {day}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Chart */}
      <View style={[styles.chartContainer, expanded && styles.expandedChart]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartContent}
        >
          {timeSlotData.filter(slot => slot && slot.time).map((slot, index) => (
            <Pressable
              key={slot.time || index}
              style={styles.barContainer}
              onPress={() => expanded && slot.time && handleTimeSlotPress(slot.time)}
            >
              <View
                style={[
                  styles.bar,
                  {
                    height: getBarHeight(slot),
                    backgroundColor: getBarColor(slot)
                  },
                  selectedTimeSlot === slot.time && expanded && {
                    borderWidth: 2,
                    borderColor: themeColors.primary,
                    shadowColor: themeColors.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 4,
                    elevation: 8,
                  }
                ]}
              />
              
              {/* Peak indicator */}
              {slot.isPeak && (
                <View style={[styles.peakIndicator, { backgroundColor: themeColors.primary }]}>
                  <Flame size={8} color="white" />
                </View>
              )}
              
              {/* Value display */}
              {(viewMode === 'likes' ? slot.likes : slot.count) > 0 && (
                <Text style={[styles.countText, { color: themeColors.subtext }]}>
                  {viewMode === 'likes' ? slot.likes : slot.count}
                </Text>
              )}
            </Pressable>
          ))}
        </ScrollView>
        
        {/* Time labels */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeLabelsContent}
        >
          {TIME_SLOTS.map((time, index) => (
            index % 2 === 0 && time && (
              <View key={time} style={styles.timeLabelContainer}>
                <Text style={[styles.timeLabel, { color: themeColors.subtext }]}>
                  {formatTime(time)}
                </Text>
              </View>
            )
          ))}
        </ScrollView>
      </View>

      {/* Selected Time Slot Details */}
      {selectedTimeSlot && expanded && (
        <View style={[styles.detailsContainer, { backgroundColor: themeColors.background }]}>
          <Text style={[styles.detailsTitle, { color: themeColors.text }]}>
            {formatTime(selectedTimeSlot)} Details
          </Text>
          
          {(() => {
            const slot = timeSlotData.find(s => s && s.time === selectedTimeSlot);
            if (!slot) return null;
            
            return (
              <View style={styles.detailsContent}>
                <View style={styles.detailRow}>
                  <Users size={16} color={themeColors.primary} />
                  <Text style={[styles.detailText, { color: themeColors.text }]}>
                    {slot.count} visits
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Heart size={16} color={themeColors.primary} />
                  <Text style={[styles.detailText, { color: themeColors.text }]}>
                    {slot.likes} likes
                  </Text>
                </View>
                
                {slot.isPeak && (
                  <View style={styles.detailRow}>
                    <Flame size={16} color={themeColors.primary} />
                    <Text style={[styles.detailText, { color: themeColors.primary }]}>
                      Peak time
                    </Text>
                  </View>
                )}
                
                {slot.isLive && (
                  <View style={styles.detailRow}>
                    <View style={[styles.liveDot, { backgroundColor: themeColors.primary }]} />
                    <Text style={[styles.detailText, { color: themeColors.primary }]}>
                      Currently busy
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}
        </View>
      )}

      {(!timeSlotData || timeSlotData.length === 0 || timeSlotData.every(slot => !slot || !slot.time || (slot.count === 0 && slot.likes === 0))) && (
        <View style={styles.emptyState}>
          <TrendingUp size={24} color={themeColors.subtext} />
          <Text style={[styles.emptyText, { color: themeColors.subtext }]}>
            No data available yet
          </Text>
          <Text style={[styles.emptySubtext, { color: themeColors.subtext }]}>
            Popular times will show as more people check in
          </Text>
        </View>
      )}
    </View>
  );
}

function getCurrentDayIndex(): number {
  const today = new Date().getDay();
  // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  return today === 0 ? 6 : today - 1;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignSelf: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  daySelector: {
    marginBottom: 20,
  },
  daySelectorContent: {
    paddingHorizontal: 4,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    height: 160,
  },
  expandedChart: {
    height: 200,
  },
  chartContent: {
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    marginHorizontal: 3,
    minWidth: 16,
    position: 'relative',
  },
  bar: {
    width: 16,
    borderRadius: 2,
    marginBottom: 4,
  },
  peakIndicator: {
    position: 'absolute',
    top: -12,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 10,
    fontWeight: '500',
  },
  timeLabelsContent: {
    paddingHorizontal: 4,
  },
  timeLabelContainer: {
    width: 38, // Accounts for 2 bars + margins
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '400',
  },
  detailsContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailsContent: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});