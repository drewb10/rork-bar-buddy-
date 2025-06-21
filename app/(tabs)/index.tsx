import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Dimensions, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Heart, TrendingUp } from 'lucide-react-native';
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
import { Venue, Special } from '@/types/venue';

interface TopPickItem {
  venue: Venue;
  todaySpecial?: Special;
}

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [venueFilters, setVenueFilters] = useState<string[]>([]);
  const [topPickVenues, setTopPickVenues] = useState<TopPickItem[]>([]);
  const { interactions, resetInteractionsIfNeeded } = useVenueInteractionStore();

  useEffect(() => {
    const day = getCurrentDay();
    const allSpecials = getSpecialsByDay(day);
    
    // Get the 3 specific venues for top picks
    const topPickVenueIds = ['2', '5', '6']; // The Library, Late Nite, JBA
    const topPicks = topPickVenueIds
      .map(venueId => {
        const venue = venues.find(v => v.id === venueId);
        if (!venue) return null;
        
        // Find today's special for this venue
        const todaySpecial = allSpecials.find(({ venue: v }) => v.id === venueId)?.special;
        
        return { venue, todaySpecial };
      })
      .filter((pick): pick is NonNullable<typeof pick> => pick !== null) as TopPickItem[];
    
    setTopPickVenues(topPicks);
    resetInteractionsIfNeeded();
  }, []);

  const filteredVenues = venueFilters.length > 0
    ? venues.filter(venue => venue.types.some(type => venueFilters.includes(type)))
    : venues;

  // Sort venues by interaction count (most interactions first)
  const sortedVenues = [...filteredVenues].sort((a, b) => {
    const aCount = interactions.find(i => i.venueId === a.id)?.count || 0;
    const bCount = interactions.find(i => i.venueId === b.id)?.count || 0;
    return bCount - aCount;
  });

  return (
    <View style={[styles.container, { backgroundColor: '#121212' }]}>
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
              {topPickVenues.map(({ venue, todaySpecial }) => (
                <TopPickCard 
                  key={venue.id} 
                  venue={venue}
                  todaySpecial={todaySpecial}
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