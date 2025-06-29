import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Modal, Alert } from 'react-native';
import { Trophy, Target, Users, Star, RotateCcw, X, Info } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAchievementStore, Achievement } from '@/stores/achievementStore';
import AchievementPopup from '@/components/AchievementPopup';
import BarBuddyLogo from '@/components/BarBuddyLogo';

export default function AchievementsScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
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
              
              {/* Progress Bar */}
              {renderProgressBar(achievement)}
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
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

        {/* Progress Overview with enhanced styling */}
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

        {/* Info Card with enhanced styling */}
        <View style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.infoTitle, { color: themeColors.text }]}>
            💡 How it works
          </Text>
          <Text style={[styles.infoText, { color: themeColors.subtext }]}>
            Visit this tab at 3:00 AM to log your night's tasks! The popup will appear automatically when you're out and about. Tap on any task to learn how to complete it.
          </Text>
        </View>

        {/* Reset Button with enhanced styling */}
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

      {/* Achievement Detail Modal with glassmorphism */}
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
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  progressPercentage: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 24,
  },
  categorySection: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
    letterSpacing: 0.3,
  },
  categoryProgress: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  achievementList: {
    gap: 16,
  },
  achievementCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  achievementEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  completedBadge: {
    fontSize: 24,
    fontWeight: '800',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 28,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  footer: {
    height: 32,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  modalCloseButton: {
    padding: 8,
    marginLeft: 12,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '500',
  },
  modalProgress: {
    marginBottom: 28,
  },
  modalProgressTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  modalButton: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});