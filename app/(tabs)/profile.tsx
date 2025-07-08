import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Alert, Modal, Image, ActivityIndicator } from 'react-native';
import { User, Award, Users, LogOut } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import FriendsModal from '@/components/FriendsModal';
import OnboardingModal from '@/components/OnboardingModal';
import DailyTracker from '@/components/DailyTracker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useUserProfileStore } from '@/stores/userProfileStore';

export default function ProfileScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { 
    profile: authProfile, 
    signOut,
    isLoading: authLoading,
    isAuthenticated,
    checkSession,
    sessionChecked,
    user
  } = useAuthStore();
  const { 
    profile: userProfile, 
    profileReady, 
    isLoading: profileLoading,
    loadProfile 
  } = useUserProfileStore();
  const router = useRouter();
  
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dailyTrackerVisible, setDailyTrackerVisible] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // 🔧 CRITICAL FIX: Simplified initialization that actually works
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 Profile: Starting auth check...');
        
        // First check if we have a session
        if (!sessionChecked) {
          await checkSession();
        }
        
        console.log('🔄 Profile: Auth status:', { isAuthenticated, sessionChecked });
        
      } catch (error) {
        console.error('❌ Profile: Auth error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [sessionChecked, checkSession]);

  // 🔧 CRITICAL FIX: Load profile when authenticated
  useEffect(() => {
    const loadUserProfile = async () => {
      if (isAuthenticated && !profileLoading && !userProfile) {
        console.log('🔄 Profile: Loading user profile...');
        try {
          await loadProfile();
        } catch (error) {
          console.error('❌ Profile: Load error:', error);
        }
      }
    };

    loadUserProfile();
  }, [isAuthenticated, profileLoading, userProfile, loadProfile]);

  const handleProfilePicturePress = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        console.log('Profile picture selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting profile picture:', error);
      Alert.alert('Error', 'Failed to select profile picture. Please try again.');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/sign-in');
          }
        }
      ]
    );
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleDailyTrackerPress = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to track your daily stats.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth/sign-in') }
        ]
      );
      return;
    }

    setDailyTrackerVisible(true);
  };

  // 🔧 CRITICAL FIX: Simplified loading state check
  const showLoading = isInitializing || authLoading || (isAuthenticated && profileLoading);
  
  if (showLoading) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={[styles.loadingText, { color: themeColors.text, marginTop: 16 }]}>
            {isInitializing ? 'Starting up...' : authLoading ? 'Checking authentication...' : 'Loading your profile...'}
          </Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            Please sign in to view your profile.
          </Text>
          <Pressable 
            style={[styles.signInButton, { backgroundColor: themeColors.primary, marginTop: 20 }]}
            onPress={() => router.replace('/auth/sign-in')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // 🔧 CRITICAL FIX: Use any available profile data
  const displayProfile = userProfile || authProfile || user;

  if (!displayProfile) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            No profile data found.
          </Text>
          <Pressable 
            style={[styles.signInButton, { backgroundColor: themeColors.primary, marginTop: 20 }]}
            onPress={() => loadProfile()}
          >
            <Text style={styles.signInButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Mock rank info
  const rankInfo = {
    title: 'Bar Explorer',
    subTitle: 'Getting Started',
    color: '#FF6B35',
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <BarBuddyLogo size="small" />
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Your Bar Buddy Profile
          </Text>
        </View>
        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color={themeColors.error} />
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: themeColors.card }]}>
          <Pressable style={styles.avatarContainer} onPress={handleProfilePicturePress}>
            {displayProfile.profile_picture ? (
              <Image source={{ uri: displayProfile.profile_picture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.border }]}>
                <User size={32} color={themeColors.subtext} />
              </View>
            )}
          </Pressable>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.displayName, { color: themeColors.text }]}>
              {displayProfile.username || displayProfile.email || 'Bar Buddy User'}
            </Text>
            <Text style={[styles.joinDate, { color: themeColors.subtext }]}>
              Joined {displayProfile.created_at ? new Date(displayProfile.created_at).toLocaleDateString() : 'Recently'}
            </Text>
          </View>
        </View>

        {/* 🔧 FIXED: Lifetime Stats Section - Use actual profile data */}
        <View style={[styles.lifetimeStatsCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Lifetime Stats
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                {displayProfile.bars_hit || 0}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Bars Hit
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                {displayProfile.nights_out || 0}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Nights Out
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                {displayProfile.total_beers || 0}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Total Beers
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                {displayProfile.total_shots || 0}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Total Shots
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                {displayProfile.pool_games_won || 0}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Pool Games
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                {displayProfile.drunk_scale_ratings && displayProfile.drunk_scale_ratings.length > 0 ? 
                  (displayProfile.drunk_scale_ratings.reduce((sum, rating) => sum + rating, 0) / displayProfile.drunk_scale_ratings.length).toFixed(1) : 
                  '0.0'
                }
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Drunk Scale
              </Text>
            </View>
          </View>
        </View>

        {/* XP and Rank Card */}
        <Pressable style={[styles.xpCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.xpHeader}>
            <Award size={24} color={rankInfo.color} />
            <View style={styles.xpInfo}>
              <Text style={[styles.xpAmount, { color: themeColors.text }]}>
                {displayProfile.xp || 0} XP
              </Text>
              <Text style={[styles.nextRankText, { color: themeColors.subtext }]}>
                Keep tracking to earn more XP
              </Text>
            </View>
          </View>
          
          <View style={styles.rankContainer}>
            <Text style={[styles.rankTitle, { color: rankInfo.color }]}>
              {rankInfo.title}
            </Text>
            <Text style={[styles.rankSubtitle, { color: themeColors.text }]}>
              {rankInfo.subTitle}
            </Text>
          </View>
        </Pressable>

        {/* Daily Tracker Button */}
        <Pressable 
          style={[styles.dailyTrackerButton, { backgroundColor: themeColors.card }]}
          onPress={handleDailyTrackerPress}
        >
          <Text style={[styles.dailyTrackerButtonText, { color: themeColors.primary }]}>
            📊 Daily Tracker
          </Text>
          <Text style={[styles.dailyTrackerSubtext, { color: themeColors.subtext }]}>
            Track your night & save stats
          </Text>
        </Pressable>

        {/* Friends Button */}
        <Pressable 
          style={[styles.friendsButton, { backgroundColor: themeColors.card }]}
          onPress={() => setFriendsModalVisible(true)}
        >
          <Users size={20} color={themeColors.primary} />
          <Text style={[styles.friendsButtonText, { color: themeColors.primary }]}>
            Friends
          </Text>
        </Pressable>

        <View style={styles.footer} />
      </ScrollView>

      {/* Daily Tracker Modal */}
      <DailyTracker
        visible={dailyTrackerVisible}
        onClose={() => setDailyTrackerVisible(false)}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        visible={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {/* Friends Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={friendsModalVisible}
        onRequestClose={() => setFriendsModalVisible(false)}
      >
        <FriendsModal
          visible={friendsModalVisible}
          onClose={() => setFriendsModalVisible(false)}
        />
      </Modal>
    </View>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  signInButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  signOutButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
  },
  lifetimeStatsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  xpCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  xpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  xpInfo: {
    marginLeft: 12,
    flex: 1,
  },
  xpAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  nextRankText: {
    fontSize: 12,
  },
  rankContainer: {
    alignItems: 'center',
  },
  rankTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  rankSubtitle: {
    fontSize: 14,
  },
  dailyTrackerButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  dailyTrackerButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dailyTrackerSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  friendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  friendsButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    height: 32,
  },
});
