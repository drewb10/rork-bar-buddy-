import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable } from 'react-native';
import { Trophy, Target, Users, Star, RotateCcw } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAchievementStore, Achievement } from '@/stores/achievementStore';
import AchievementPopup from '@/components/AchievementPopup';
import BarBuddyLogo from '@/components/BarBuddyLogo';

export default function TrackingScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { 
    achievements, 
    canShowPopup, 
    initializeAchievements, 
    getCompletedCount, 
    getAchievementsByCategory,
    resetAchievements 
  } = useAchievementStore();
  
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    initializeAchievements();
    
    // Check if we should show the popup when the screen loads
    if (canShowPopup()) {
      setShowPopup(true);
    }
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
        
        <View style={styles.achievementGrid}>
          {categoryAchievements.map((achievement) => (
            <View
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
                  opacity: achievement.completed ? 1 : 0.6,
                }
              ]}
            >
              <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
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
              {achievement.completed && (
                <Text style={[styles.completedBadge, { color: themeColors.primary }]}>
                  ✓
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
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
            Achievement Tracking
          </Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.subtext }]}>
            Complete achievements during your nights out!
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
            {completedCount} of {totalCount} achievements completed
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
            Visit this tab at 3:00 AM to log your night's achievements! The popup will appear automatically when you're out and about.
          </Text>
        </View>

        {/* Reset Button */}
        <Pressable 
          style={[styles.resetButton, { backgroundColor: themeColors.card }]}
          onPress={() => {
            resetAchievements();
          }}
        >
          <RotateCcw size={18} color="#FF4444" />
          <Text style={[styles.resetButtonText, { color: "#FF4444" }]}>
            Reset All Achievements
          </Text>
        </Pressable>

        <View style={styles.footer} />
      </ScrollView>

      {/* Achievement Popup */}
      <AchievementPopup
        visible={showPopup}
        onClose={() => setShowPopup(false)}
      />
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
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressCard: {
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 20,
  },
  categorySection: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  categoryProgress: {
    fontSize: 16,
    fontWeight: '600',
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
    minHeight: 80,
  },
  achievementEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  completedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  footer: {
    height: 24,
  },
});