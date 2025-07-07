import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Alert, Modal, Image, ActivityIndicator } from 'react-native';
import { User, Award, Camera, Users, LogOut, Crown, TrendingUp } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import FriendsModal from '@/components/FriendsModal';
import BarBuddyChatbot from '@/components/BarBuddyChatbot';
import OnboardingModal from '@/components/OnboardingModal';
import DailyTracker from '@/components/DailyTracker';
import RankModal, { getRankInfo } from '@/components/RankModal';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { LinearGradient } from 'expo-linear-gradient';

// ✅ FIX: Define proper tab type to avoid comparison errors
type TabType = 'profile' | 'chatbot';

export default function ProfileScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { 
    profile, 
    signOut,
    isLoading: authLoading,
    isAuthenticated,
    checkSession,
    sessionChecked,
    user
  } = useAuthStore();
  const { setProfilePicture } = useUserProfileStore();
  const router = useRouter();
  
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);
  const [rankModalVisible, setRankModalVisible] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('profile'); // ✅ FIX: Use proper TabType
  const [dailyTrackerVisible, setDailyTrackerVisible] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Simplified initialization - just check session once
  useEffect(() => {
    const initializeProfile = async () => {
      try {
        if (!sessionChecked) {
          await checkSession();
        }
      } catch (error) {
        console.warn('Error checking session:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeProfile();
  }, [sessionChecked, checkSession]);

  useEffect(() => {
    // Show onboarding if user hasn't completed it
    if (profile && profile.has_completed_onboarding === false) {
      setShowOnboarding(true);
    }
  }, [profile]);

  // ✅ FIX 1: Get rank information based on current XP
  const rankInfo = getRankInfo(profile?.xp || 0);
  
  // Create display profile with fallback values
  const displayProfile = profile || {
    username: 'Guest User',
    email: '',
    xp: 0,
    nights_out: 0,
    bars_hit: 0,
    total_shots: 0,
    total_beers: 0,
    total_beer_towers: 0,
    total_funnels: 0,
    total_shotguns: 0,
    pool_games_won: 0,
    dart_games_won: 0,
    photos_taken: 0,
    profile_picture: null,
    created_at: new Date().toISOString(),
  };

  const formatJoinDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return 'Recently';
    }
  };

  const handleProfilePicturePress = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose how you would like to update your profile picture',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera Roll', onPress: pickImageFromLibrary },
        { text: 'Take Photo', onPress: takePhoto },
      ]
    );
  };

  const pickImageFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await setProfilePicture(result.assets[0].uri);
        console.log('✅ Profile picture updated from library:', result.assets[0].uri);
      }
    } catch (error) {
      console.warn('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await setProfilePicture(result.assets[0].uri);
        
        // Award XP for taking a photo
        if (typeof window !== 'undefined' && (window as any).__userProfileStore) {
          const userProfileStore = (window as any).__userProfileStore;
          if (userProfileStore?.getState) {
            const { incrementPhotosTaken } = userProfileStore.getState();
            await incrementPhotosTaken();
          }
        }
        
        console.log('✅ Profile picture updated from camera:', result.assets[0].uri);
      }
    } catch (error) {
      console.warn('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
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
            try {
              await signOut();
              router.replace('/auth/sign-in');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleDailyTrackerPress = () => {
    setDailyTrackerVisible(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Show loading state during initialization
  if (isInitializing || authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            Loading your profile...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {activeTab === 'profile' ? (
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header with Logo */}
          <View style={styles.header}>
            <BarBuddyLogo size="large" />
            
            {/* Tab Switcher */}
            <View style={styles.tabSwitcher}>
              <Pressable
                style={[
                  styles.tabButton,
                  activeTab === 'profile' && { backgroundColor: themeColors.primary }
                ]}
                onPress={() => setActiveTab('profile')}
              >
                <User size={18} color={activeTab === 'profile' ? 'white' : themeColors.subtext} />
                <Text style={[
                  styles.tabButtonText,
                  { color: activeTab === 'profile' ? 'white' : themeColors.subtext }
                ]}>
                  Profile
                </Text>
              </Pressable>
              
              <Pressable
                style={[
                  styles.tabButton,
                  activeTab === 'chatbot' && { backgroundColor: themeColors.primary }
                ]}
                onPress={() => setActiveTab('chatbot')}
              >
                <Text style={[
                  styles.tabButtonText,
                  { color: activeTab === 'chatbot' ? 'white' : themeColors.subtext }
                ]}>
                  🤖 Assistant
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Profile Picture Section */}
          <View style={styles.profileSection}>
            <Pressable onPress={handleProfilePicturePress} disabled={!isAuthenticated}>
              <View style={[styles.profilePictureContainer, { borderColor: themeColors.primary }]}>
                {displayProfile.profile_picture ? (
                  <Image source={{ uri: displayProfile.profile_picture }} style={styles.profilePicture} />
                ) : (
                  <View style={[styles.profilePicturePlaceholder, { backgroundColor: themeColors.card }]}>
                    <User size={40} color={themeColors.subtext} />
                  </View>
                )}
                {isAuthenticated && (
                  <View style={[styles.cameraIconContainer, { backgroundColor: themeColors.primary }]}>
                    <Camera size={16} color="white" />
                  </View>
                )}
              </View>
            </Pressable>

            <Text style={[styles.username, { color: themeColors.text }]}>
              {isAuthenticated ? `@${displayProfile.username}` : 'Welcome to BarBuddy'}
            </Text>
            
            {isAuthenticated && (
              <Text style={[styles.joinDate, { color: themeColors.subtext }]}>
                Member since {formatJoinDate(displayProfile.created_at)}
              </Text>
            )}
          </View>

          {/* ✅ FIX 2: Enhanced XP and Rank Section */}
          <Pressable 
            style={[styles.xpSection, { backgroundColor: themeColors.card }]}
            onPress={() => setRankModalVisible(true)}
            disabled={!isAuthenticated}
          >
            <LinearGradient
              colors={rankInfo.current.gradient}
              style={styles.xpGradient}
            >
              <View style={styles.xpHeader}>
                <rankInfo.current.icon size={24} color="white" />
                <View style={styles.xpInfo}>
                  <Text style={styles.xpAmount}>
                    {displayProfile.xp || 0} XP
                  </Text>
                  {isAuthenticated && rankInfo.next ? (
                    <Text style={styles.nextRankText}>
                      {rankInfo.xpToNext} XP to {rankInfo.next.title}
                    </Text>
                  ) : (
                    <Text style={styles.nextRankText}>
                      {isAuthenticated ? 'Max rank achieved!' : 'Sign in to start earning XP'}
                    </Text>
                  )}
                </View>
                <Crown size={20} color="white" />
              </View>
              
              <View style={styles.rankContainer}>
                <Text style={styles.rankTitle}>
                  {rankInfo.current.title}
                </Text>
                <Text style={styles.rankSubtitle}>
                  {rankInfo.current.subTitle}
                </Text>
              </View>

              {/* Progress Bar for Next Rank */}
              {isAuthenticated && rankInfo.next && (
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(rankInfo.progress, 100)}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(rankInfo.progress)}% to next rank
                  </Text>
                </View>
              )}
            </LinearGradient>
          </Pressable>

          {/* Stats Overview */}
          {isAuthenticated && (
            <View style={styles.statsOverview}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Quick Stats
              </Text>
              
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
                  <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                    {displayProfile.nights_out || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                    Nights Out
                  </Text>
                </View>
                
                <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
                  <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                    {displayProfile.bars_hit || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                    Bars Hit
                  </Text>
                </View>
                
                <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
                  <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                    {(displayProfile.total_shots || 0) + (displayProfile.total_beers || 0)}
                  </Text>
                  <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                    Drinks Logged
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            {/* Daily Tracker Button */}
            <Pressable 
              style={[styles.dailyTrackerButton, { backgroundColor: themeColors.card }]}
              onPress={handleDailyTrackerPress}
            >
              <View style={styles.buttonContent}>
                <View style={styles.buttonIcon}>
                  <TrendingUp size={20} color={themeColors.primary} />
                </View>
                <View style={styles.buttonText}>
                  <Text style={[styles.buttonTitle, { color: themeColors.primary }]}>
                    📊 Daily Tracker
                  </Text>
                  <Text style={[styles.buttonSubtext, { color: themeColors.subtext }]}>
                    Track your night & earn XP
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Rank Details Button */}
            {isAuthenticated && (
              <Pressable 
                style={[styles.actionButton, { backgroundColor: themeColors.card }]}
                onPress={() => setRankModalVisible(true)}
              >
                <View style={styles.buttonContent}>
                  <View style={styles.buttonIcon}>
                    <Crown size={20} color={rankInfo.current.color} />
                  </View>
                  <View style={styles.buttonText}>
                    <Text style={[styles.buttonTitle, { color: rankInfo.current.color }]}>
                      View All Ranks
                    </Text>
                    <Text style={[styles.buttonSubtext, { color: themeColors.subtext }]}>
                      See progression & rewards
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}

            {/* Friends Button */}
            {isAuthenticated && (
              <Pressable 
                style={[styles.actionButton, { backgroundColor: themeColors.card }]}
                onPress={() => setFriendsModalVisible(true)}
              >
                <View style={styles.buttonContent}>
                  <View style={styles.buttonIcon}>
                    <Users size={20} color={themeColors.primary} />
                  </View>
                  <View style={styles.buttonText}>
                    <Text style={[styles.buttonTitle, { color: themeColors.primary }]}>
                      Friends
                    </Text>
                    <Text style={[styles.buttonSubtext, { color: themeColors.subtext }]}>
                      Connect with other users
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}

            {/* Sign Out Button */}
            {isAuthenticated && (
              <Pressable 
                style={[styles.signOutButton, { backgroundColor: '#FF3B30' }]}
                onPress={handleSignOut}
              >
                <LogOut size={20} color="white" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </Pressable>
            )}

            {/* Sign In Prompt */}
            {!isAuthenticated && (
              <View style={[styles.signInPrompt, { backgroundColor: themeColors.card }]}>
                <Text style={[styles.signInTitle, { color: themeColors.text }]}>
                  Sign in to unlock all features
                </Text>
                <Text style={[styles.signInSubtext, { color: themeColors.subtext }]}>
                  Track your progress, earn XP, and compete with friends!
                </Text>
                <Pressable 
                  style={[styles.signInButton, { backgroundColor: themeColors.primary }]}
                  onPress={() => router.push('/auth/sign-in')}
                >
                  <Text style={styles.signInButtonText}>Get Started</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.footer} />
        </ScrollView>
      ) : (
        <BarBuddyChatbot />
      )}

      {/* Daily Tracker Modal */}
      <DailyTracker
        visible={dailyTrackerVisible}
        onClose={() => setDailyTrackerVisible(false)}
      />

      {/* Rank Modal */}
      <RankModal
        visible={rankModalVisible}
        onClose={() => setRankModalVisible(false)}
        currentXP={displayProfile.xp || 0}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    marginTop: 20,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  xpSection: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
  },
  xpGradient: {
    padding: 20,
  },
  xpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  xpInfo: {
    flex: 1,
    marginLeft: 12,
  },
  xpAmount: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 2,
  },
  nextRankText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  rankContainer: {
    marginBottom: 16,
  },
  rankTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  rankSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  progressText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsOverview: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsSection: {
    paddingHorizontal: 20,
  },
  dailyTrackerButton: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buttonText: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  buttonSubtext: {
    fontSize: 14,
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signInPrompt: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  signInTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  signInSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  signInButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    height: 20,
  },
});