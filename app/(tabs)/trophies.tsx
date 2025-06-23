import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Modal, Animated } from 'react-native';
import { Trophy, Award, Star, Target, Users, Calendar, X, MapPin, TrendingUp, ChartBar as BarChart3 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useAchievementStore, CompletedAchievement } from '@/stores/achievementStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';

export default function TrophiesScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { profile, getRank, getAverageDrunkScale } = useUserProfileStore();
  const { completedAchievements, getCompletedAchievementsByCategory } = useAchievementStore();
  const [selectedAchievement, setSelectedAchievement] = useState<CompletedAchievement | null>(null);
  
  const rankInfo = getRank();
  const totalCompletedAchievements = completedAchievements.length;
  const averageDrunkScale = getAverageDrunkScale();

  // Animation values for premium interactions
  const scaleAnim = new Animated.Value(1);
  
  const categories = [
    { key: 'bars', title: 'Bar Hopping', icon: Trophy, color: '#FF6A00' },
    { key: 'activities', title: 'Activities', icon: Target, color: '#4CAF50' },
    { key: 'social', title: 'Social', icon: Users, color: '#2196F3' },
    { key: 'milestones', title: 'Milestones', icon: Star, color: '#9C27B0' },
  ] as const;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  const handleAchievementPress = (achievement: CompletedAchievement) => {
    // Subtle press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
    
    setSelectedAchievement(achievement);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <BarBuddyLogo size="small" />
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Your Trophies
          </Text>
        </View>

        <View style={[styles.statsCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Trophy size={24} color={themeColors.primary} />
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {totalCompletedAchievements}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Trophies Earned
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Award size={24} color={rankInfo.color} />
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {profile.xp}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Total XP
              </Text>
            </View>
          </View>
        </View>

        {/* Redesigned Current Rank with enhanced styling */}
        <View style={[styles.rankCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.rankContent}>
            <Award size={40} color={rankInfo.color} />
            <View style={styles.rankInfo}>
              <Text style={[styles.rankTitle, { color: rankInfo.color }]}>
                {rankInfo.title}
              </Text>
              <Text style={[styles.rankSubtitle, { color: themeColors.text }]}>
                {rankInfo.subTitle}
              </Text>
              <Text style={[styles.rankXP, { color: themeColors.subtext }]}>
                {profile.xp} XP
              </Text>
            </View>
          </View>
        </View>

        {/* Total Tracker Stats - Enhanced styling */}
        <View style={[styles.trackerStatsCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.trackerStatsHeader}>
            <BarChart3 size={20} color={themeColors.primary} />
            <Text style={[styles.trackerStatsTitle, { color: themeColors.text }]}>
              Total Tracker Stats
            </Text>
          </View>
          
          <View style={styles.trackerStatsGrid}>
            <View style={styles.trackerStatItem}>
              <Text style={[styles.trackerStatNumber, { color: themeColors.text }]}>
                {profile.totalShots}
              </Text>
              <Text style={[styles.trackerStatLabel, { color: themeColors.subtext }]}>
                🥃 Shots
              </Text>
            </View>
            
            <View style={styles.trackerStatItem}>
              <Text style={[styles.trackerStatNumber, { color: themeColors.text }]}>
                {profile.totalScoopAndScores}
              </Text>
              <Text style={[styles.trackerStatLabel, { color: themeColors.subtext }]}>
                🍺 Scoop & Scores
              </Text>
            </View>
            
            <View style={styles.trackerStatItem}>
              <Text style={[styles.trackerStatNumber, { color: themeColors.text }]}>
                {profile.totalBeers}
              </Text>
              <Text style={[styles.trackerStatLabel, { color: themeColors.subtext }]}>
                🍻 Beers
              </Text>
            </View>
            
            <View style={styles.trackerStatItem}>
              <Text style={[styles.trackerStatNumber, { color: themeColors.text }]}>
                {profile.totalBeerTowers}
              </Text>
              <Text style={[styles.trackerStatLabel, { color: themeColors.subtext }]}>
                🗼 Beer Towers
              </Text>
            </View>
            
            <View style={styles.trackerStatItem}>
              <Text style={[styles.trackerStatNumber, { color: themeColors.text }]}>
                {profile.totalFunnels}
              </Text>
              <Text style={[styles.trackerStatLabel, { color: themeColors.subtext }]}>
                🌪️ Funnels
              </Text>
            </View>
            
            <View style={styles.trackerStatItem}>
              <Text style={[styles.trackerStatNumber, { color: themeColors.text }]}>
                {profile.totalShotguns}
              </Text>
              <Text style={[styles.trackerStatLabel, { color: themeColors.subtext }]}>
                💥 Shotguns
              </Text>
            </View>

            <View style={styles.trackerStatItem}>
              <Text style={[styles.trackerStatNumber, { color: themeColors.text }]}>
                {profile.poolGamesWon || 0}
              </Text>
              <Text style={[styles.trackerStatLabel, { color: themeColors.subtext }]}>
                🎱 Pool Games
              </Text>
            </View>

            <View style={styles.trackerStatItem}>
              <Text style={[styles.trackerStatNumber, { color: themeColors.text }]}>
                {profile.dartGamesWon || 0}
              </Text>
              <Text style={[styles.trackerStatLabel, { color: themeColors.subtext }]}>
                🎯 Dart Games
              </Text>
            </View>
          </View>
        </View>

        {/* Lifetime Stats Section with enhanced styling */}
        <View style={[styles.lifetimeStatsCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.lifetimeStatsTitle, { color: themeColors.text }]}>
            Lifetime Stats
          </Text>
          <View style={styles.lifetimeStatsGrid}>
            <View style={styles.lifetimeStat}>
              <TrendingUp size={20} color={themeColors.primary} />
              <Text style={[styles.lifetimeStatNumber, { color: themeColors.text }]}>
                {profile.nightsOut}
              </Text>
              <Text style={[styles.lifetimeStatLabel, { color: themeColors.subtext }]}>
                Nights Out
              </Text>
            </View>

            <View style={styles.lifetimeStat}>
              <MapPin size={20} color={themeColors.primary} />
              <Text style={[styles.lifetimeStatNumber, { color: themeColors.text }]}>
                {profile.barsHit}
              </Text>
              <Text style={[styles.lifetimeStatLabel, { color: themeColors.subtext }]}>
                Bars Hit
              </Text>
            </View>

            <View style={styles.lifetimeStat}>
              <Star size={20} color={themeColors.primary} />
              <Text style={[styles.lifetimeStatNumber, { color: themeColors.text }]}>
                {averageDrunkScale > 0 ? averageDrunkScale.toFixed(1) : '0.0'}
              </Text>
              <Text style={[styles.lifetimeStatLabel, { color: themeColors.subtext }]}>
                Drunk Scale Avg
              </Text>
            </View>
          </View>
        </View>

        {totalCompletedAchievements === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
            <Trophy size={48} color={themeColors.subtext} />
            <Text style={[styles.emptyStateTitle, { color: themeColors.text }]}>
              No Trophies Yet
            </Text>
            <Text style={[styles.emptyStateText, { color: themeColors.subtext }]}>
              Complete achievements to earn your first trophy! Check the Tasks tab to see what you can work on.
            </Text>
          </View>
        ) : (
          categories.map((category) => {
            const categoryCompletedAchievements = getCompletedAchievementsByCategory(category.key);
            
            if (categoryCompletedAchievements.length === 0) return null;
            
            return (
              <View key={category.key} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryTitleRow}>
                    <category.icon size={20} color={category.color} />
                    <Text style={[styles.categoryTitle, { color: themeColors.text }]}>
                      {category.title}
                    </Text>
                  </View>
                  <Text style={[styles.categoryProgress, { color: themeColors.subtext }]}>
                    {categoryCompletedAchievements.length} earned
                  </Text>
                </View>
                
                <View style={styles.achievementGrid}>
                  {categoryCompletedAchievements.map((achievement) => (
                    <Animated.View key={achievement.id} style={{ transform: [{ scale: scaleAnim }] }}>
                      <Pressable
                        style={[
                          styles.achievementCard,
                          { 
                            backgroundColor: themeColors.card,
                            borderColor: category.color,
                            borderWidth: 2,
                          }
                        ]}
                        onPress={() => handleAchievementPress(achievement)}
                      >
                        <View style={styles.achievementContent}>
                          <Text style={styles.achievementIcon}>
                            {achievement.icon}
                          </Text>
                          <View style={styles.achievementTextContainer}>
                            {achievement.level > 1 && (
                              <View style={[styles.levelBadge, { backgroundColor: category.color }]}>
                                <Text style={styles.levelBadgeText}>Lv.{achievement.level}</Text>
                              </View>
                            )}
                            <Text 
                              style={[
                                styles.achievementTitle, 
                                { 
                                  color: themeColors.text,
                                  marginTop: achievement.level > 1 ? 16 : 0 // Add top margin when level badge is present
                                }
                              ]}
                              numberOfLines={2}
                            >
                              {achievement.title}
                            </Text>
                          </View>
                          
                          <View style={[styles.completedBadge, { backgroundColor: category.color }]}>
                            <Trophy size={12} color="white" />
                          </View>
                        </View>
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              </View>
            );
          })
        )}

        <View style={styles.footer} />
      </ScrollView>

      {/* Enhanced Modal with glassmorphism */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedAchievement}
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { 
            backgroundColor: themeColors.glass.background,
            borderColor: themeColors.glass.border,
          }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Trophy Details
              </Text>
              <Pressable 
                style={styles.closeButton}
                onPress={() => setSelectedAchievement(null)}
              >
                <X size={24} color={themeColors.subtext} />
              </Pressable>
            </View>
            
            {selectedAchievement && (
              <View style={styles.modalBody}>
                <Text style={styles.modalIcon}>
                  {selectedAchievement.icon}
                </Text>
                
                <Text style={[styles.modalAchievementTitle, { color: themeColors.text }]}>
                  {selectedAchievement.title}
                </Text>
                
                <Text style={[styles.modalDescription, { color: themeColors.subtext }]}>
                  {selectedAchievement.description}
                </Text>
                
                {selectedAchievement.level > 1 && (
                  <View style={[styles.modalLevelBadge, { backgroundColor: themeColors.primary }]}>
                    <Text style={styles.modalLevelText}>Level {selectedAchievement.level}</Text>
                  </View>
                )}
                
                <View style={styles.completedInfo}>
                  <Calendar size={16} color={themeColors.primary} />
                  <Text style={[styles.completedDate, { color: themeColors.primary }]}>
                    Completed on {formatDate(selectedAchievement.completedAt)}
                  </Text>
                </View>
                
                <View style={[styles.statusBadge, { backgroundColor: themeColors.primary + '20' }]}>
                  <Trophy size={16} color={themeColors.primary} />
                  <Text style={[styles.statusText, { color: themeColors.primary }]}>
                    Trophy Earned
                  </Text>
                </View>
              </View>
            )}
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 24, // More spacing
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700', // Bolder
    marginTop: 8,
    letterSpacing: 0.3,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 20, // More spacing
    borderRadius: 20, // More rounded
    padding: 24, // More padding
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28, // Larger for impact
    fontWeight: '800', // Bolder
    marginTop: 12, // More spacing
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600', // Bolder
    letterSpacing: 0.3,
  },
  rankCard: {
    marginHorizontal: 16,
    marginBottom: 20, // More spacing
    borderRadius: 20, // More rounded
    padding: 24, // More padding
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rankContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankInfo: {
    marginLeft: 20, // More spacing
    flex: 1,
  },
  rankTitle: {
    fontSize: 22, // Larger
    fontWeight: '800', // Bolder
    marginBottom: 6, // More spacing
    letterSpacing: 0.5,
  },
  rankSubtitle: {
    fontSize: 16,
    fontWeight: '600', // Bolder
    marginBottom: 6, // More spacing
    letterSpacing: 0.3,
  },
  rankXP: {
    fontSize: 14,
    fontWeight: '600', // Bolder
    letterSpacing: 0.2,
  },
  trackerStatsCard: {
    marginHorizontal: 16,
    marginBottom: 20, // More spacing
    borderRadius: 20, // More rounded
    padding: 24, // More padding
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  trackerStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, // More spacing
  },
  trackerStatsTitle: {
    fontSize: 18,
    fontWeight: '700', // Bolder
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  trackerStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trackerStatItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20, // More spacing
  },
  trackerStatNumber: {
    fontSize: 24, // Larger
    fontWeight: '800', // Bolder
    marginBottom: 6, // More spacing
    letterSpacing: 0.5,
  },
  trackerStatLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600', // Bolder
    letterSpacing: 0.2,
  },
  lifetimeStatsCard: {
    marginHorizontal: 16,
    marginBottom: 20, // More spacing
    borderRadius: 20, // More rounded
    padding: 24, // More padding
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  lifetimeStatsTitle: {
    fontSize: 18,
    fontWeight: '700', // Bolder
    marginBottom: 20, // More spacing
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  lifetimeStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  lifetimeStat: {
    alignItems: 'center',
  },
  lifetimeStatNumber: {
    fontSize: 28, // Larger
    fontWeight: '800', // Bolder
    marginTop: 12, // More spacing
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  lifetimeStatLabel: {
    fontSize: 12,
    fontWeight: '600', // Bolder
    letterSpacing: 0.2,
  },
  emptyState: {
    marginHorizontal: 16,
    borderRadius: 20, // More rounded
    padding: 40, // More padding
    alignItems: 'center',
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700', // Bolder
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500', // Slightly bolder
  },
  categorySection: {
    marginHorizontal: 16,
    marginBottom: 28, // More spacing
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, // More spacing
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700', // Bolder
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  categoryProgress: {
    fontSize: 14,
    fontWeight: '600', // Bolder
    letterSpacing: 0.2,
  },
  achievementGrid: {
    gap: 12, // Spacing between cards
  },
  achievementCard: {
    width: '100%', // Full width for better text visibility
    borderRadius: 16, // More rounded
    padding: 20, // More padding
    position: 'relative',
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Changed from 'center' to 'flex-start' for better alignment
  },
  achievementIcon: {
    fontSize: 36, // Larger
    marginRight: 16, // More spacing
    marginTop: 4, // Slight adjustment for alignment
  },
  achievementTextContainer: {
    flex: 1,
    position: 'relative',
    paddingTop: 4, // Add padding to accommodate level badge
  },
  achievementTitle: {
    fontSize: 16, // Slightly larger for better readability
    fontWeight: '700', // Bolder
    marginBottom: 8,
    letterSpacing: 0.2,
    paddingRight: 40, // Space for the completed badge
    lineHeight: 20, // Better line height for readability
  },
  levelBadge: {
    position: 'absolute',
    top: 0, // Changed from -8 to 0 to prevent overlap
    left: 0,
    paddingHorizontal: 8, // More padding
    paddingVertical: 4,
    borderRadius: 10, // More rounded
    zIndex: 1, // Ensure it's above other elements
  },
  levelBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700', // Bolder
    letterSpacing: 0.2,
  },
  completedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24, // Larger
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  footer: {
    height: 32, // More spacing
  },
  // Enhanced modal styles with glassmorphism
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker overlay
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 24, // More rounded
    padding: 28, // More padding
    borderWidth: 1,
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24, // More spacing
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800', // Bolder
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 8, // More padding
  },
  modalBody: {
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 56, // Larger
    marginBottom: 20, // More spacing
  },
  modalAchievementTitle: {
    fontSize: 24, // Larger
    fontWeight: '800', // Bolder
    marginBottom: 16, // More spacing
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24, // More spacing
    fontWeight: '500', // Slightly bolder
  },
  modalLevelBadge: {
    paddingHorizontal: 16, // More padding
    paddingVertical: 8,
    borderRadius: 16, // More rounded
    marginBottom: 20, // More spacing
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalLevelText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800', // Bolder
    letterSpacing: 0.3,
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, // More spacing
  },
  completedDate: {
    fontSize: 14,
    fontWeight: '600', // Bolder
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20, // More padding
    paddingVertical: 12,
    borderRadius: 24, // More rounded
    gap: 10, // More spacing
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700', // Bolder
    letterSpacing: 0.3,
  },
});