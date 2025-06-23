import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChartBar as BarChart3 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { venues, getSpecialsByDay } from '@/mocks/venues';
import VenueCard from '@/components/VenueCard';
import SectionHeader from '@/components/SectionHeader';
import FilterBar from '@/components/FilterBar';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import TopPickCard from '@/components/TopPickCard';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import DailyTracker from '@/components/DailyTracker';
import { TopPickItem } from '@/types/venue';
import { useUserProfileStore } from '@/stores/userProfileStore';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [venueFilters, setVenueFilters] = useState<string[]>([]);
  const [topPickVenues, setTopPickVenues] = useState<TopPickItem[]>([]);
  const [showDailyTracker, setShowDailyTracker] = useState(false);
  const { interactions, resetInteractionsIfNeeded } = useVenueInteractionStore();
  const { getDailyStats } = useUserProfileStore();

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

  const dailyStats = getDailyStats();
  const totalDailyActivities = Object.values(dailyStats).reduce((sum, count) => sum + count, 0);

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* BarBuddy Logo */}
        <View style={styles.logoContainer}>
          <BarBuddyLogo size="large" />
        </View>

        <FilterBar 
          filters={venueFilters}
          onFilterChange={setVenueFilters}
          filterType="venue"
        />

        {/* Daily Tracker Icon - Updated to black background */}
        <View style={styles.dailyTrackerContainer}>
          <Pressable
            style={[styles.dailyTrackerButton, { backgroundColor: '#000000' }]}
            onPress={() => setShowDailyTracker(true)}
          >
            <BarChart3 size={24} color="white" />
            <Text style={styles.dailyTrackerText}>Daily Tracker</Text>
            {totalDailyActivities > 0 && (
              <View style={[styles.badge, { backgroundColor: themeColors.accent }]}>
                <Text style={styles.badgeText}>{totalDailyActivities}</Text>
              </View>
            )}
          </Pressable>
        </View>

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

      <DailyTracker 
        visible={showDailyTracker}
        onClose={() => setShowDailyTracker(false)}
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
  dailyTrackerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  dailyTrackerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  dailyTrackerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
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
  footer: {
    height: 24,
  },
});