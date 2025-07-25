import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { venues } from '@/mocks/venues';
import VenueCard from '@/components/VenueCard';
import TopPickCard from '@/components/TopPickCard';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import FilterBar from '@/components/FilterBar';
import { MVP_CONFIG } from '@/constants/mvp-config';

// Safe import for DailyTracker
let DailyTracker: React.ComponentType<any> | null = null;
try {
  DailyTracker = require('@/components/DailyTracker').default;
} catch (error) {
  console.warn('DailyTracker component not found');
}

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { profile } = useUserProfileStore();
  const { getMostPopularVenues } = useVenueInteractionStore();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Filter venues based on selected filters
  const filteredVenues = selectedFilters.length > 0 
    ? venues.filter(venue => venue.types && venue.types.some(venueType => selectedFilters.includes(venueType)))
    : venues;

  // Top picks - exactly 3 specific venues for promo placement
  const topPickIds = ['library-taphouse', 'late-night-library', 'jba-sports-bar'];
  const topPicks = venues.filter(venue => topPickIds.includes(venue.id)).slice(0, 3);

  // Rest of venues sorted by daily likes (including top picks)
  const popularVenues = getMostPopularVenues();
  const maconBars = filteredVenues
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
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <BarBuddyLogo size="large" />
          </View>
        </View>

        {/* Category Filter Bar */}
        <View style={styles.filterContainer}>
          <FilterBar 
            filters={selectedFilters}
            onFilterChange={setSelectedFilters}
            filterType="venue"
          />
        </View>

        {/* Daily Stat Tracker Tab - Disabled in MVP */}
        {MVP_CONFIG.ENABLE_DAILY_TRACKER && (
          <Pressable 
            style={[styles.dailyTrackerTab, { backgroundColor: '#111111' }]}
            onPress={() => {}}
          >
            <TrendingUp size={20} color={themeColors.primary} />
            <Text style={[styles.dailyTrackerText, { color: '#FFFFFF' }]}>
              Daily Stat Tracker
            </Text>
          </Pressable>
        )}

        {/* Bar Buddy's Top Picks Section */}
        <View style={styles.topPicksSection}>
          <Text style={[styles.topPicksTitle, { color: themeColors.primary }]}>
            Bar Buddy's Top Picks
          </Text>
          
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
        </View>

        {/* Macon Bars Section */}
        <View style={styles.maconBarsSection}>
          <Text style={[styles.maconBarsTitle, { color: themeColors.text }]}>
            Macon Bars
          </Text>
        </View>
        
        <View style={styles.venueList}>
          {maconBars.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </View>

        <View style={styles.footer} />
      </ScrollView>

      {/* Daily Tracker Modal - Disabled in MVP */}
      {MVP_CONFIG.ENABLE_DAILY_TRACKER && DailyTracker && (
        <DailyTracker
          visible={false}
          onClose={() => {}}
        />
      )}
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 8,
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
  topPicksSection: {
    marginBottom: 24,
  },
  topPicksTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  topPicksScroll: {
    marginBottom: 0,
  },
  topPicksScrollContent: {
    paddingHorizontal: 16,
  },
  maconBarsSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  maconBarsTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  venueList: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  footer: {
    height: 24,
  },
});