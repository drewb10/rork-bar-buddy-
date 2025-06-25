import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, TrendingUp, Calendar } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { venues } from '@/mocks/venues';
import VenueCard from '@/components/VenueCard';
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

  const handleViewAllSpecials = () => {
    router.push('/all-specials');
  };

  const handleLocationPress = () => {
    // TODO: Implement location selection
    Alert.alert('Location', 'Location selection coming soon!');
  };

  const handleDailyTrackerPress = () => {
    setDailyTrackerVisible(true);
  };

  // Get today's day for filtering specials
  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  // Get venues with today's specials
  const venuesWithSpecials = venues.filter(venue => 
    venue.specials && venue.specials.some(special => special.day === getCurrentDay())
  );

  // Filter venues based on selected filters
  const filteredVenues = selectedFilters.length > 0 
    ? venues.filter(venue => selectedFilters.includes(venue.type))
    : venues;

  // Top picks - specific venues as requested
  const topPickIds = ['library-taphouse', 'late-night-library', 'jba-sports-bar'];
  const topPicks = venues.filter(venue => topPickIds.includes(venue.id));

  // Rest of venues sorted by daily likes (excluding top picks)
  const popularVenues = getMostPopularVenues();
  const restOfVenues = filteredVenues
    .filter(venue => !topPickIds.includes(venue.id))
    .sort((a, b) => {
      const aLikes = popularVenues.find(p => p.venueId === a.id)?.likes || 0;
      const bLikes = popularVenues.find(p => p.venueId === b.id)?.likes || 0;
      return bLikes - aLikes;
    });

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <BarBuddyLogo size="medium" />
          </View>
          <Pressable 
            style={[styles.trackerButton, { backgroundColor: themeColors.primary }]}
            onPress={handleDailyTrackerPress}
          >
            <TrendingUp size={18} color="white" />
          </Pressable>
        </View>
        
        <Pressable style={styles.locationContainer} onPress={handleLocationPress}>
          <MapPin size={16} color={themeColors.primary} />
          <Text style={[styles.locationText, { color: themeColors.text }]}>
            Downtown Madison
          </Text>
        </Pressable>
      </View>

      {/* Filter Bar */}
      <FilterBar 
        filters={selectedFilters}
        onFilterChange={setSelectedFilters}
        filterType="venue"
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Picks Section */}
        <SectionHeader 
          title="BarBuddy's Top Picks"
          subtitle="Discover the best bars in your area"
          onViewAll={handleViewAllVenues}
        />
        
        <View style={styles.venueList}>
          {topPicks.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </View>

        {/* Rest of Venues (sorted by likes) */}
        {restOfVenues.length > 0 && (
          <>
            <View style={styles.venueList}>
              {restOfVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </View>
          </>
        )}

        {/* Today's Specials Section */}
        {venuesWithSpecials.length > 0 && (
          <>
            <SectionHeader 
              title="Today's Specials"
              subtitle={`${getCurrentDay()} deals you don't want to miss`}
              onViewAll={handleViewAllSpecials}
              icon={<Calendar size={20} color={themeColors.primary} />}
            />
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
              style={styles.horizontalScroll}
            >
              {venuesWithSpecials.map((venue) => (
                <VenueCard key={`special-${venue.id}`} venue={venue} compact />
              ))}
            </ScrollView>
          </>
        )}

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
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  trackerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  venueList: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  horizontalScroll: {
    marginBottom: 32,
  },
  horizontalScrollContent: {
    paddingHorizontal: 16,
  },
  footer: {
    height: 24,
  },
});