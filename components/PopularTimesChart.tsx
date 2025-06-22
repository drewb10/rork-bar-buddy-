import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { Clock, TrendingUp } from 'lucide-react-native';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface PopularTimesChartProps {
  venueId: string;
}

interface TimeSlotData {
  time: string;
  count: number;
  isCurrentHour: boolean;
  isLive: boolean;
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const TIME_SLOTS = [
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', 
  '22:00', '22:30', '23:00', '23:30', '00:00', '00:30', 
  '01:00', '01:30', '02:00'
];

export default function PopularTimesChart({ venueId }: PopularTimesChartProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { getTimeSlotData, getAllInteractionsForVenue } = useVenueInteractionStore();
  const [selectedDay, setSelectedDay] = useState(getCurrentDayIndex());
  const [timeSlotData, setTimeSlotData] = useState<TimeSlotData[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    updateChartData();
    const interval = setInterval(updateChartData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [venueId, selectedDay]);

  const updateChartData = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinutes >= 30 ? '30' : '00'}`;
    
    // Get all interactions for this venue
    const allInteractions = getAllInteractionsForVenue(venueId);
    
    // Process time slot data
    const processedData: TimeSlotData[] = TIME_SLOTS.map(timeSlot => {
      // Count interactions for this time slot
      const count = allInteractions.filter(interaction => 
        interaction.arrivalTime === timeSlot
      ).length;
      
      const isCurrentHour = timeSlot === currentTimeSlot && isCurrentlyOpen();
      
      return {
        time: timeSlot,
        count,
        isCurrentHour,
        isLive: isCurrentHour && count > getAverageCount(allInteractions)
      };
    });

    setTimeSlotData(processedData);
    setIsLive(processedData.some(slot => slot.isLive));
  };

  const getAverageCount = (interactions: any[]) => {
    if (interactions.length === 0) return 0;
    const totalCount = interactions.reduce((sum, interaction) => sum + (interaction.count || 1), 0);
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

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    if (hour === 0) return '12a';
    if (hour < 12) return `${hour}a`;
    if (hour === 12) return '12p';
    return `${hour - 12}p`;
  };

  const getMaxCount = () => {
    return Math.max(...timeSlotData.map(slot => slot.count), 1);
  };

  const getBarHeight = (count: number) => {
    const maxHeight = 120;
    const maxCount = getMaxCount();
    return Math.max((count / maxCount) * maxHeight, 8); // Minimum height of 8
  };

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
      <View style={styles.chartContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartContent}
        >
          {timeSlotData.map((slot, index) => (
            <View key={slot.time} style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    height: getBarHeight(slot.count),
                    backgroundColor: slot.isCurrentHour 
                      ? themeColors.primary 
                      : slot.isLive 
                        ? themeColors.primary + '80'
                        : themeColors.primary + '40'
                  }
                ]}
              />
              {slot.count > 0 && (
                <Text style={[styles.countText, { color: themeColors.subtext }]}>
                  {slot.count}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
        
        {/* Time labels */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeLabelsContent}
        >
          {TIME_SLOTS.map((time, index) => (
            index % 2 === 0 && (
              <View key={time} style={styles.timeLabelContainer}>
                <Text style={[styles.timeLabel, { color: themeColors.subtext }]}>
                  {formatTime(time)}
                </Text>
              </View>
            )
          ))}
        </ScrollView>
      </View>

      {timeSlotData.every(slot => slot.count === 0) && (
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
  chartContent: {
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    marginHorizontal: 3,
    minWidth: 16,
  },
  bar: {
    width: 16,
    borderRadius: 2,
    marginBottom: 4,
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