import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Alert, Modal, Image, ActivityIndicator } from 'react-native';
import { User, Award, Camera, Users, Info, LogOut } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import FriendsModal from '@/components/FriendsModal';
import BarBuddyChatbot from '@/components/BarBuddyChatbot';
import OnboardingModal from '@/components/OnboardingModal';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { 
    profile: authProfile, 
    signOut,
    isLoading: authLoading
  } = useAuthStore();
  const {
    profile,
    loadProfile,
    updateProfile,
    getRank,
    getAllRanks,
    getXPForNextRank,
    getProgressToNextRank,
    setProfilePicture,
    isLoading: profileLoading,
    initializeDefaultProfile
  } = useUserProfileStore();
  const router = useRouter();
  
  const { interactions } = useVenueInteractionStore();
  
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);
  const [rankDetailsModalVisible, setRankDetailsModalVisible] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'chatbot'>('profile');

  useEffect(() => {
    // Load profile when component mounts or initialize default if none exists
    if (authProfile && !profile) {
      loadProfile();
    } else if (!authProfile && !profile) {
      // For debugging - create a default profile if no auth profile exists
      console.log('🔄 No auth profile, initializing default profile for debugging...');
      initializeDefaultProfile();
    }
  }, [authProfile, profile, loadProfile, initializeDefaultProfile]);

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
        await setProfilePicture(result.assets[0].uri);
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

  const rankInfo = getRank();
  const allRanks = getAllRanks();
  const nextRankXP = getXPForNextRank();
  const progressToNextRank = getProgressToNextRank();

  const isLoading = authLoading || profileLoading;

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

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            No profile found. Creating default profile...
          </Text>
          <Pressable 
            style={[styles.signInButton, { backgroundColor: themeColors.primary, marginTop: 20 }]}
            onPress={() => initializeDefaultProfile()}
          >
            <Text style={styles.signInButtonText}>Initialize Profile</Text>
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
        {authProfile && (
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
                  {Math.max(0, nextRankXP - (profile.xp || 0))} XP to next rank
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

            {/* Progress Bar */}
            <View style={[styles.progressBarContainer, { backgroundColor: themeColors.border }]}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    backgroundColor: rankInfo.color,
                    width: `${Math.min(progressToNextRank, 100)}%`
                  }
                ]} 
              />
            </View>
            
            <Text style={[styles.tapToViewText, { color: themeColors.subtext }]}>
              Tap to view all ranks
            </Text>
          </Pressable>

          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {profile.nights_out || 0}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Nights Out
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {profile.bars_hit || 0}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Bars Hit
              </Text>
            </View>
          </View>

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

      {/* Rank Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={rankDetailsModalVisible}
        onRequestClose={() => setRankDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                All Ranks
              </Text>
              <Pressable 
                style={styles.closeButton}
                onPress={() => setRankDetailsModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, { color: themeColors.subtext }]}>✕</Text>
              </Pressable>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {allRanks.map((rank, index) => (
                <View 
                  key={`${rank.tier}-${rank.subRank}`}
                  style={[
                    styles.rankItem,
                    { 
                      backgroundColor: rank.tier === rankInfo.tier && rank.subRank === rankInfo.subRank 
                        ? rank.color + '20' 
                        : 'transparent',
                      borderColor: rank.tier === rankInfo.tier && rank.subRank === rankInfo.subRank 
                        ? rank.color 
                        : themeColors.border
                    }
                  ]}
                >
                  <Award size={20} color={rank.color} />
                  <View style={styles.rankItemInfo}>
                    <Text style={[styles.rankItemTitle, { color: rank.color }]}>
                      {rank.title}
                    </Text>
                    <Text style={[styles.rankItemSubtitle, { color: themeColors.text }]}>
                      {rank.subTitle}
                    </Text>
                    <Text style={[styles.rankItemXP, { color: themeColors.subtext }]}>
                      {rank.minXP} - {rank.maxXP} XP
                    </Text>
                  </View>
                  {rank.tier === rankInfo.tier && rank.subRank === rankInfo.subRank && (
                    <Text style={[styles.currentRankBadge, { color: rank.color }]}>
                      Current
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
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
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  tapToViewText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  rankItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  rankItemTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  rankItemSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  rankItemXP: {
    fontSize: 12,
    marginTop: 4,
  },
  currentRankBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
});