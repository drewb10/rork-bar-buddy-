import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, TextInput, Modal, StatusBar, Platform } from 'react-native';
import { User, Edit3, TrendingUp, MapPin, Award, Calendar, BarChart3 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { 
    profile, 
    updateProfile, 
    getAverageDrunkScale, 
    getRank 
  } = useUserProfileStore();
  const { interactions } = useVenueInteractionStore();
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState(profile.firstName);
  const [editLastName, setEditLastName] = useState(profile.lastName);

  const averageDrunkScale = getAverageDrunkScale();
  const rankInfo = getRank();
  const totalInteractions = interactions.reduce((sum, interaction) => sum + interaction.count, 0);

  const handleSaveProfile = () => {
    updateProfile({
      firstName: editFirstName,
      lastName: editLastName
    });
    setEditModalVisible(false);
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: '#121212' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Logo */}
        <View style={styles.header}>
          <BarBuddyLogo size="small" />
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: themeColors.primary }]}>
              <User size={32} color="white" />
            </View>
            <Pressable 
              style={styles.editButton}
              onPress={() => setEditModalVisible(true)}
            >
              <Edit3 size={20} color={themeColors.primary} />
            </Pressable>
          </View>
          
          <Text style={[styles.userName, { color: themeColors.text }]}>
            {profile.firstName} {profile.lastName}
          </Text>
          
          <View style={styles.joinDateContainer}>
            <Calendar size={16} color={themeColors.subtext} />
            <Text style={[styles.joinDate, { color: themeColors.subtext }]}>
              Member since {formatJoinDate(profile.joinDate)}
            </Text>
          </View>

          {/* Rank Badge */}
          <View style={[styles.rankBadge, { backgroundColor: themeColors.primary + '20' }]}>
            <Award size={20} color={themeColors.primary} />
            <Text style={[styles.rankText, { color: themeColors.primary }]}>
              Rank {rankInfo.rank}: {rankInfo.title}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Nights Out */}
          <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
            <LinearGradient
              colors={['rgba(255,106,0,0.1)', 'transparent']}
              style={styles.statGradient}
            />
            <TrendingUp size={24} color={themeColors.primary} />
            <Text style={[styles.statNumber, { color: themeColors.text }]}>
              {profile.nightsOut}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
              Nights Out
            </Text>
          </View>

          {/* Bars Hit */}
          <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
            <LinearGradient
              colors={['rgba(255,106,0,0.1)', 'transparent']}
              style={styles.statGradient}
            />
            <MapPin size={24} color={themeColors.primary} />
            <Text style={[styles.statNumber, { color: themeColors.text }]}>
              {profile.barsHit}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
              Bars Hit
            </Text>
          </View>

          {/* Total Check-ins */}
          <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
            <LinearGradient
              colors={['rgba(255,106,0,0.1)', 'transparent']}
              style={styles.statGradient}
            />
            <BarChart3 size={24} color={themeColors.primary} />
            <Text style={[styles.statNumber, { color: themeColors.text }]}>
              {totalInteractions}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
              Total Check-ins
            </Text>
          </View>

          {/* Average Drunk Scale */}
          <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
            <LinearGradient
              colors={['rgba(255,106,0,0.1)', 'transparent']}
              style={styles.statGradient}
            />
            <Award size={24} color={themeColors.primary} />
            <Text style={[styles.statNumber, { color: themeColors.text }]}>
              {averageDrunkScale > 0 ? averageDrunkScale.toFixed(1) : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
              Avg. Party Level
            </Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={[styles.activityCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.activityTitle, { color: themeColors.text }]}>
            Recent Activity
          </Text>
          {profile.drunkScaleRatings.length > 0 ? (
            <View style={styles.activityList}>
              <Text style={[styles.activityItem, { color: themeColors.subtext }]}>
                • {profile.drunkScaleRatings.length} party level ratings recorded
              </Text>
              <Text style={[styles.activityItem, { color: themeColors.subtext }]}>
                • {profile.nightsOut} nights out this month
              </Text>
              <Text style={[styles.activityItem, { color: themeColors.subtext }]}>
                • {profile.barsHit} unique venues visited
              </Text>
            </View>
          ) : (
            <Text style={[styles.noActivity, { color: themeColors.subtext }]}>
              Start checking into venues to see your activity here!
            </Text>
          )}
        </View>

        <View style={styles.footer} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Edit Profile
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                First Name
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    backgroundColor: themeColors.background,
                    color: themeColors.text,
                    borderColor: themeColors.border
                  }
                ]}
                value={editFirstName}
                onChangeText={setEditFirstName}
                placeholder="Enter first name"
                placeholderTextColor={themeColors.subtext}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                Last Name
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    backgroundColor: themeColors.background,
                    color: themeColors.text,
                    borderColor: themeColors.border
                  }
                ]}
                value={editLastName}
                onChangeText={setEditLastName}
                placeholder="Enter last name"
                placeholderTextColor={themeColors.subtext}
              />
            </View>
            
            <View style={styles.modalActions}>
              <Pressable 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setEditModalVisible(false);
                  setEditFirstName(profile.firstName);
                  setEditLastName(profile.lastName);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalButton, styles.saveButton, { backgroundColor: themeColors.primary }]} 
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
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
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  joinDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  joinDate: {
    marginLeft: 6,
    fontSize: 14,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rankText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  activityCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    fontSize: 14,
    lineHeight: 20,
  },
  noActivity: {
    fontSize: 14,
    fontStyle: 'italic',
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
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
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
    paddingHorizontal: 24,
    borderRadius: 25,
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