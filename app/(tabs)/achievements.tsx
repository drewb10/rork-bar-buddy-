import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable } from 'react-native';
import { Award, Star, CheckCircle, Circle, Trophy } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAchievementStore, Achievement } from '@/stores/achievementStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import AchievementPopup from '@/components/AchievementPopup';
import * as Haptics from 'expo-haptics';

export default function AchievementsScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { achievements, initializeAchievements, completeAchievement } = useAchievementStore();
  const { profile } = useUserProfileStore();
  const [showAchievementPopup, setShowAchievementPopup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Achievement['category'] | 'all'>('all');

  useEffect(() => {
    initializeAchievements();
  }, []);

  const categories: { key: Achievement['category'] | 'all'; title: string; icon: string }[] = [
    { key: 'all', title: 'All', icon: '🎯' },
    { key: 'bars', title: 'Bar Hopping', icon: '🍻' },
    { key: 'activities', title: 'Activities', icon: '🎮' },
    { key: 'social', title: 'Social', icon: '👥' },
    { key: 'milestones', title: 'Milestones', icon: '🏆' },
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const completedCount = achievements.filter(a => a.completed).length;
  const totalCount = achievements.length;

  const handleQuickComplete = (achievementId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    completeAchievement(achievementId);
  };

  const getProgressText = (achievement: Achievement) => {
    if (achievement.maxProgress && achievement.progress !== undefined) {
      return `${achievement.progress}/${achievement.maxProgress}`;
    }
    return achievement.completed ? 'Completed' : 'Not Started';
  };

  const getProgressPercentage = (achievement: Achievement) => {
    if (achievement.completed) return 100;
    if (achievement.maxProgress && achievement.progress !== undefined) {
      return (achievement.progress / achievement.maxProgress) * 100;
    }
    return 0;
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
            Achievements
          </Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.subtext }]}>
            {completedCount} of {totalCount} completed
          </Text>
        </View>

        {/* Progress Overview */}
        <View style={[styles.progressCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.progressHeader}>
            <Trophy size={24} color={themeColors.primary} />
            <Text style={[styles.progressTitle, { color: themeColors.text }]}>
              Overall Progress
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { backgroundColor: themeColors.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: themeColors.primary,
                    width: `${(completedCount / totalCount) * 100}%`
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: themeColors.subtext }]}>
              {Math.round((completedCount / totalCount) * 100)}%
            </Text>
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilter}
        >
          {categories.map((category) => (
            <Pressable
              key={category.key}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: selectedCategory === category.key 
                    ? themeColors.primary 
                    : themeColors.card,
                  borderColor: selectedCategory === category.key 
                    ? themeColors.primary 
                    : themeColors.border,
                }
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryText,
                {
                  color: selectedCategory === category.key 
                    ? 'white' 
                    : themeColors.text
                }
              ]}>
                {category.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable
            style={[styles.quickActionButton, { backgroundColor: themeColors.primary }]}
            onPress={() => setShowAchievementPopup(true)}
          >
            <Star size={20} color="white" />
            <Text style={styles.quickActionText}>Log Tonight's Activities</Text>
          </Pressable>
        </View>

        {/* Achievement List */}
        <View style={styles.achievementsList}>
          {filteredAchievements.map((achievement) => (
            <View 
              key={achievement.id} 
              style={[
                styles.achievementCard, 
                { 
                  backgroundColor: themeColors.card,
                  borderColor: achievement.completed ? themeColors.primary : themeColors.border,
                  opacity: achievement.completed ? 1 : 0.8,
                }
              ]}
            >
              <View style={styles.achievementHeader}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <View style={styles.achievementInfo}>
                  <Text style={[
                    styles.achievementTitle, 
                    { 
                      color: achievement.completed ? themeColors.primary : themeColors.text 
                    }
                  ]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDescription, { color: themeColors.subtext }]}>
                    {achievement.description}
                  </Text>
                </View>
                <Pressable
                  style={styles.achievementAction}
                  onPress={() => !achievement.completed && handleQuickComplete(achievement.id)}
                  disabled={achievement.completed}
                >
                  {achievement.completed ? (
                    <CheckCircle size={24} color={themeColors.primary} />
                  ) : (
                    <Circle size={24} color={themeColors.subtext} />
                  )}
                </Pressable>
              </View>

              {/* Progress Bar for achievements with progress */}
              {achievement.maxProgress && (
                <View style={styles.achievementProgress}>
                  <View style={[styles.progressBar, { backgroundColor: themeColors.border }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          backgroundColor: achievement.completed ? themeColors.primary : themeColors.accent,
                          width: `${getProgressPercentage(achievement)}%`
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.progressText, { color: themeColors.subtext }]}>
                    {getProgressText(achievement)}
                  </Text>
                </View>
              )}

              {achievement.completed && achievement.completedAt && (
                <Text style={[styles.completedDate, { color: themeColors.subtext }]}>
                  Completed {new Date(achievement.completedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.footer} />
      </ScrollView>

      <AchievementPopup
        visible={showAchievementPopup}
        onClose={() => setShowAchievementPopup(false)}
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
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 20,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  quickActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  achievementsList: {
    paddingHorizontal: 16,
  },
  achievementCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  achievementAction: {
    padding: 4,
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingLeft: 40,
  },
  completedDate: {
    fontSize: 12,
    marginTop: 8,
    paddingLeft: 40,
  },
  footer: {
    height: 24,
  },
});