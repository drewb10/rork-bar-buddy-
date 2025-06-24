import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Alert, Modal, TextInput, Image } from 'react-native';
import { User, CreditCard as Edit3, X, Award, Camera, Users, Info, LogOut } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import FriendsModal from '@/components/FriendsModal';
import BarBuddyChatbot from '@/components/BarBuddyChatbot';
import OnboardingModal from '@/components/OnboardingModal';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { 
    profile, 
    updateProfile,
    signOut,
    user
  } = useAuthStore();
  
  const { interactions } = useVenueInteractionStore();
  
  const [nameEditModalVisible, setNameEditModalVisible] = useState(false);
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);
  const [rankDetailsModalVisible, setRankDetailsModalVisible] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'chatbot'>('profile');

  useEffect(() => {
    // Show onboarding if user hasn't completed it
    if (profile && !profile.has_completed_onboarding) {
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

  const getRank = () => {
    if (!profile) return { title: 'Sober Star', subTitle: 'Newcomer', color: '#4CAF50' };
    
    const xp = profile.xp || 0;
    
    if (xp < 126) return { title: 'Sober Star', subTitle: 'Newcomer', color: '#4CAF50' };
    if (xp < 251) return { title: 'Sober Star', subTitle: 'Explorer', color: '#4CAF50' };
    if (xp < 376) return { title: 'Sober Star', subTitle: 'Enthusiast', color: '#4CAF50' };
    if (xp < 501) return { title: 'Sober Star', subTitle: 'Rising Star', color: '#4CAF50' };
    if (xp < 626) return { title: 'Buzzed Beginner', subTitle: 'Novice', color: '#FFC107' };
    if (xp < 751) return { title: 'Buzzed Beginner', subTitle: 'Adventurer', color: '#FFC107' };
    if (xp < 876) return { title: 'Buzzed Beginner', subTitle: 'Socializer', color: '#FFC107' };
    if (xp < 1001) return { title: 'Buzzed Beginner', subTitle: 'Party Starter', color: '#FFC107' };
    if (xp < 1126) return { title: 'Tipsy Talent', subTitle: 'Local Hero', color: '#FF9800' };
    if (xp < 1251) return { title: 'Tipsy Talent', subTitle: 'Crowd Pleaser', color: '#FF9800' };
    if (xp < 1376) return { title: 'Tipsy Talent', subTitle: 'Nightlife Navigator', color: '#FF9800' };
    if (xp < 1501) return { title: 'Tipsy Talent', subTitle: 'Star of the Scene', color: '#FF9800' };
    if (xp < 1626) return { title: 'Big Chocolate', subTitle: 'Legend', color: '#FF5722' };
    if (xp < 1751) return { title: 'Big Chocolate', subTitle: 'Icon', color: '#FF5722' };
    if (xp < 1876) return { title: 'Big Chocolate', subTitle: 'Elite', color: '#FF5722' };
    if (xp < 2001) return { title: 'Big Chocolate', subTitle: 'Master of the Night', color: '#FF5722' };
    return { title: 'Scoop & Score Champ', subTitle: 'Ultimate Legend', color: '#9C27B0' };
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
        await updateProfile({ profile_picture: result.assets[0].uri });
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
        await updateProfile({ profile_picture: result.assets[0].uri });
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
          onPress: signOut
        }
      ]
    );
  };

  const rankInfo = getRank();

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            Loading profile...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <BarBuddyLogo size="small" />
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          Your Bar Buddy Profile
        </Text>
        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color={themeColors.error} />
        </Pressable>
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

            <Text style={[styles.email, { color: themeColors.subtext }]}>
              {profile.email}
            </Text>
          </View>

          {/* XP and Ranking Card */}
          <View style={[styles.xpCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.xpHeader}>
              <Award size={24} color={rankInfo.color} />
              <View style={styles.xpInfo}>
                <Text style={[styles.xpAmount, { color: themeColors.text }]}>
                  {profile.xp} XP
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
          </View>

          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {profile.nights_out}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Nights Out
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {profile.bars_hit}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Bars Hit
              </Text>
            </View>
          </View>

          <View style={styles.footer} />
        </ScrollView>
      ) : (
        <BarBuddyChatbot />
      )}

      {/* Onboarding Modal */}
      <OnboardingModal
        visible={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />
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
    fontSize: 16,<boltArtifact id="auth-system-implementation" title="Username and Password Authentication System">