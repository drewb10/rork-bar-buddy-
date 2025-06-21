import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Alert, Modal, TextInput, Image } from 'react-native';
import { User, TrendingUp, MapPin, Edit3, X, Award, Camera, Share2, Users, RotateCcw, Info, BarChart3 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { venues } from '@/mocks/venues';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import ShareStatsModal from '@/components/ShareStatsModal';
import FriendsModal from '@/components/FriendsModal';
import * as ImagePicker from 'expo-image-picker';

export default function TrackingScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { 
    profile, 
    updateProfile, 
    getAverageDrunkScale, 
    getRank,
    getAllRanks,
    getXPForNextRank,
    getProgressToNextRank,
    setProfilePicture,
    setUserName,
    resetStats
  } = useUserProfileStore();
  
  const { interactions } = useVenueInteractionStore();
  
  const [nameEditModalVisible, setNameEditModalVisible] = useState(false);
  const [shareStatsModalVisible, setShareStatsModalVisible] = useState(false);
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);
  const [rankDetailsModalVisible, setRankDetailsModalVisible] = useState(false);
  const [barVisitsModalVisible, setBarVisitsModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState(profile.firstName);
  const [editLastName, setEditLastName] = useState(profile.lastName);
  
  const averageDrunkScale = getAverageDrunkScale();
  const rankInfo = getRank();
  const allRanks = getAllRanks();
  const nextRankXP = getXPForNextRank();
  const progressToNext = getProgressToNextRank();

  // Get bar visit data
  const getBarVisits = () => {
    return interactions
      .filter(interaction => interaction.count > 0)
      .map(interaction => {
        const venue = venues.find(v => v.id === interaction.venueId);
        return {
          venueId: interaction.venueId,
          venueName: venue?.name || 'Unknown Bar',
          visits: interaction.count,
          likes: interaction.likes
        };
      })
      .sort((a, b) => b.visits - a.visits);
  };

  const barVisits = getBarVisits();
  const totalVisits = barVisits.reduce((sum, bar) => sum + bar.visits, 0);

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

  const handleNameSave = () => {
    if (editFirstName.trim() && editLastName.trim()) {
      setUserName(editFirstName.trim(), editLastName.trim());
      setNameEditModalVisible(false);
    } else {
      Alert.alert('Error', 'Please enter both first and last name.');
    }
  };

  const handleResetStats = () => {
    Alert.alert(
      'Reset My Stats',
      'Are you sure you want to reset all your stats? This will set your nights out, bars hit, XP, and drunk scale ratings back to zero. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            resetStats();
            Alert.alert('Stats Reset', 'Your stats have been reset to zero.');
          }
        },
      ]
    );
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
        setProfilePicture(result.assets[0].uri);
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
        setProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.warn('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#121212' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <BarBuddyLogo size="small" />
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Your Bar Buddy Stats
          </Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: themeColors.card }]}>
          <Pressable style={styles.avatarContainer} onPress={handleProfilePicturePress}>
            {profile.profilePicture ? (
              <Image source={{ uri: profile.profilePicture }} style={styles.avatarImage} />
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
              {profile.firstName} {profile.lastName}
            </Text>
            <Pressable 
              style={styles.editButton}
              onPress={() => {
                setEditFirstName(profile.firstName);
                setEditLastName(profile.lastName);
                setNameEditModalVisible(true);
              }}
            >
              <Edit3 size={16} color={themeColors.primary} />
            </Pressable>
          </View>
          
          <Text style={[styles.joinDate, { color: themeColors.subtext }]}>
            Member since {formatJoinDate(profile.joinDate)}
          </Text>

          {profile.userId && (
            <Text style={[styles.userId, { color: themeColors.primary }]}>
              {profile.userId}
            </Text>
          )}
        </View>

        {/* XP and Ranking Card */}
        <View style={[styles.xpCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.xpHeader}>
            <Award size={24} color={rankInfo.color} />
            <View style={styles.xpInfo}>
              <Text style={[styles.xpAmount, { color: themeColors.text }]}>
                {profile.xp} XP
              </Text>
              <Text style={[styles.xpToNext, { color: themeColors.subtext }]}>
                {nextRankXP - profile.xp} XP to next rank
              </Text>
            </View>
          </View>
          
          <View style={[styles.progressBar, { backgroundColor: themeColors.background }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: rankInfo.color,
                  width: `${progressToNext}%`
                }
              ]} 
            />
          </View>
          
          <Pressable 
            style={styles.rankContainer}
            onPress={() => setRankDetailsModalVisible(true)}
          >
            <Text style={[styles.rankTitle, { color: rankInfo.color }]}>
              {rankInfo.title}
            </Text>
            <Text style={[styles.rankSubtitle, { color: themeColors.text }]}>
              {rankInfo.subTitle}
            </Text>
            <Info size={16} color={themeColors.subtext} style={styles.infoIcon} />
          </Pressable>
        </View>

        {/* Bar Visits Tracker */}
        {barVisits.length > 0 && (
          <Pressable 
            style={[styles.barVisitsCard, { backgroundColor: themeColors.card }]}
            onPress={() => setBarVisitsModalVisible(true)}
          >
            <View style={styles.barVisitsHeader}>
              <BarChart3 size={20} color={themeColors.primary} />
              <Text style={[styles.barVisitsTitle, { color: themeColors.text }]}>
                Bar Visit Tracker
              </Text>
              <Text style={[styles.totalVisits, { color: themeColors.primary }]}>
                {totalVisits} total visits
              </Text>
            </View>
            <Text style={[styles.barVisitsSubtitle, { color: themeColors.subtext }]}>
              You've visited {barVisits.length} different bars • Tap to see details
            </Text>
          </Pressable>
        )}

        {/* Friends Button */}
        <Pressable 
          style={[styles.friendsButton, { backgroundColor: themeColors.card }]}
          onPress={() => setFriendsModalVisible(true)}
        >
          <Users size={20} color={themeColors.primary} />
          <Text style={[styles.friendsButtonText, { color: themeColors.primary }]}>
            Friends ({profile.friends.length})
          </Text>
          {profile.friendRequests.length > 0 && (
            <View style={[styles.notificationBadge, { backgroundColor: '#FF4444' }]}>
              <Text style={styles.notificationText}>
                {profile.friendRequests.length}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Your Nightlife Stats
          </Text>
          
          <View style={styles.statsGrid}>
            {/* Nights Out */}
            <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
              <TrendingUp size={28} color={themeColors.primary} />
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {profile.nightsOut}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Nights Out
              </Text>
            </View>

            {/* Bars Hit */}
            <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
              <MapPin size={28} color={themeColors.primary} />
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {profile.barsHit}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Bars Hit
              </Text>
            </View>
          </View>

          {/* Drunk Scale Average - Display Only */}
          <View style={[styles.statCard, styles.fullWidthCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.statNumber, { color: themeColors.text }]}>
              {averageDrunkScale > 0 ? averageDrunkScale.toFixed(1) : '0.0'}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
              Drunk Scale Average
            </Text>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            {/* Share Stats Button */}
            <Pressable 
              style={[styles.actionButton, { backgroundColor: themeColors.card }]}
              onPress={() => setShareStatsModalVisible(true)}
            >
              <Share2 size={18} color={themeColors.primary} />
              <Text style={[styles.actionButtonText, { color: themeColors.primary }]}>
                Share Stats
              </Text>
            </Pressable>

            {/* Reset Stats Button */}
            <Pressable 
              style={[styles.actionButton, { backgroundColor: themeColors.card }]}
              onPress={handleResetStats}
            >
              <RotateCcw size={18} color="#FF4444" />
              <Text style={[styles.actionButtonText, { color: "#FF4444" }]}>
                Reset Stats
              </Text>
            </Pressable>
          </View>

          {/* Activity Summary */}
          <View style={[styles.summaryCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.summaryText, { color: themeColors.subtext }]}>
              You have been out {profile.nightsOut} {profile.nightsOut === 1 ? 'night' : 'nights'} and visited {profile.barsHit} different {profile.barsHit === 1 ? 'bar' : 'bars'}.
            </Text>
          </View>
        </View>

        <View style={styles.footer} />
      </ScrollView>

      {/* Name Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={nameEditModalVisible}
        onRequestClose={() => setNameEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Edit Name
              </Text>
              <Pressable 
                style={styles.closeButton}
                onPress={() => setNameEditModalVisible(false)}
              >
                <X size={24} color={themeColors.subtext} />
              </Pressable>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>First Name</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  borderColor: themeColors.border
                }]}
                value={editFirstName}
                onChangeText={setEditFirstName}
                placeholder="Enter first name"
                placeholderTextColor={themeColors.subtext}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Last Name</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  borderColor: themeColors.border
                }]}
                value={editLastName}
                onChangeText={setEditLastName}
                placeholder="Enter last name"
                placeholderTextColor={themeColors.subtext}
              />
            </View>
            
            <View style={styles.modalActions}>
              <Pressable 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setNameEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalButton, styles.saveButton, { backgroundColor: themeColors.primary }]} 
                onPress={handleNameSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bar Visits Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={barVisitsModalVisible}
        onRequestClose={() => setBarVisitsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Bar Visit History
              </Text>
              <Pressable 
                style={styles.closeButton}
                onPress={() => setBarVisitsModalVisible(false)}
              >
                <X size={24} color={themeColors.subtext} />
              </Pressable>
            </View>
            
            <ScrollView style={styles.barVisitsList} showsVerticalScrollIndicator={false}>
              {barVisits.map((bar, index) => (
                <View 
                  key={bar.venueId}
                  style={[
                    styles.barVisitItem,
                    { 
                      backgroundColor: themeColors.background,
                      borderLeftColor: index < 3 ? themeColors.primary : themeColors.border
                    }
                  ]}
                >
                  <View style={styles.barVisitInfo}>
                    <Text style={[styles.barVisitName, { color: themeColors.text }]}>
                      {bar.venueName}
                    </Text>
                    <Text style={[styles.barVisitStats, { color: themeColors.subtext }]}>
                      {bar.visits} {bar.visits === 1 ? 'visit' : 'visits'} • {bar.likes} {bar.likes === 1 ? 'like' : 'likes'}
                    </Text>
                  </View>
                  <View style={[styles.visitBadge, { backgroundColor: themeColors.primary }]}>
                    <Text style={styles.visitBadgeText}>{bar.visits}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            
            <View style={[styles.barVisitsSummary, { backgroundColor: themeColors.background }]}>
              <Text style={[styles.summaryText, { color: themeColors.subtext }]}>
                Total: {totalVisits} visits across {barVisits.length} bars
              </Text>
            </View>
          </View>
        </View>
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
                Ranking System
              </Text>
              <Pressable 
                style={styles.closeButton}
                onPress={() => setRankDetailsModalVisible(false)}
              >
                <X size={24} color={themeColors.subtext} />
              </Pressable>
            </View>
            
            <ScrollView style={styles.rankList} showsVerticalScrollIndicator={false}>
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
                        : 'transparent',
                      borderWidth: 1,
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

      {/* Share Stats Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={shareStatsModalVisible}
        onRequestClose={() => setShareStatsModalVisible(false)}
      >
        <ShareStatsModal
          profile={profile}
          rankInfo={rankInfo}
          onClose={() => setShareStatsModalVisible(false)}
        />
      </Modal>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
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
    borderColor: '#121212',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    marginRight: 8,
  },
  editButton: {
    padding: 4,
  },
  joinDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  userId: {
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 2,
  },
  xpToNext: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  rankContainer: {
    alignItems: 'center',
    position: 'relative',
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
  infoIcon: {
    position: 'absolute',
    right: -20,
    top: 8,
  },
  barVisitsCard: {
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
  barVisitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barVisitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  totalVisits: {
    fontSize: 14,
    fontWeight: '600',
  },
  barVisitsSubtitle: {
    fontSize: 14,
    lineHeight: 18,
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
    position: 'relative',
  },
  friendsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fullWidthCard: {
    flex: 0,
    width: '100%',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    height: 24,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
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
    padding: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: '#999',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#FF6A00',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Bar visits modal styles
  barVisitsList: {
    maxHeight: 400,
  },
  barVisitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  barVisitInfo: {
    flex: 1,
  },
  barVisitName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  barVisitStats: {
    fontSize: 14,
  },
  visitBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  barVisitsSummary: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  // Rank details modal styles
  rankList: {
    maxHeight: 400,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  rankItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  rankItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  rankItemSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  rankItemXP: {
    fontSize: 12,
    fontWeight: '500',
  },
  currentRankBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
});