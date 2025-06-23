import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Modal } from 'react-native';
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
            Your Trophies & Achievements
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

        {/* Current Rank */}
        <View style={[styles.rankCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.rankContent}>
            <Award size={28} color={rankInfo.color} />
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

        {/* Total Tracker Stats - Moved from Achievements page */}
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

        {/* Lifetime Stats Section */}
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
              Complete achievements to earn your first trophy! Check the Achievements tab to see what you can work on.
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
                    <Pressable
                      key={achievement.id}
                      style={[
                        styles.achievementCard,
                        { 
                          backgroundColor: themeColors.card,
                          borderColor: category.color,
                          borderWidth: 2,
                        }
                      ]}
                      onPress={() => setSelectedAchievement(achievement)}
                    >
                      <Text style={styles.achievementIcon}>
                        {achievement.icon}
                      </Text>
                      <Text 
                        style={[styles.achievementTitle, { color: themeColors.text }]}
                        numberOfLines={2}
                      >
                        {achievement.title}
                      </Text>
                      
                      {achievement.level > 1 && (
                        <View style={[styles.levelBadge, { backgroundColor: category.color }]}>
                          <Text style={styles.levelBadgeText}>Lv.{achievement.level}</Text>
                        </View>
                      )}
                      
                      <View style={[styles.completedBadge, { backgroundColor: category.color }]}>
                        <Trophy size={12} color="white" />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })
        )}

        <View style={styles.footer} />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedAchievement}
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
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
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  statsCard: {
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  rankCard: {
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
  rankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankInfo: {
    marginLeft: 16,
    alignItems: 'center',
  },
  rankTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  rankSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  rankXP: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  trackerStatsCard: {
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
  trackerStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackerStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  trackerStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trackerStatItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackerStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  trackerStatLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  lifetimeStatsCard: {
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
  lifetimeStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  lifetimeStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  lifetimeStat: {
    alignItems: 'center',
  },
  lifetimeStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  lifetimeStatLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  categorySection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  categoryProgress: {
    fontSize: 14,
    fontWeight: '500',
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 36,
  },
  levelBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  completedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    height: 24,
  },
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
  modalBody: {
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalAchievementTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalLevelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalLevelText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  completedDate: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
});