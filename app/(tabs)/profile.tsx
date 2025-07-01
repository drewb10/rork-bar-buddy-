import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Alert, Modal, Image, ActivityIndicator } from 'react-native';
import { User, Award, Camera, Users, LogOut } from 'lucide-react-native';
import { getThemeColors, spacing, typography, borderRadius, shadows } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import FriendsModal from '@/components/FriendsModal';
import BarBuddyChatbot from '@/components/BarBuddyChatbot';
import OnboardingModal from '@/components/OnboardingModal';
import DailyTracker from '@/components/DailyTracker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useUserProfileStore } from '@/stores/userProfileStore';

export default function ProfileScreen() {
  const { theme } = useThemeStore();
  const themeColors = getThemeColors(theme);
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
  const [rankDetailsModalVisible, setRankDetailsModalVisible] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'chatbot'>('profile');
  const [dailyTrackerVisible, setDailyTrackerVisible] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

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
    if (profile && profile.has_completed_onboarding === false) {
      setShowOnboarding(true);
    }
  }, [profile]);

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

  const handleRankPress = () => {
    setRankDetailsModalVisible(true);
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

  const rankInfo = {
    title: 'Bar Explorer',
    subTitle: 'Getting Started',
    color: '#FF6A00',
  };

  if (isInitializing && authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6A00" />
          <Text style={[styles.loadingText, { color: themeColors.text, marginTop: spacing.lg }]}>
            Loading profile...
          </Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            Please sign in to view your profile.
          </Text>
          <Pressable 
            style={[styles.signInButton, { backgroundColor: themeColors.primary, marginTop: spacing.xl }]}
            onPress={() => router.replace('/auth/sign-in')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const displayProfile = profile || user;

  if (!displayProfile) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            No profile found. Please try refreshing.
          </Text>
          <Pressable 
            style={[styles.signInButton, { backgroundColor: themeColors.primary, marginTop: spacing.xl }]}
            onPress={() => checkSession()}
          >
            <Text style={styles.signInButtonText}>Refresh Profile</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header with Logo and Title */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <BarBuddyLogo size="small" />
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Your Bar Buddy Profile
          </Text>
        </View>
        {displayProfile && (
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color={themeColors.error} />
          </Pressable>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <Pressable 
          style={[
            styles.tab, 
            activeTab === 'profile' && { borderBottomColor: themeColors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'profile' ? themeColors.primary : themeColors.subtext }
          ]}>
            Profile
          </Text>
        </Pressable>
        <Pressable 
          style={[
            styles.tab, 
            activeTab === 'chatbot' && { borderBottomColor: themeColors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('chatbot')}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'chatbot' ? themeColors.primary : themeColors.subtext }
          ]}>
            BarBuddy AI
          </Text>
        </Pressable>
      </View>
      
      {activeTab === 'profile' ? (
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: themeColors.card }]}>
            <Pressable style={styles.avatarContainer} onPress={handleProfilePicturePress}>
              {displayProfile.profile_picture ? (
                <Image source={{ uri: displayProfile.profile_picture }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: themeColors.primary }]}>
                  <User size={32} color="white" />
                </View>
              )}
              <View style={[styles.cameraIcon, { backgroundColor: themeColors.primary }]}>
                <Camera size={16} color="white" />
              </View>
            </Pressable>
            
            <View style={styles.nameContainer}>
              <Text style={[styles.userName, { color: themeColors.text }]}>
                @{displayProfile.username || displayProfile.user_metadata?.username || 'user'}
              </Text>
            </View>
            
            <Text style={[styles.joinDate, { color: themeColors.subtext }]}>
              Member since {formatJoinDate(displayProfile.created_at || new Date().toISOString())}
            </Text>

            {(displayProfile.email || displayProfile.phone) && (
              <Text style={[styles.email, { color: themeColors.subtext }]}>
                {displayProfile.email || displayProfile.phone}
              </Text>
            )}
          </View>

          {/* XP and Ranking Card */}
          <Pressable 
            style={[styles.xpCard, { backgroundColor: themeColors.card }]}
            onPress={handleRankPress}
          >
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
      ) : (
        <BarBuddyChatbot />
      )}

      <DailyTracker
        visible={dailyTrackerVisible}
        onClose={() => setDailyTrackerVisible(false)}
      />

      <OnboardingModal
        visible={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

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
    ...typography.body,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    alignItems: 'flex-start',
    flex: 1,
  },
  headerTitle: {
    ...typography.heading3,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  signOutButton: {
    padding: spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabText: {
    ...typography.bodyMedium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  userName: {
    ...typography.heading2,
  },
  joinDate: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  email: {
    ...typography.caption,
    color: '#888',
  },
  xpCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.md,
  },
  xpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  xpInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  xpAmount: {
    ...typography.heading3,
  },
  nextRankText: {
    ...typography.small,
    marginTop: spacing.xs,
  },
  rankContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  rankTitle: {
    ...typography.heading3,
    marginBottom: spacing.xs,
  },
  rankSubtitle: {
    ...typography.caption,
  },
  dailyTrackerButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  dailyTrackerButtonText: {
    ...typography.heading3,
    marginBottom: spacing.xs,
  },
  dailyTrackerSubtext: {
    ...typography.caption,
  },
  friendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  friendsButtonText: {
    ...typography.bodyMedium,
    marginLeft: spacing.sm,
  },
  footer: {
    height: spacing.xl,
  },
  signInButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  signInButtonText: {
    color: 'white',
    ...typography.bodyMedium,
  },
});