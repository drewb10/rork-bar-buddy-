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
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { LogOut, RefreshCw, Camera, Users, Award, Trophy, Star } from 'lucide-react-native';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import { useRouter } from 'expo-router';

// Safe imports with error handling
let RankModal: React.ComponentType<any> | null = null;
let FriendsModal: React.ComponentType<any> | null = null;
let OnboardingModal: React.ComponentType<any> | null = null;
let useUserProfileStore: any = null;
let ImagePicker: any = null;

try {
  RankModal = require('@/components/ModernRankModal').default;
} catch (error) {
  console.warn('ModernRankModal component not found');
}

try {
  FriendsModal = require('@/components/ModernFriendsModal').default;
} catch (error) {
  console.warn('ModernFriendsModal component not found');
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

const { width: screenWidth } = Dimensions.get('window');

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
  const [refreshing, setRefreshing] = useState(false);
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);
  const [rankModalVisible, setRankModalVisible] = useState(false);
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

  // Get current rank info
  const getCurrentRank = (xp: number) => {
    const RANK_SYSTEM = [
      { name: 'Sober Star', xpRequired: 0, color: '#9CA3AF', icon: '⭐', subLevels: [0, 250, 500, 750] },
      { name: 'Tipsy Talent', xpRequired: 1000, color: '#60A5FA', icon: '🌟', subLevels: [1000, 1500, 2000, 2500] },
      { name: 'Buzzed Beginner', xpRequired: 3000, color: '#34D399', icon: '✨', subLevels: [3000, 3750, 4500, 5250] },
      { name: 'Drunk Dynamo', xpRequired: 6000, color: '#F59E0B', icon: '🔥', subLevels: [6000, 7500, 9000, 10500] },
      { name: 'Wasted Warrior', xpRequired: 12000, color: '#EF4444', icon: '⚡', subLevels: [12000, 15000, 18000, 21000] },
      { name: 'Blackout Baron', xpRequired: 24000, color: '#8B5CF6', icon: '👑', subLevels: [24000, 30000, 36000, 42000] },
    ];

    let currentRank = RANK_SYSTEM[0];
    for (let i = RANK_SYSTEM.length - 1; i >= 0; i--) {
      if (xp >= RANK_SYSTEM[i].xpRequired) {
        currentRank = RANK_SYSTEM[i];
        break;
      }
    }

    // Find sub-level
    let subLevel = 1;
    for (let i = 0; i < currentRank.subLevels.length; i++) {
      if (xp >= currentRank.subLevels[i]) {
        subLevel = i + 1;
      }
    }

    return { ...currentRank, subLevel };
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
  const userXP = displayProfile?.xp || 0;
  const currentRank = getCurrentRank(userXP);

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
        {/* Profile Hero Card */}
        <LinearGradient
          colors={['#FF6B35', '#FF8F65']}
          style={styles.profileHeroCard}
        >
          <View style={styles.glassOverlay}>
            <View style={styles.profileHeader}>
              <Pressable style={styles.avatarContainer} onPress={handleProfilePicturePress}>
                {displayProfile?.profile_picture ? (
                  <Image 
                    source={{ uri: displayProfile.profile_picture }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {displayProfile?.display_name?.charAt(0) || displayProfile?.username?.charAt(0) || 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraIconContainer}>
                  <Camera size={16} color="#FFFFFF" />
                </View>
              </Pressable>
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {displayProfile?.display_name || displayProfile?.username || 'Bar Buddy User'}
                </Text>
                <Text style={styles.profileUsername}>
                  @{displayProfile?.username || 'user'}
                </Text>
                {displayProfile?.bio && (
                  <Text style={styles.profileBio}>
                    {displayProfile.bio}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* XP Card - Prominently Featured */}
        <LinearGradient
          colors={['#007AFF', '#40A9FF']}
          style={styles.xpCard}
        >
          <View style={styles.glassOverlay}>
            <View style={styles.xpHeader}>
              <Text style={styles.xpIcon}>⚡</Text>
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>XP</Text>
              </View>
            </View>
            
            <Text style={styles.xpValue}>
              {userXP.toLocaleString()}
            </Text>
            
            <Text style={styles.xpTitle}>
              Experience Points
            </Text>
            
            <Text style={styles.xpSubtitle}>
              Level {Math.floor(userXP / 1000) + 1} Bar Buddy
            </Text>
          </View>
        </LinearGradient>

        {/* Action Cards Row */}
        <View style={styles.actionRow}>
          {/* Rank Card */}
          <Pressable 
            style={styles.actionCard} 
            onPress={() => setRankModalVisible(true)}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
              style={styles.actionCardGradient}
            >
              <View style={styles.glassOverlay}>
                <View style={styles.actionCardHeader}>
                  <Text style={styles.actionCardIcon}>{currentRank.icon}</Text>
                </View>
                
                <Text style={[styles.actionCardTitle, { color: themeColors.text }]}>
                  {currentRank.name}
                </Text>
                
                <Text style={[styles.actionCardSubtitle, { color: themeColors.subtext }]}>
                  Rank {currentRank.subLevel}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Friends Card */}
          <Pressable 
            style={styles.actionCard} 
            onPress={() => FriendsModal ? setFriendsModalVisible(true) : Alert.alert('Friends', 'Friends feature not available')}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
              style={styles.actionCardGradient}
            >
              <View style={styles.glassOverlay}>
                <View style={styles.actionCardHeader}>
                  <Users size={28} color={themeColors.primary} />
                </View>
                
                <Text style={[styles.actionCardTitle, { color: themeColors.text }]}>
                  Friends
                </Text>
                
                <Text style={[styles.actionCardSubtitle, { color: themeColors.subtext }]}>
                  Connect & Share
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Configuration Status */}
        {!isConfigured && (
          <LinearGradient
            colors={['#FFA500', '#FFB84D']}
            style={styles.configCard}
          >
            <View style={styles.glassOverlay}>
              <Text style={styles.configIcon}>⚠️</Text>
              <Text style={styles.configTitle}>
                Demo Mode Active
              </Text>
              <Text style={styles.configDescription}>
                You're using demo data. Configure Supabase to sync real data across devices.
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* Footer Spacing */}
        <View style={styles.footer} />
      </ScrollView>

      {/* Modals - Safe Rendering */}
      {RankModal && (
        <RankModal 
          visible={rankModalVisible} 
          onClose={() => setRankModalVisible(false)} 
          userXP={userXP}
        />
      )}
      
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
    paddingHorizontal: 24,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  profileHeroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  glassOverlay: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  profileUsername: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  xpCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  xpIcon: {
    fontSize: 32,
  },
  xpBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  xpBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  xpValue: {
    color: 'white',
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -2,
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  xpTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  xpSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  actionCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  actionCardGradient: {
    flex: 1,
    minHeight: 120,
  },
  actionCardHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  actionCardIcon: {
    fontSize: 28,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  configCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  configIcon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 12,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  configDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  footer: {
    height: 40,
  },
});