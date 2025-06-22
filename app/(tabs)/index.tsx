import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Dimensions, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Heart, TrendingUp, BarChart3 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { venues, getSpecialsByDay } from '@/mocks/venues';
import VenueCard from '@/components/VenueCard';
import SpecialCard from '@/components/SpecialCard';
import SectionHeader from '@/components/SectionHeader';
import FilterBar from '@/components/FilterBar';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import TopPickCard from '@/components/TopPickCard';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import DailyTrackerModal from '@/components/DailyTrackerModal';
import { useDailyTrackerStore } from '@/stores/dailyTrackerStore';
import { Venue, Special, TopPickItem } from '@/types/venue';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [venueFilters, setVenueFilters] = useState<string[]>([]);
  const [topPickVenues, setTopPickVenues] = useState<TopPickItem[]>([]);
  const [dailyTrackerVisible, setDailyTrackerVisible] = useState(false);
  const { interactions, resetInteractionsIfNeeded } = useVenueInteractionStore();
  const { getDailyTotal, resetDailyStatsIfNeeded } = useDailyTrackerStore();

  useEffect(() => {
    const day = getCurrentDay();
    const allSpecials = getSpecialsByDay(day);
    
    // Get the 3 specific venues for top picks
    const topPickVenueIds = ['2', '5', '6']; // The Library, Late Nite, JBA
    
    // Create TopPickItem objects, filtering out venues that don't exist
    const validTopPicks: TopPickItem[] = topPickVenueIds
      .map(venueId => {
        const venue = venues.find(v => v.id === venueId);
        if (!venue) return null;
        
        // Find today's special for this venue
        const todaySpecial = allSpecials.find(({ venue: v }) => v.id === venueId)?.special;
        
        // Return TopPickItem object (todaySpecial is optional, so we can omit it if undefined)
        const topPickItem: TopPickItem = { venue };
        if (todaySpecial) {
          topPickItem.todaySpecial = todaySpecial;
        }
        
        return topPickItem;
      })
      .filter((item): item is TopPickItem => item !== null);
    
    setTopPickVenues(validTopPicks);
    resetInteractionsIfNeeded();
    resetDailyStatsIfNeeded();
  }, []);

  const filteredVenues = venueFilters.length > 0
    ? venues.filter(venue => venue.types.some(type => venueFilters.includes(type)))
    : venues;

  // Sort venues by interaction count (most interactions first)
  const sortedVenues = [...filteredVenues].sort((a, b) => {
    const aCount = interactions.find(i => i && i.venueId === a.id)?.count || 0;
    const bCount = interactions.find(i => i && i.venueId === b.id)?.count || 0;
    return bCount - aCount;
  });

  const handleDailyTrackerPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDailyTrackerVisible(true);
  };

  const dailyTotal = getDailyTotal();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* BarBuddy Logo */}
        <View style={styles.logoContainer}>
          <BarBuddyLogo size="medium" />
        </View>

        <FilterBar 
          filters={venueFilters}
          onFilterChange={setVenueFilters}
          filterType="venue"
        />

        {topPickVenues.length > 0 && (
          <View style={styles.section}>
            <SectionHeader 
              title="Bar Buddy's Top Picks" 
              centered={true}
              showSeeAll={false}
            />
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {topPickVenues.map((topPickItem) => (
                <TopPickCard 
                  key={topPickItem.venue.id} 
                  venue={topPickItem.venue}
                  todaySpecial={topPickItem.todaySpecial}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Daily Tracker Icon - Removed like counter */}
        <View style={styles.dailyTrackerSection}>
          <Pressable 
            style={[styles.dailyTrackerButton, { backgroundColor: 'rgba(30, 30, 30, 0.9)' }]}
            onPress={handleDailyTrackerPress}
          >
            <BarChart3 size={20} color={themeColors.primary} />
            <Text style={[styles.dailyTrackerText, { color: themeColors.text }]}>
              Daily Tracker
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <SectionHeader 
            title="Popular Venues" 
            showSeeAll={false}
          />
          <View style={styles.venueList}>
            {sortedVenues.map(venue => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </View>
        </View>

        <View style={styles.footer} />
      </ScrollView>

      {/* Daily Tracker Modal */}
      <DailyTrackerModal
        visible={dailyTrackerVisible}
        onClose={() => setDailyTrackerVisible(false)}
      />
    </View>
  );
}

function getCurrentDay(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  logoContainer: {
    alignItems: 'center',
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  horizontalList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  venueList: {
    paddingHorizontal: 16,
  },
  dailyTrackerSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  dailyTrackerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dailyTrackerText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    height: 24,
  },
});