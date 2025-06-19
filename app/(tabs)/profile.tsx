import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, TextInput, Modal, StatusBar, Platform } from 'react-native';
import { User, Edit3, TrendingUp, MapPin, Award, Calendar, BarChart3, Target, Trophy, Flame } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import { LinearGradient } from 'expo-linear-gradient';

export default function TrackingScreen() {
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

  const getProgressToNextRank = () => {
    const currentRank = rankInfo.rank;
    if (currentRank >= 10) return 100; // Max rank
    
    const nextRankThreshold = (currentRank + 1) * 0.85; // Rough threshold for next rank
    const progress = Math.min((averageDrunkScale / nextRankThreshold) * 100, 100);
    return Math.round(progress);
  };

  const getStreakData = () => {
    // Calculate current streak of nights out
    const today = new Date();
    let streak = 0;
    
    // This is a simplified streak calculation
    // In a real app, you'd want to track daily check-ins more precisely
    if (profile.nightsOut > 0) {
      streak = Math.min(profile.nightsOut, 7); // Cap at 7 for display
    }
    
    return streak;
  };

  const currentStreak = getStreakData();
  const progressToNextRank = getProgressToNextRank();

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
          <LinearGradient
            colors={['rgba(255,106,0,0.1)', 'transparent']}
            style={styles.profileGradient}
          />
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

          {/* Rank Badge with Progress */}
          <View style={[styles.rankContainer, { backgroundColor: themeColors.primary + '20' }]}>
            <View style={styles.rankHeader}>
              <Award size={20} color={themeColors.primary} />
              <Text style={[styles.rankText, { color: themeColors.primary }]}>
                Rank {rankInfo.rank}: {rankInfo.title}
              </Text>
            </View>
            {rankInfo.rank < 10 && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: themeColors.border }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        backgroundColor: themeColors.primary,
                        width: `${progressToNextRank}%`
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: themeColors.subtext }]}>
                  {progressToNextRank}% to Rank {rankInfo.rank + 1}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Main Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Your Nightlife Stats
          </Text>
          
          <View style={styles.statsGrid}>
            {/* Nights Out */}
            <View style={[styles.statCard, styles.largeStatCard, { backgroundColor: themeColors.card }]}>
              <LinearGradient
                colors={['rgba(255,106,0,0.15)', 'transparent']}
                style={styles.statGradient}
              />
              <View style={styles.statHeader}>
                <TrendingUp size={28} color={themeColors.primary} />
                <View style={[styles.statBadge, { backgroundColor: themeColors.primary }]}>
                  <Text style={styles.statBadgeText}>🔥</Text>
                </View>
              </View>
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {profile.nightsOut}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Nights Out
              </Text>
              <Text style={[styles.statSubtext, { color: themeColors.subtext }]}>
                This month
              </Text>
            </View>

            {/* Bars Hit */}
            <View style={[styles.statCard, styles.largeStatCard, { backgroundColor: themeColors.card }]}>
              <LinearGradient
                colors={['rgba(255,106,0,0.15)', 'transparent']}
                style={styles.statGradient}
              />
              <View style={styles.statHeader}>
                <MapPin size={28} color={themeColors.primary} />
                <View style={[styles.statBadge, { backgroundColor: themeColors.primary }]}>
                  <Text style={styles.statBadgeText}>📍</Text>
                </View>
              </View>
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {profile.barsHit}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Bars Hit
              </Text>
              <Text style={[styles.statSubtext, { color: themeColors.subtext }]}>
                Unique venues
              </Text>
            </View>
          </View>

          {/* Secondary Stats */}
          <View style={styles.secondaryStats}>
            {/* Total Check-ins */}
            <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
              <BarChart3 size={24} color={themeColors.primary} />
              <Text style={[styles.statNumber, styles.smallStatNumber, { color: themeColors.text }]}>
                {totalInteractions}
              </Text>
              <Text style={[styles.statLabel, styles.smallStatLabel, { color: themeColors.subtext }]}>
                Total Check-ins
              </Text>
            </View>

            {/* Current Streak */}
            <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
              <Flame size={24} color={themeColors.primary} />
              <Text style={[styles.statNumber, styles.smallStatNumber, { color: themeColors.text }]}>
                {currentStreak}
              </Text>
              <Text style={[styles.statLabel, styles.smallStatLabel, { color: themeColors.subtext }]}>
                Day Streak
              </Text>
            </View>

            {/* Average Party Level */}
            <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
              <Trophy size={24} color={themeColors.primary} />
              <Text style={[styles.statNumber, styles.smallStatNumber, { color: themeColors.text }]}>
                {averageDrunkScale > 0 ? averageDrunkScale.toFixed(1) : '—'}
              </Text>
              <Text style={[styles.statLabel, styles.smallStatLabel, { color: themeColors.subtext }]}>
                Avg. Party Level
              </Text>
            </View>
          </View>
        </View>

        {/* Achievement Section */}
        <View style={styles.achievementSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Recent Achievements
          </Text>
          
          <View style={[styles.achievementCard, { backgroundColor: themeColors.card }]}>
            {profile.nightsOut > 0 ? (
              <View style={styles.achievementList}>
                <View style={styles.achievementItem}>
                  <View style={[styles.achievementIcon, { backgroundColor: themeColors.primary + '20' }]}>
                    <TrendingUp size={16} color={themeColors.primary} />
                  </View>
                  <View style={styles.achievementText}>
                    <Text style={[styles.achievementTitle, { color: themeColors.text }]}>
                      Night Owl
                    </Text>
                    <Text style={[styles.achievementDesc, { color: themeColors.subtext }]}>
                      Completed {profile.nightsOut} nights out
                    </Text>
                  </View>
                </View>

                {profile.barsHit >= 5 && (
                  <View style={styles.achievementItem}>
                    <View style={[styles.achievementIcon, { backgroundColor: themeColors.primary + '20' }]}>
                      <MapPin size={16} color={themeColors.primary} />
                    </View>
                    <View style={styles.achievementText}>
                      <Text style={[styles.achievementTitle, { color: themeColors.text }]}>
                        Explorer
                      </Text>
                      <Text style={[styles.achievementDesc, { color: themeColors.subtext }]}>
                        Visited {profile.barsHit} different venues
                      </Text>
                    </View>
                  </View>
                )}

                {rankInfo.rank >= 5 && (
                  <View style={styles.achievementItem}>
                    <View style={[styles.achievementIcon, { backgroundColor: themeColors.primary + '20' }]}>
                      <Award size={16} color={themeColors.primary} />
                    </View>
                    <View style={styles.achievementText}>
                      <Text style={[styles.achievementTitle, { color: themeColors.text }]}>
                        {rankInfo.title}
                      </Text>
                      <Text style={[styles.achievementDesc, { color: themeColors.subtext }]}>
                        Reached Rank {rankInfo.rank}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noAchievements}>
                <Target size={32} color={themeColors.subtext} />
                <Text style={[styles.noAchievementsTitle, { color: themeColors.text }]}>
                  Start Your Journey
                </Text>
                <Text style={[styles.noAchievementsDesc, { color: themeColors.subtext }]}>
                  Check into your first venue to start earning achievements!
                </Text>
              </View>
            )}
          </View>
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
    paddingBottom: 10,
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
    position: 'relative',
    overflow: 'hidden',
  },
  profileGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  editButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  joinDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  joinDate: {
    marginLeft: 6,
    fontSize: 14,
  },
  rankContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
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
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  largeStatCard: {
    flex: 1,
    padding: 20,
  },
  statGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  statBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBadgeText: {
    fontSize: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  smallStatNumber: {
    fontSize: 24,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 2,
  },
  smallStatLabel: {
    fontSize: 12,
  },
  statSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  secondaryStats: {
    flexDirection: 'row',
    gap: 8,
  },
  achievementSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  achievementCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementList: {
    gap: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 14,
  },
  noAchievements: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAchievementsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  noAchievementsDesc: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 250,
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