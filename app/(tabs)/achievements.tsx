import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable } from 'react-native';
import { Award, CheckCircle, Circle, Trophy, Star } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAchievementStore, Achievement } from '@/stores/achievementStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import * as Haptics from 'expo-haptics';

export default function AchievementsScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { achievements, initializeAchievements, completeAchievement, checkAndUpdateMultiLevelAchievements } = useAchievementStore();
  const { profile } = useUserProfileStore();
  const [selectedCategory, setSelectedCategory] = useState<Achievement['category'] | 'all'>('all');

  useEffect(() => {
    initializeAchievements();
  }, []);

  useEffect(() => {
    // Update multi-level achievements when profile stats change
    checkAndUpdateMultiLevelAchievements({
      totalBeers: profile.totalBeers || 0,
      totalShots: profile.totalShots || 0,
      totalBeerTowers: profile.totalBeerTowers || 0,
      totalScoopAndScores: profile.totalScoopAndScores || 0,
      totalFunnels: profile.totalFunnels || 0,
      totalShotguns: profile.totalShotguns || 0,
      totalPoolGamesWon: profile.totalPoolGamesWon || 0,
      totalDartGamesWon: profile.totalDartGamesWon || 0,
      barsHit: profile.barsHit || 0,
      nightsOut: profile.nightsOut || 0,
    });
  }, [
    profile.totalBeers, 
    profile.totalShots, 
    profile.totalBeerTowers,
    profile.totalScoopAndScores,
    profile.totalFunnels,
    profile.totalShotguns,
    profile.totalPoolGamesWon,
    profile.totalDartGamesWon,
    profile.barsHit,
    profile.nightsOut
  ]);

  const categories: { key: Achievement['category'] | 'all'; title: string; icon: string }[] = [
    { key: 'all', title: 'All', icon: '🎯' },
    { key: 'consumption', title: 'Consumption', icon: '🍻' },
    { key: 'bars', title: 'Bar Hopping', icon: '🏪' },
    { key: 'nights', title: 'Nights Out', icon: '🌙' },
    { key: 'games', title: 'Games', icon: '🎮' },
    { key: 'activities', title: 'Activities', icon: '🎪' },
    { key: 'social', title: 'Social', icon: '👥' },
    { key: 'milestones', title: 'Milestones', icon: '🏆' },
    { key: 'special', title: 'Special', icon: '⭐' },
  ];

  // Filter achievements to show only incomplete ones or the current level for multi-level achievements
  const getVisibleAchievements = () => {
    const allAchievements = selectedCategory === 'all' 
      ? achievements 
      : achievements.filter(a => a.category === selectedCategory);

    // For multi-level achievements, only show the current level (incomplete) or next level if current is complete
    const visibleAchievements: Achievement[] = [];
    const processedMultiLevel = new Set<string>();

    allAchievements.forEach(achievement => {
      if (achievement.isMultiLevel) {
        // Create a base key for the multi-level group
        const baseKey = achievement.id.replace(/-\d+$/, '').replace(/-(beginner|starter|rookie|novice|owl|explorer)$/, '');
        
        if (!processedMultiLevel.has(baseKey)) {
          processedMultiLevel.add(baseKey);
          
          // Find all achievements in this multi-level group
          const groupAchievements = allAchievements
            .filter(a => a.isMultiLevel && (
              a.id.includes(baseKey) || 
              (baseKey.includes('beer') && (a.id.includes('beer') || a.id.includes('brew') || a.id.includes('lager') || a.id.includes('ale'))) ||
              (baseKey.includes('shot') && a.id.includes('shot')) ||
              (baseKey.includes('tower') && a.id.includes('tower')) ||
              (baseKey.includes('scoop') && a.id.includes('scoop')) ||
              (baseKey.includes('funnel') && a.id.includes('funnel')) ||
              (baseKey.includes('shotgun') && a.id.includes('shotgun')) ||
              (baseKey.includes('pool') && a.id.includes('pool') && a.category === 'games') ||
              (baseKey.includes('dart') && a.id.includes('dart')) ||
              (baseKey.includes('bar') && a.id.includes('bar-') && a.category === 'bars') ||
              (baseKey.includes('night') && a.category === 'nights')
            ))
            .sort((a, b) => (a.level || 0) - (b.level || 0));

          // Find the current level to show (first incomplete one)
          const currentLevel = groupAchievements.find(a => !a.completed);
          if (currentLevel) {
            visibleAchievements.push(currentLevel);
          } else if (groupAchievements.length > 0) {
            // If all are complete, show the highest level
            visibleAchievements.push(groupAchievements[groupAchievements.length - 1]);
          }
        }
      } else {
        // For non-multi-level achievements, show all
        visibleAchievements.push(achievement);
      }
    });

    return visibleAchievements.sort((a, b) => a.order - b.order);
  };

  const filteredAchievements = getVisibleAchievements();
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

  const getLevelBadge = (achievement: Achievement) => {
    if (!achievement.isMultiLevel || !achievement.level) return null;
    
    return (
      <View style={[styles.levelBadge, { backgroundColor: themeColors.primary }]}>
        <Text style={styles.levelText}>LV {achievement.level}</Text>
      </View>
    );
  };

  const getNextLevelInfo = (achievement: Achievement) => {
    if (!achievement.isMultiLevel || achievement.completed || !achievement.nextLevelId) return null;
    
    const nextLevel = achievements.find(a => a.id === achievement.nextLevelId);
    if (!nextLevel) return null;
    
    return (
      <Text style={[styles.nextLevelText, { color: themeColors.subtext }]}>
        Next: {nextLevel.title} ({nextLevel.maxProgress} total)
      </Text>
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
                <View style={styles.achievementIconContainer}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  {getLevelBadge(achievement)}
                </View>
                <View style={styles.achievementInfo}>
                  <View style={styles.achievementTitleRow}>
                    <Text style={[
                      styles.achievementTitle, 
                      { 
                        color: achievement.completed ? themeColors.primary : themeColors.text 
                      }
                    ]}>
                      {achievement.title}
                    </Text>
                    {achievement.completed && (
                      <Star size={16} color={themeColors.primary} style={styles.completedStar} />
                    )}
                  </View>
                  <Text style={[styles.achievementDescription, { color: themeColors.subtext }]}>
                    {achievement.description}
                  </Text>
                  {getNextLevelInfo(achievement)}
                </View>
                <Pressable
                  style={styles.achievementAction}
                  onPress={() => !achievement.completed && !achievement.maxProgress && handleQuickComplete(achievement.id)}
                  disabled={achievement.completed || !!achievement.maxProgress}
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
  achievementIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  achievementIcon: {
    fontSize: 28,
  },
  levelBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
  },
  levelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  completedStar: {
    marginLeft: 4,
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 2,
  },
  nextLevelText: {
    fontSize: 12,
    fontStyle: 'italic',
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