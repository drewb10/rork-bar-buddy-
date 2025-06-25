import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingUp } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { venues } from '@/mocks/venues';
import VenueCard from '@/components/VenueCard';
import TopPickCard from '@/components/TopPickCard';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import DailyTracker from '@/components/DailyTracker';
import SectionHeader from '@/components/SectionHeader';
import FilterBar from '@/components/FilterBar';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { profile, initializeDefaultProfile } = useUserProfileStore();
  const { getMostPopularVenues } = useVenueInteractionStore();
  const [dailyTrackerVisible, setDailyTrackerVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Initialize default profile if none exists (for debugging)
  useEffect(() => {
    if (!profile) {
      console.log('🔄 No profile found, initializing default profile...');
      initializeDefaultProfile();
    }
  }, [profile, initializeDefaultProfile]);

  const handleViewAllVenues = () => {
    router.push('/all-venues');
  };

  const handleDailyTrackerPress = () => {
    setDailyTrackerVisible(true);
  };

  // Filter venues based on selected filters
  const filteredVenues = selectedFilters.length > 0 
    ? venues.filter(venue => venue.types && venue.types.some(type => selectedFilters.includes(type)))
    : venues;

  // Top picks - exactly 3 specific venues for promo placement
  const topPickIds = ['library-taphouse', 'late-night-library', 'jba-sports-bar'];
  const topPicks = venues.filter(venue => topPickIds.includes(venue.id)).slice(0, 3);

  // Rest of venues sorted by daily likes (excluding top picks)
  const popularVenues = getMostPopularVenues();
  const maconBars = filteredVenues
    .filter(venue => !topPickIds.includes(venue.id))
    .sort((a, b) => {
      const aLikes = popularVenues.find(p => p.venueId === a.id)?.likes || 0;
      const bLikes = popularVenues.find(p => p.venueId === b.id)?.likes || 0;
      return bLikes - aLikes;
    });

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <BarBuddyLogo size="large" />
          </View>
        </View>

        {/* Filter Bar */}
        <View style={styles.filterContainer}>
          <FilterBar 
            filters={selectedFilters}
            onFilterChange={setSelectedFilters}
            filterType="venue"
          />
        </View>

        {/* Daily Stat Tracker Tab */}
        <Pressable 
          style={[styles.dailyTrackerTab, { backgroundColor: '#111111' }]}
          onPress={handleDailyTrackerPress}
        >
          <TrendingUp size={20} color={themeColors.primary} />
          <Text style={[styles.dailyTrackerText, { color: '#FFFFFF' }]}>
            Daily Stat Tracker
          </Text>
        </Pressable>

        {/* Bar Buddy's Top Picks Section */}
        <SectionHeader 
          title="Bar Buddy's Top Picks"
          centered={true}
          showSeeAll={false}
        />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topPicksScrollContent}
          style={styles.topPicksScroll}
        >
          {topPicks.map((venue) => (
            <TopPickCard key={venue.id} venue={venue} />
          ))}
        </ScrollView>

        {/* Macon Bars Section */}
        <SectionHeader 
          title="Macon Bars"
          onViewAll={handleViewAllVenues}
        />
        
        <View style={styles.venueList}>
          {maconBars.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </View>

        <View style={styles.footer} />
      </ScrollView>

      {/* Daily Tracker Modal */}
      <DailyTracker
        visible={dailyTrackerVisible}
        onClose={() => setDailyTrackerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    marginBottom: 8,
  },
  dailyTrackerTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dailyTrackerText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  topPicksScroll: {
    marginBottom: 24,
  },
  topPicksScrollContent: {
    paddingHorizontal: 16,
  },
  venueList: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  footer: {
    height: 24,
  },
});