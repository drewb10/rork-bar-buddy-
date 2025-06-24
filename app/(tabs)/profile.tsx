import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Alert, Modal, TextInput, Image } from 'react-native';
import { User, CreditCard as Edit3, X, Award, Camera, Users, Info } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { venues } from '@/mocks/venues';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import FriendsModal from '@/components/FriendsModal';
import BarBuddyChatbot from '@/components/BarBuddyChatbot';
import * as ImagePicker from 'expo-image-picker';

export default function TrackingScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { 
    profile, 
    updateProfile, 
    getRank,
    getAllRanks,
    getXPForNextRank,
    getProgressToNextRank,
    setProfilePicture,
    setUserName
  } = useUserProfileStore();
  
  const { interactions } = useVenueInteractionStore();
  
  const [nameEditModalVisible, setNameEditModalVisible] = useState(false);
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);
  const [rankDetailsModalVisible, setRankDetailsModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState(profile.firstName);
  const [editLastName, setEditLastName] = useState(profile.lastName);
  const [activeTab, setActiveTab] = useState<'profile' | 'chatbot'>('profile');
  
  const rankInfo = getRank();
  const allRanks = getAllRanks();
  const nextRankXP = getXPForNextRank();
  const progressToNext = getProgressToNextRank();

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
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <BarBuddyLogo size="small" />
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          Your Bar Buddy Profile
        </Text>
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

          <View style={styles.footer} />
        </ScrollView>
      ) : (
        <BarBuddyChatbot />
      )}

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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
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