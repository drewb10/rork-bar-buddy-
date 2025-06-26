import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Alert, Modal, Image, ActivityIndicator } from 'react-native';
import { User, Award, Camera, Users, LogOut } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import FriendsModal from '@/components/FriendsModal';
import BarBuddyChatbot from '@/components/BarBuddyChatbot';
import OnboardingModal from '@/components/OnboardingModal';
import DailyTracker from '@/components/DailyTracker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { 
    profile, 
    signOut,
    isLoading: authLoading,
    isAuthenticated,
    checkSession,
    sessionChecked
  } = useAuthStore();
  const router = useRouter();
  
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);
  const [rankDetailsModalVisible, setRankDetailsModalVisible] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'chatbot'>('profile');
  const [dailyTrackerVisible, setDailyTrackerVisible] = useState(false);

  // Check session when component mounts
  useEffect(() => {
    if (!sessionChecked) {
      console.log('🔄 Profile screen: Checking session...');
      checkSession();
    }
  }, [sessionChecked, checkSession]);

  useEffect(() => {
    // Show onboarding if user hasn't completed it
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
        // TODO: Implement profile picture update
        console.log('Profile picture selected:', result.assets[0].uri);
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
        // TODO: Implement profile picture update
        console.log('Photo taken:', result.assets[0].uri);
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

  // Mock rank info since we removed the complex ranking system
  const rankInfo = {
    title: 'Bar Explorer',
    subTitle: 'Getting Started',
    color: '#FF6A00',
  };

  const isLoading = authLoading || !sessionChecked;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6A00" />
          <Text style={[styles.loadingText, { color: themeColors.text, marginTop: 16 }]}>
            Loading profile...
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

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            No profile found. Please try refreshing.
          </Text>
          <Pressable 
            style={[styles.signInButton, { backgroundColor: themeColors.primary, marginTop: 20 }]}
            onPress={() => checkSession()}
          >
            <Text style={styles.signInButtonText}>Refresh Profile</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header with Logo and Title */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <BarBuddyLogo size="small" />
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Your Bar Buddy Profile
          </Text>
        </View>
        {profile && (
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
              {profile.profile_picture ? (
                <Image source={{ uri: profile.profile_picture }} style={styles.avatarImage} />
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
                @{profile.username}
              </Text>
            </View>
            
            <Text style={[styles.joinDate, { color: themeColors.subtext }]}>
              Member since {formatJoinDate(profile.created_at)}
            </Text>

            {profile.email && (
              <Text style={[styles.email, { color: themeColors.subtext }]}>
                {profile.email}
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
                  {profile.xp || 0} XP
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    alignItems: 'flex-start',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginLeft: 4,
  },
  signOutButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
  },
  joinDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: '#888',
  },
  xpCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    fontSize: 20,
    fontWeight: '700',
  },
  nextRankText: {
    fontSize: 12,
    marginTop: 2,
  },
  rankContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  rankTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  rankSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  dailyTrackerButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dailyTrackerButtonText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  dailyTrackerSubtext: {
    fontSize: 14,
    fontWeight: '500',
  },
  friendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  friendsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    height: 24,
  },
  signInButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});