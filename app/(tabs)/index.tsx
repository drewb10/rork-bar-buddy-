import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChartBar as BarChart3, Flame } from 'lucide-react-native';
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
  const { interactions, resetInteractionsIfNeeded, getTotalLikes } = useVenueInteractionStore();
  const { getDailyStats } = useUserProfileStore();

  useEffect(() => {
    const day = getCurrentDay();
    const allSpecials = getSpecialsByDay(day);
    
    // Get top picks based on likes (most liked venues)
    const venuesWithLikes = venues.map(venue => ({
      venue,
      likes: interactions.find(i => i && i.venueId === venue.id)?.likes || 0
    }));
    
    // Sort by likes and take top 3
    const topLikedVenues = venuesWithLikes
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 3)
      .filter(item => item.likes > 0); // Only show venues with likes
    
    // If no venues have likes, fall back to specific venues
    const finalTopPicks = topLikedVenues.length > 0 
      ? topLikedVenues.map(item => item.venue)
      : venues.filter(v => ['2', '5', '6'].includes(v.id)); // The Library, Late Nite, JBA
    
    // Create TopPickItem objects
    const validTopPicks: TopPickItem[] = finalTopPicks
      .map(venue => {
        // Find today's special for this venue
        const todaySpecial = allSpecials.find(({ venue: v }) => v.id === venue.id)?.special;
        
        // Return TopPickItem object (todaySpecial is optional, so we can omit it if undefined)
        const topPickItem: TopPickItem = { venue };
        if (todaySpecial) {
          topPickItem.todaySpecial = todaySpecial;
        }
        
        return topPickItem;
      });
    
    setTopPickVenues(validTopPicks);
    resetInteractionsIfNeeded();
  }, [interactions]);

  const filteredVenues = venueFilters.length > 0
    ? venues.filter(venue => venue.types.some(type => venueFilters.includes(type)))
    : venues;

  // Sort venues by like count (most likes first)
  const sortedVenues = [...filteredVenues].sort((a, b) => {
    const aCount = interactions.find(i => i && i.venueId === a.id)?.likes || 0;
    const bCount = interactions.find(i => i && i.venueId === b.id)?.likes || 0;
    return bCount - aCount;
  });

  const dailyStats = getDailyStats();
  const totalDailyActivities = Object.values(dailyStats).reduce((sum, count) => sum + count, 0);
  const totalLikes = getTotalLikes();

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Logo and Total Likes Counter */}
        <View style={styles.headerContainer}>
          <BarBuddyLogo size="large" />
          
          {/* Total Likes Counter - Top Left */}
          <View style={[styles.totalLikesContainer, { backgroundColor: themeColors.primary }]}>
            <Flame size={16} color="white" fill="white" />
            <Text style={styles.totalLikesText}>{totalLikes}</Text>
          </View>
        </View>

        <FilterBar 
          filters={venueFilters}
          onFilterChange={setVenueFilters}
          filterType="venue"
        />

        {/* Daily Tracker Button - PRESERVED AS-IS (DO NOT MODIFY) */}
        <View style={styles.dailyTrackerContainer}>
          <Pressable
            style={[styles.dailyTrackerButton, { backgroundColor: '#000000', borderColor: themeColors.border, borderWidth: 1 }]}
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
              title="Most Liked Venues" 
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
            title="All Venues" 
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

      {/* Daily Tracker Modal - PRESERVED AS-IS (DO NOT MODIFY) */}
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
  headerContainer: {
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 16,
    position: 'relative',
  },
  totalLikesContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  totalLikesText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
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
    marginTop: 28,
  },
  horizontalList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  venueList: {
    paddingHorizontal: 16,
  },
  footer: {
    height: 32,
  },
});