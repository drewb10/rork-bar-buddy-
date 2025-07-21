import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { LogOut, RefreshCw, Camera, Users } from 'lucide-react-native';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import { useRouter } from 'expo-router';

// Safe imports with error handling
let RankSystem: React.ComponentType<any> | null = null;
let BarBuddyChatbot: React.ComponentType<any> | null = null;
let FriendsModal: React.ComponentType<any> | null = null;
let OnboardingModal: React.ComponentType<any> | null = null;
let useUserProfileStore: any = null;
let ImagePicker: any = null;

try {
  RankSystem = require('@/components/RankSystem').default;
} catch (error) {
  console.warn('RankSystem component not found');
}

try {
  BarBuddyChatbot = require('@/components/BarBuddyChatbot').default;
} catch (error) {
  console.warn('BarBuddyChatbot component not found');
}

try {
  FriendsModal = require('@/components/FriendsModal').default;
} catch (error) {
  console.warn('FriendsModal component not found');
}

try {
  OnboardingModal = require('@/components/OnboardingModal').default;
} catch (error) {
  console.warn('OnboardingModal component not found');
}

try {
  useUserProfileStore = require('@/stores/userProfileStore').useUserProfileStore;
} catch (error) {
  console.warn('useUserProfileStore not found');
}

try {
  ImagePicker = require('expo-image-picker');
} catch (error) {
  console.warn('expo-image-picker not found');
}

export default function ProfileScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { 
    profile, 
    isAuthenticated, 
    isLoading, 
    signOut, 
    checkSession, 
    error,
    clearError,
    isConfigured,
    sessionChecked,
    user
  } = useAuthStore();
  
  const router = useRouter();
  // Removed activeTab state - no more BarBuddy AI tab
  const [refreshing, setRefreshing] = useState(false);
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Safe profile store usage
  const setProfilePicture = useUserProfileStore?.((state: any) => state.setProfilePicture) || (() => {});

  // Initialize profile
  useEffect(() => {
    const initializeProfile = async () => {
      try {
        if (!sessionChecked && checkSession) {
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

  // Show onboarding for new users
  useEffect(() => {
    if (isAuthenticated && profile && !profile.has_completed_onboarding && !isLoading) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, profile, isLoading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading && sessionChecked) {
      router.replace('/auth/sign-in');
    }
  }, [isAuthenticated, isLoading, sessionChecked]);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/sign-in');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      if (clearError) clearError();
      if (checkSession) await checkSession();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleProfilePicturePress = async () => {
    if (!ImagePicker) {
      Alert.alert('Error', 'Image picker not available');
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && setProfilePicture) {
        try {
          await setProfilePicture(result.assets[0].uri);
          Alert.alert('Success', 'Profile picture updated!');
        } catch (error) {
          console.error('Error updating profile picture:', error);
          Alert.alert('Error', 'Failed to update profile picture');
        }
      }
    } catch (error) {
      console.error('Error with image picker:', error);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Show loading screen while checking authentication
  if (isLoading || isInitializing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#000000' }]}>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={[styles.loadingText, { color: themeColors.text }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  // Show error state if profile failed to load
  if (!profile && !isLoading && sessionChecked) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: '#000000' }]}>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        
        <View style={styles.errorContent}>
          <BarBuddyLogo size="medium" />
          
          <Text style={[styles.errorTitle, { color: themeColors.text }]}>
            Unable to Load Profile
          </Text>
          
          {error && (
            <Text style={[styles.errorMessage, { color: themeColors.error }]}>
              {error}
            </Text>
          )}
          
          <Text style={[styles.errorDescription, { color: themeColors.subtext }]}>
            {!isConfigured 
              ? 'Database not configured. Check your Supabase setup or try demo mode.'
              : 'Please check your connection and try again.'
            }
          </Text>
          
          <Pressable 
            style={[styles.retryButton, { backgroundColor: themeColors.primary }]}
            onPress={handleRefresh}
          >
            <RefreshCw size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.signOutButton, { borderColor: themeColors.border }]}
            onPress={handleSignOut}
          >
            <Text style={[styles.signOutButtonText, { color: themeColors.subtext }]}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Use profile from auth store or user data as fallback
  const displayProfile = profile || user;

  // Main profile view
  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <BarBuddyLogo size="small" />
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Your Bar Buddy Profile
          </Text>
        </View>
        <Pressable style={styles.headerSignOutButton} onPress={handleSignOut}>
          <LogOut size={20} color={themeColors.error} />
        </Pressable>
      </View>

      
      
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={themeColors.primary}
            />
          }
        >
          {/* Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.profileHeader}>
              <Pressable style={styles.avatarContainer} onPress={handleProfilePicturePress}>
                {displayProfile?.profile_picture ? (
                  <Image 
                    source={{ uri: displayProfile.profile_picture }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.primary }]}>
                    <Text style={styles.avatarText}>
                      {displayProfile?.display_name?.charAt(0) || displayProfile?.username?.charAt(0) || 'U'}
                    </Text>
                  </View>
                )}
                <View style={[styles.cameraIcon, { backgroundColor: themeColors.primary }]}>
                  <Camera size={16} color="#FFFFFF" />
                </View>
              </Pressable>
              
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: themeColors.text }]}>
                  {displayProfile?.display_name || displayProfile?.username || 'Bar Buddy User'}
                </Text>
                <Text style={[styles.profileUsername, { color: themeColors.subtext }]}>
                  @{displayProfile?.username || 'user'}
                </Text>
                {displayProfile?.bio && (
                  <Text style={[styles.profileBio, { color: themeColors.subtext }]}>
                    {displayProfile.bio}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Rank System Card - Safe Rendering */}
          {RankSystem && (
            <View style={styles.rankContainer}>
              <RankSystem 
                userXP={displayProfile?.xp || 0}
              />
            </View>
          )}

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                {displayProfile?.xp || 0}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                XP
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                {displayProfile?.level || 1}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Level
              </Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                {displayProfile?.bars_hit || 0}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Bars Hit
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                {displayProfile?.nights_out || 0}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Nights Out
              </Text>
            </View>
          </View>

          {/* Friends Section - Safe Rendering */}
          <Pressable 
            style={[styles.actionCard, { backgroundColor: themeColors.card }]}
            onPress={() => FriendsModal ? setFriendsModalVisible(true) : Alert.alert('Friends', 'Friends feature not available')}
          >
            <Users size={24} color={themeColors.primary} />
            <Text style={[styles.actionCardText, { color: themeColors.text }]}>
              Friends
            </Text>
          </Pressable>

          {/* Configuration Status */}
          {!isConfigured && (
            <View style={[styles.configCard, { backgroundColor: '#FFA500' + '20', borderColor: '#FFA500' }]}>
              <Text style={[styles.configTitle, { color: '#FFA500' }]}>
                Demo Mode Active
              </Text>
              <Text style={[styles.configDescription, { color: '#FFA500' }]}>
                You're using demo data. Configure Supabase to sync real data across devices.
              </Text>
            </View>
          )}
        </ScrollView>

      {/* Modals - Safe Rendering */}
      {FriendsModal && (
        <FriendsModal 
          visible={friendsModalVisible} 
          onClose={() => setFriendsModalVisible(false)} 
        />
      )}
      
      {OnboardingModal && (
        <OnboardingModal 
          visible={showOnboarding} 
          onComplete={handleOnboardingComplete}
        />
      )}
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  signOutButton: {
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  headerSignOutButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
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
    padding: 20,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 14,
    lineHeight: 20,
  },
  rankContainer: {
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  actionCardText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  configCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  configDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatbotContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  chatbotPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatbotTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  chatbotDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});
