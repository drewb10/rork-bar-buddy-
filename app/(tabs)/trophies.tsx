import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Modal } from 'react-native';
import { Trophy, Award, Star, Target, Users, Calendar, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useAchievementStore } from '@/stores/achievementStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';

export default function TrophiesScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { profile, getRank } = useUserProfileStore();
  const { achievements, getCompletedCount, getAchievementsByCategory } = useAchievementStore();
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  
  const rankInfo = getRank();
  const completedCount = getCompletedCount();
  const totalAchievements = achievements.length;
  
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

  const getProgressPercentage = (achievement: any) => {
    if (!achievement.maxProgress) return achievement.completed ? 100 : 0;
    return Math.min((achievement.progress || 0) / achievement.maxProgress * 100, 100);
  };

  return (
    <View style={styles.container}>
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
            Your Trophies & Achievements
          </Text>
        </View>

        {/* Stats Overview */}
        <View style={[styles.statsCard, { backgroundColor: 'rgba(30, 30, 30, 0.9)' }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Trophy size={24} color={themeColors.primary} />
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {completedCount}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Completed
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
            
            <View style={styles.statItem}>
              <Star size={24} color={themeColors.accent} />
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {Math.round((completedCount / totalAchievements) * 100)}%
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Progress
              </Text>
            </View>
          </View>
        </View>

        {/* Current Rank - Centered */}
        <View style={[styles.rankCard, { backgroundColor: 'rgba(30, 30, 30, 0.9)' }]}>
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

        {/* Achievement Categories */}
        {categories.map((category) => {
          const categoryAchievements = getAchievementsByCategory(category.key);
          const completedInCategory = categoryAchievements.filter(a => a.completed).length;
          
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
                  {completedInCategory}/{categoryAchievements.length}
                </Text>
              </View>
              
              <View style={styles.achievementGrid}>
                {categoryAchievements.map((achievement) => (
                  <Pressable
                    key={achievement.id}
                    style={[
                      styles.achievementCard,
                      { 
                        backgroundColor: 'rgba(30, 30, 30, 0.9)',
                        opacity: achievement.completed ? 1 : 0.7,
                        borderColor: achievement.completed ? category.color : 'transparent',
                        borderWidth: achievement.completed ? 2 : 0,
                      }
                    ]}
                    onPress={() => setSelectedAchievement(achievement)}
                  >
                    <Text style={styles.achievementIcon}>
                      {achievement.icon}
                    </Text>
                    <Text 
                      style={[
                        styles.achievementTitle, 
                        { color: achievement.completed ? themeColors.text : themeColors.subtext }
                      ]}
                      numberOfLines={2}
                    >
                      {achievement.title}
                    </Text>
                    
                    {achievement.maxProgress && (
                      <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { backgroundColor: 'rgba(18, 18, 18, 0.8)' }]}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                backgroundColor: category.color,
                                width: `${getProgressPercentage(achievement)}%`
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.progressText, { color: themeColors.subtext }]}>
                          {achievement.progress || 0}/{achievement.maxProgress}
                        </Text>
                      </View>
                    )}
                    
                    {achievement.completed && (
                      <View style={[styles.completedBadge, { backgroundColor: category.color }]}>
                        <Trophy size={12} color="white" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}

        <View style={styles.footer} />
      </ScrollView>

      {/* Achievement Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedAchievement}
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: 'rgba(30, 30, 30, 0.95)' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Achievement Details
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
                  {selectedAchievement.detailedDescription}
                </Text>
                
                {selectedAchievement.maxProgress && (
                  <View style={styles.modalProgressContainer}>
                    <Text style={[styles.modalProgressLabel, { color: themeColors.text }]}>
                      Progress: {selectedAchievement.progress || 0}/{selectedAchievement.maxProgress}
                    </Text>
                    <View style={[styles.modalProgressBar, { backgroundColor: 'rgba(18, 18, 18, 0.8)' }]}>
                      <View 
                        style={[
                          styles.modalProgressFill, 
                          { 
                            backgroundColor: themeColors.primary,
                            width: `${getProgressPercentage(selectedAchievement)}%`
                          }
                        ]} 
                      />
                    </View>
                  </View>
                )}
                
                {selectedAchievement.completed && selectedAchievement.completedAt && (
                  <View style={styles.completedInfo}>
                    <Calendar size={16} color={themeColors.primary} />
                    <Text style={[styles.completedDate, { color: themeColors.primary }]}>
                      Completed on {formatDate(selectedAchievement.completedAt)}
                    </Text>
                  </View>
                )}
                
                <View style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: selectedAchievement.completed 
                      ? themeColors.primary + '20' 
                      : themeColors.subtext + '20' 
                  }
                ]}>
                  <Text style={[
                    styles.statusText, 
                    { 
                      color: selectedAchievement.completed 
                        ? themeColors.primary 
                        : themeColors.subtext 
                    }
                  ]}>
                    {selectedAchievement.completed ? 'Completed' : 'In Progress'}
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
    backgroundColor: 'transparent',
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
    marginBottom: 24,
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
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '500',
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
  modalProgressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  modalProgressLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalProgressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 4,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
});