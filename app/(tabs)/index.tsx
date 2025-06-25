import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, TrendingUp, Calendar, Flame, RotateCcw } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { venues } from '@/mocks/venues';
import VenueCard from '@/components/VenueCard';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import DailyTracker from '@/components/DailyTracker';
import SectionHeader from '@/components/SectionHeader';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { resetAllLikes } = useVenueInteractionStore();
  const { profile, initializeDefaultProfile } = useUserProfileStore();
  const [dailyTrackerVisible, setDailyTrackerVisible] = useState(false);

  // Initialize default profile if none exists (for debugging)
  useEffect(() => {
    if (!profile) {
      console.log('🔄 No profile found, initializing default profile...');
      initializeDefaultProfile();
    }
  }, [profile, initializeDefaultProfile]);

  const handleResetLikes = () => {
    Alert.alert(
      'Reset All Likes',
      'This will reset all likes for debugging purposes. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            resetAllLikes();
            Alert.alert('Success', 'All likes have been reset!');
          }
        }
      ]
    );
  };

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

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <BarBuddyLogo size="small" />
          <View style={styles.headerActions}>
            {/* Debug Reset Button */}
            <Pressable 
              style={[styles.debugButton, { backgroundColor: themeColors.error }]}
              onPress={handleResetLikes}
            >
              <RotateCcw size={16} color="white" />
            </Pressable>
            
            <Pressable 
              style={[styles.trackerButton, { backgroundColor: themeColors.primary }]}
              onPress={handleDailyTrackerPress}
            >
              <TrendingUp size={18} color="white" />
            </Pressable>
          </View>
        </View>
        
        <Pressable style={styles.locationContainer} onPress={handleLocationPress}>
          <MapPin size={16} color={themeColors.primary} />
          <Text style={[styles.locationText, { color: themeColors.text }]}>
            Downtown Madison
          </Text>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Section - Changed from "Most Liked Venues" to "BarBuddy's Top Picks" */}
        <SectionHeader 
          title="BarBuddy's Top Picks"
          subtitle="Discover the best bars in your area"
          onViewAll={handleViewAllVenues}
        />
        
        <View style={styles.venueList}>
          {venues.slice(0, 6).map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </View>

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  debugButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
    paddingLeft: 4,
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