import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Modal, Alert } from 'react-native';
import { Trophy, Target, Users, Star, RotateCcw, X, Info } from 'lucide-react-native';
import { getThemeColors, spacing, typography, borderRadius, shadows } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAchievementStore, Achievement } from '@/stores/achievementStore';
import AchievementPopup from '@/components/AchievementPopup';
import BarBuddyLogo from '@/components/BarBuddyLogo';

export default function AchievementsScreen() {
  const { theme } = useThemeStore();
  const themeColors = getThemeColors(theme);
  const { 
    achievements, 
    initializeAchievements, 
    getCompletedCount, 
    getAchievementsByCategory,
    resetAchievements 
  } = useAchievementStore();
  
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    initializeAchievements();
  }, []);

  const completedCount = getCompletedCount();
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'bars': return <Target size={20} color={themeColors.primary} />;
      case 'activities': return <Trophy size={20} color={themeColors.primary} />;
      case 'social': return <Users size={20} color={themeColors.primary} />;
      case 'milestones': return <Star size={20} color={themeColors.primary} />;
      default: return <Trophy size={20} color={themeColors.primary} />;
    }
  };

  const getCategoryTitle = (category: Achievement['category']) => {
    switch (category) {
      case 'bars': return 'Bar Hopping';
      case 'activities': return 'Activities';
      case 'social': return 'Social';
      case 'milestones': return 'Milestones';
      default: return 'Other';
    }
  };

  const handleAchievementPress = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
  };

  const getProgressPercentage = (achievement: Achievement) => {
    if (!achievement.maxProgress) return achievement.completed ? 100 : 0;
    return Math.round(((achievement.progress || 0) / achievement.maxProgress) * 100);
  };

  const renderProgressBar = (achievement: Achievement) => {
    const percentage = getProgressPercentage(achievement);
    
    return (
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarBackground, { backgroundColor: themeColors.background }]}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                backgroundColor: achievement.completed ? themeColors.primary : themeColors.primary + '60',
                width: `${percentage}%`
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressBarText, { color: themeColors.subtext }]}>
          {achievement.maxProgress 
            ? `${achievement.progress || 0}/${achievement.maxProgress}`
            : achievement.completed ? 'Complete' : 'Not started'
          }
        </Text>
      </View>
    );
  };

  const renderAchievementCategory = (category: Achievement['category']) => {
    const categoryAchievements = getAchievementsByCategory(category);
    if (categoryAchievements.length === 0) return null;

    const completedInCategory = categoryAchievements.filter(a => a.completed).length;

    return (
      <View key={category} style={[styles.categorySection, { backgroundColor: themeColors.card }]}>
        <View style={styles.categoryHeader}>
          {getCategoryIcon(category)}
          <Text style={[styles.categoryTitle, { color: themeColors.text }]}>
            {getCategoryTitle(category)}
          </Text>
          <Text style={[styles.categoryProgress, { color: themeColors.primary }]}>
            {completedInCategory}/{categoryAchievements.length}
          </Text>
        </View>
        
        <View style={styles.achievementList}>
          {categoryAchievements.map((achievement) => (
            <Pressable
              key={achievement.id}
              style={[
                styles.achievementCard,
                { 
                  backgroundColor: achievement.completed 
                    ? themeColors.primary + '20' 
                    : themeColors.background,
                  borderColor: achievement.completed 
                    ? themeColors.primary 
                    : themeColors.border,
                }
              ]}
              onPress={() => handleAchievementPress(achievement)}
            >
              <View style={styles.achievementHeader}>
                <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
                <View style={styles.achievementInfo}>
                  <Text 
                    style={[
                      styles.achievementName, 
                      { 
                        color: achievement.completed 
                          ? themeColors.primary 
                          : themeColors.text 
                      }
                    ]}
                    numberOfLines={2}
                  >
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDescription, { color: themeColors.subtext }]}>
                    {achievement.description}
                  </Text>
                </View>
                {achievement.completed && (
                  <Text style={[styles.completedBadge, { color: themeColors.primary }]}>
                    ✓
                  </Text>
                )}
              </View>
              
              {renderProgressBar(achievement)}
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
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
            Task Tracking
          </Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.subtext }]}>
            Complete tasks during your nights out!
          </Text>
        </View>

        {/* Progress Overview */}
        <View style={[styles.progressCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: themeColors.text }]}>
              Overall Progress
            </Text>
            <Text style={[styles.progressPercentage, { color: themeColors.primary }]}>
              {completionPercentage}%
            </Text>
          </View>
          
          <View style={[styles.progressBar, { backgroundColor: themeColors.background }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: themeColors.primary,
                  width: `${completionPercentage}%`
                }
              ]} 
            />
          </View>
          
          <Text style={[styles.progressText, { color: themeColors.subtext }]}>
            {completedCount} of {totalCount} tasks completed
          </Text>
        </View>

        {/* Achievement Categories */}
        <View style={styles.categoriesContainer}>
          {(['bars', 'activities', 'social', 'milestones'] as const).map(renderAchievementCategory)}
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.infoTitle, { color: themeColors.text }]}>
            💡 How it works
          </Text>
          <Text style={[styles.infoText, { color: themeColors.subtext }]}>
            Visit this tab at 3:00 AM to log your night's tasks! The popup will appear automatically when you're out and about. Tap on any task to learn how to complete it.
          </Text>
        </View>

        {/* Reset Button */}
        <Pressable 
          style={[styles.resetButton, { backgroundColor: themeColors.card }]}
          onPress={() => {
            Alert.alert(
              'Reset Tasks',
              'Are you sure you want to reset all tasks? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: resetAchievements }
              ]
            );
          }}
        >
          <RotateCcw size={18} color="#FF4444" />
          <Text style={[styles.resetButtonText, { color: "#FF4444" }]}>
            Reset All Tasks
          </Text>
        </Pressable>

        <View style={styles.footer} />
      </ScrollView>

      {/* Achievement Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedAchievement !== null}
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { 
            backgroundColor: themeColors.glass.background,
            borderColor: themeColors.glass.border,
          }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                {selectedAchievement?.icon} {selectedAchievement?.title}
              </Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setSelectedAchievement(null)}
              >
                <X size={24} color={themeColors.subtext} />
              </Pressable>
            </View>
            
            <Text style={[styles.modalDescription, { color: themeColors.subtext }]}>
              {selectedAchievement?.detailedDescription}
            </Text>
            
            {selectedAchievement && (
              <View style={styles.modalProgress}>
                <Text style={[styles.modalProgressTitle, { color: themeColors.text }]}>
                  Progress
                </Text>
                {renderProgressBar(selectedAchievement)}
              </View>
            )}
            
            <Pressable
              style={[styles.modalButton, { backgroundColor: themeColors.primary }]}
              onPress={() => setSelectedAchievement(null)}
            >
              <Text style={styles.modalButtonText}>Got it!</Text>
            </Pressable>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerTitle: {
    ...typography.heading2,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressTitle: {
    ...typography.heading3,
  },
  progressPercentage: {
    ...typography.heading1,
  },
  progressBar: {
    height: 12,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  progressText: {
    ...typography.caption,
    textAlign: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  categorySection: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  categoryTitle: {
    ...typography.heading3,
    marginLeft: spacing.sm,
    flex: 1,
  },
  categoryProgress: {
    ...typography.bodyMedium,
  },
  achievementList: {
    gap: spacing.lg,
  },
  achievementCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 2,
    ...shadows.sm,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  achievementEmoji: {
    fontSize: 28,
    marginRight: spacing.lg,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    ...typography.bodyMedium,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  achievementDescription: {
    ...typography.caption,
    lineHeight: 18,
  },
  completedBadge: {
    fontSize: 24,
    fontWeight: '800',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    borderRadius: borderRadius.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.xs,
  },
  progressBarText: {
    ...typography.captionMedium,
  },
  infoCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoTitle: {
    ...typography.bodyMedium,
    marginBottom: spacing.md,
  },
  infoText: {
    ...typography.caption,
    lineHeight: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  resetButtonText: {
    ...typography.captionMedium,
    marginLeft: spacing.sm,
  },
  footer: {
    height: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    ...shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.heading3,
    flex: 1,
    lineHeight: 26,
  },
  modalCloseButton: {
    padding: spacing.sm,
    marginLeft: spacing.md,
  },
  modalDescription: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  modalProgress: {
    marginBottom: spacing.xl,
  },
  modalProgressTitle: {
    ...typography.bodyMedium,
    marginBottom: spacing.lg,
  },
  modalButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  modalButtonText: {
    color: 'white',
    ...typography.bodyMedium,
  },
});