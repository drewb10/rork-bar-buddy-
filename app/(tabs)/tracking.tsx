import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Modal, Alert } from 'react-native';
import { Trophy, Target, Users, Star, RotateCcw, X, Info, BarChart3, Camera } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAchievementStore, Achievement } from '@/stores/achievementStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useDailyTrackerStore } from '@/stores/dailyTrackerStore';
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
    resetAchievements,
    getCurrentLevelAchievements
  } = useAchievementStore();
  
  const { profile } = useUserProfileStore();
  const { totalStats } = useDailyTrackerStore();
  
  const [showPopup, setShowPopup] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    initializeAchievements();
    
    if (canShowPopup()) {
      setShowPopup(true);
    }
  }, []);

  const currentLevelAchievements = getCurrentLevelAchievements();
  const completedCount = getCompletedCount();

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
        <Text style={[styles.progressText, { color: themeColors.subtext }]}>
          {achievement.maxProgress 
            ? `${achievement.progress || 0}/${achievement.maxProgress}`
            : achievement.completed ? 'Complete' : 'Not started'
          }
        </Text>
      </View>
    );
  };

  const renderAchievementCategory = (category: Achievement['category']) => {
    const categoryAchievements = currentLevelAchievements.filter(a => a.category === category);
    if (categoryAchievements.length === 0) return null;

    return (
      <View key={category} style={[styles.categorySection, { backgroundColor: themeColors.card }]}>
        <View style={styles.categoryHeader}>
          {getCategoryIcon(category)}
          <Text style={[styles.categoryTitle, { color: themeColors.text }]}>
            {getCategoryTitle(category)}
          </Text>
          <Text style={[styles.categoryProgress, { color: themeColors.primary }]}>
            In Progress
          </Text>
        </View>
        
        <View style={styles.achievementList}>
          {categoryAchievements.map((achievement) => (
            <Pressable
              key={achievement.id}
              style={[
                styles.achievementCard,
                { 
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                }
              ]}
              onPress={() => handleAchievementPress(achievement)}
            >
              <View style={styles.achievementHeader}>
                <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
                <View style={styles.achievementInfo}>
                  <Text 
                    style={[styles.achievementName, { color: themeColors.text }]}
                    numberOfLines={2}
                  >
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDescription, { color: themeColors.subtext }]}>
                    {achievement.description}
                  </Text>
                  {achievement.level > 1 && (
                    <Text style={[styles.levelIndicator, { color: themeColors.primary }]}>
                      Level {achievement.level}
                    </Text>
                  )}
                </View>
              </View>
              
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
        <View style={styles.header}>
          <BarBuddyLogo size="small" />
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Achievement Tracking
          </Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.subtext }]}>
            Complete achievements during your nights out!
          </Text>
        </View>

        <View style={[styles.progressCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: themeColors.text }]}>
              Achievements Earned
            </Text>
            <Text style={[styles.progressPercentage, { color: themeColors.primary }]}>
              {completedCount}
            </Text>
          </View>
          
          <Text style={[styles.progressText, { color: themeColors.subtext }]}>
            {completedCount} achievements completed
          </Text>
        </View>

        <View style={[styles.dailyTrackerCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.dailyTrackerHeader}>
            <BarChart3 size={20} color={themeColors.primary} />
            <Text style={[styles.dailyTrackerTitle, { color: themeColors.text }]}>
              Total Tracker Stats
            </Text>
          </View>
          
          <View style={styles.trackerStatsGrid}>
            <View style={styles.trackerStatItem}>
              <Text style={[styles.trackerStatNumber, { color: themeColors.text }]}>
                {totalStats.shots}
              </Text>
              <Text style={[styles.trackerStatLabel, { color: themeColors.subtext }]}>
                🥃 Shots
              </Text>
            </View>
            
            <View style={styles.trackerStatItem}>
              <Text style={[styles.trackerStatNumber, { color: themeColors.text }]}>
                {totalStats.scoopAndScores}
              </Text>
              <Text style={[styles.trackerStatLabel, { color: themeColors.subtext }]}>
                🍺 Scoop & Scores
              </Text>
            </View>
            
            <View style={styles.trackerStatItem}>
              <Text style={[styles.trackerStatNumber, { color: themeColors.text }]}>
                {totalStats.beers}
              </Text>
              <Text style={[styles.trackerStatLabel, { color: themeColors.subtext }]}>
                🍻 Beers
              </Text>
            </View>
            
            <View style={styles.trackerStatItem}>
              <Text style={[styles.trackerStatNumber, { color: themeColors.text }]}>
                {totalStats.beerTowers}
              </Text>
              <Text style={[styles.trackerStatLabel, { color: themeColors.subtext }]}>
                🗼 Beer Towers
              </Text>
            </View>
            
            <View style={styles.trackerStatItem}>
              <Text style={[styles.trackerStatNumber, { color: themeColors.text }]}>
                {totalStats.funnels}
              </Text>
              <Text style={[styles.trackerStatLabel, { color: themeColors.subtext }]}>
                🌪️ Funnels
              </Text>
            </View>
            
            <View style={styles.trackerStatItem}>
              <Text style={[styles.trackerStatNumber, { color: themeColors.text }]}>
                {totalStats.shotguns}
              </Text>
              <Text style={[styles.trackerStatLabel, { color: themeColors.subtext }]}>
                💥 Shotguns
              </Text>
            </View>
          </View>
          
          <View style={styles.photoStatContainer}>
            <Camera size={16} color={themeColors.primary} />
            <Text style={[styles.photoStatText, { color: themeColors.text }]}>
              📸 Photos Taken: {profile.photosTaken}
            </Text>
          </View>
        </View>

        <View style={styles.categoriesContainer}>
          {(['bars', 'activities', 'social', 'milestones'] as const).map(renderAchievementCategory)}
        </View>

        <View style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.infoTitle, { color: themeColors.text }]}>
            💡 How it works
          </Text>
          <Text style={[styles.infoText, { color: themeColors.subtext }]}>
            Complete achievements to unlock trophies! Each achievement has multiple levels - complete one level to unlock the next. Visit the Trophies tab to see your earned achievements.
          </Text>
        </View>

        <Pressable 
          style={[styles.resetButton, { backgroundColor: themeColors.card }]}
          onPress={() => {
            Alert.alert(
              'Reset Achievements',
              'Are you sure you want to reset all achievements? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: resetAchievements }
              ]
            );
          }}
        >
          <RotateCcw size={18} color="#FF4444" />
          <Text style={[styles.resetButtonText, { color: "#FF4444" }]}>
            Reset All Achievements
          </Text>
        </Pressable>

        <View style={styles.footer} />
      </ScrollView>

      <AchievementPopup
        visible={showPopup}
        onClose={() => setShowPopup(false)}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedAchievement !== null}
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
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
            
            {selectedAchievement && selectedAchievement.level > 1 && (
              <Text style={[styles.modalLevelInfo, { color: themeColors.primary }]}>
                This is Level {selectedAchievement.level} of {selectedAchievement.maxLevel}
              </Text>
            )}
            
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
    marginBottom: 16,
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
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  dailyTrackerCard: {
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
  dailyTrackerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dailyTrackerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  trackerStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  trackerStatItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackerStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  trackerStatLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  photoStatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  photoStatText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  achievementList: {
    gap: 12,
  },
  achievementCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  achievementEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  levelIndicator: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
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
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    lineHeight: 26,
  },
  modalCloseButton: {
    padding: 4,
    marginLeft: 12,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  modalLevelInfo: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalProgress: {
    marginBottom: 24,
  },
  modalProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});