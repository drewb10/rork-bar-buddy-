import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Alert, Modal, TextInput, Image } from 'react-native';
import { User, TrendingUp, MapPin, Zap, Edit3, X, Award, Camera } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import DrunkScaleSlider from '@/components/DrunkScaleSlider';
import * as ImagePicker from 'expo-image-picker';

export default function TrackingScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { 
    profile, 
    updateProfile, 
    getAverageDrunkScale, 
    addDrunkScaleRating,
    canSubmitDrunkScale,
    getRank,
    setProfilePicture,
    setUserName
  } = useUserProfileStore();
  
  const [nameEditModalVisible, setNameEditModalVisible] = useState(false);
  const [drunkScaleModalVisible, setDrunkScaleModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState(profile.firstName);
  const [editLastName, setEditLastName] = useState(profile.lastName);
  
  const averageDrunkScale = getAverageDrunkScale();
  const canSubmitToday = canSubmitDrunkScale();
  const rankInfo = getRank();

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

  const handleDrunkScaleSubmit = (rating: number) => {
    addDrunkScaleRating(rating);
    setDrunkScaleModalVisible(false);
    Alert.alert('Rating Submitted', `You rated last night as ${rating}/10 on the drunk scale!`);
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
        </View>

        {/* Stats Grid */}
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

          {/* Drunk Scale */}
          <View style={[styles.statCard, styles.fullWidthCard, { backgroundColor: themeColors.card }]}>
            <Zap size={28} color={themeColors.primary} />
            <Text style={[styles.statNumber, { color: themeColors.text }]}>
              {averageDrunkScale > 0 ? averageDrunkScale.toFixed(1) : '0.0'}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
              Drunk Scale Average
            </Text>
          </View>

          {/* Drunk Scale Rating Button */}
          <Pressable 
            style={[
              styles.drunkScaleButton, 
              { 
                backgroundColor: canSubmitToday ? themeColors.primary : themeColors.card,
                opacity: canSubmitToday ? 1 : 0.6
              }
            ]}
            onPress={() => {
              if (canSubmitToday) {
                setDrunkScaleModalVisible(true);
              } else {
                Alert.alert('Already Rated', 'You can only rate once per day. Come back tomorrow!');
              }
            }}
            disabled={!canSubmitToday}
          >
            <Text style={[
              styles.drunkScaleButtonText, 
              { color: canSubmitToday ? 'white' : themeColors.subtext }
            ]}>
              How lit did you get last night?
            </Text>
          </Pressable>

          {/* Ranking Card - Centered and Stacked */}
          <View style={styles.rankingContainer}>
            <View style={[styles.rankingCard, { backgroundColor: themeColors.card }]}>
              <Award size={24} color={rankInfo.color} />
              <Text style={[styles.rankingTitle, { color: rankInfo.color }]}>
                {rankInfo.title}
              </Text>
              <Text style={[styles.rankingSubtext, { color: themeColors.subtext }]}>
                Rank {rankInfo.rank}/4
              </Text>
            </View>
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

      {/* Drunk Scale Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={drunkScaleModalVisible}
        onRequestClose={() => setDrunkScaleModalVisible(false)}
      >
        <DrunkScaleSlider
          onSubmit={handleDrunkScaleSubmit}
          onCancel={() => setDrunkScaleModalVisible(false)}
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
    marginBottom: 24,
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
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
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
  drunkScaleButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  drunkScaleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  rankingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rankingCard: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    width: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rankingTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  rankingSubtext: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
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
});