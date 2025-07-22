import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Modal, Alert } from 'react-native';
import { Trophy, Target, Users, Star, CheckCircle2, Circle, Clock, Zap, Calendar, Construction } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAchievementStore, Achievement } from '@/stores/achievementStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import { MVP_CONFIG } from '@/constants/mvp-config';

const CATEGORY_CONFIG = {
  bars: {
    label: 'Bar Hopping',
    icon: Target,
    color: '#FF6B35',
    gradient: ['#FF6B35', '#FF8F65'] as const,
    bgColor: 'rgba(255, 107, 53, 0.1)',
  },
  activities: {
    label: 'Activities',
    icon: Trophy,
    color: '#007AFF',
    gradient: ['#007AFF', '#40A9FF'] as const,
    bgColor: 'rgba(0, 122, 255, 0.1)',
  },
  social: {
    label: 'Social',
    icon: Users,
    color: '#34C759',
    gradient: ['#34C759', '#52D681'] as const,
    bgColor: 'rgba(52, 199, 89, 0.1)',
  },
  milestones: {
    label: 'Milestones',
    icon: Star,
    color: '#AF52DE',
    gradient: ['#AF52DE', '#C77DFF'] as const,
    bgColor: 'rgba(175, 82, 222, 0.1)',
  },
};

export default function AchievementsScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  
  // MVP: Tasks system is disabled, show coming soon message
  if (!MVP_CONFIG.ENABLE_TASKS) {
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
              Tasks & Achievements
            </Text>
          </View>

          {/* Coming Soon Card */}
          <View style={[styles.comingSoonCard, { backgroundColor: themeColors.card }]}>
            <Construction size={48} color={themeColors.primary} />
            <Text style={[styles.comingSoonTitle, { color: themeColors.text }]}>
              Coming Soon!
            </Text>
            <Text style={[styles.comingSoonDescription, { color: themeColors.subtext }]}>
              Tasks and achievements are being prepared for launch. Focus on discovering bars and using the like system for now!
            </Text>
            <View style={[styles.featureList, { borderColor: themeColors.border }]}>
              <Text style={[styles.featureTitle, { color: themeColors.text }]}>Coming Features:</Text>
              <Text style={[styles.featureItem, { color: themeColors.subtext }]}>• Bar hopping challenges</Text>
              <Text style={[styles.featureItem, { color: themeColors.subtext }]}>• Social achievements</Text>
              <Text style={[styles.featureItem, { color: themeColors.subtext }]}>• Activity tracking</Text>
              <Text style={[styles.featureItem, { color: themeColors.subtext }]}>• XP rewards system</Text>
            </View>
          </View>

          <View style={styles.footer} />
        </ScrollView>
      </View>
    );
  }

  // Original achievements code preserved but unreachable in MVP
  const { 
    achievements, 
    initializeAchievements, 
    getCompletedCount, 
    getAchievementsByCategory,
  } = useAchievementStore();
  
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    initializeAchievements();
  }, []);

  const completedCount = getCompletedCount();
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredAchievements = achievements.filter(achievement => {
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
      return false;
    }
    if (!showCompleted && achievement.completed) {
      return false;
    }
    return true;
  });

  const pendingTasks = achievements.filter(task => !task.completed);
  const completedTasks = achievements.filter(task => task.completed);

  const handleAchievementPress = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
  };

  const getProgressPercentage = (achievement: Achievement) => {
    if (!achievement.maxProgress) return achievement.completed ? 100 : 0;
    return Math.round(((achievement.progress || 0) / achievement.maxProgress) * 100);
  };

  const renderStatsHeader = () => (
    <View style={styles.statsContainer}>
      <LinearGradient
        colors={['#1C1C1E', '#2C2C2E'] as const}
        style={styles.statsCard}
      >
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{pendingTasks.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF6B35' }]}>{completionPercentage}%</Text>
          <Text style={styles.statLabel}>Progress</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersSection}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}
      >
        <Pressable
          style={[
            styles.filterChip,
            {
              backgroundColor: selectedCategory === 'all' ? '#FF6B35' : 'rgba(255,255,255,0.05)',
              borderColor: selectedCategory === 'all' ? '#FF6B35' : 'rgba(255,255,255,0.1)',
            }
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.filterText,
            { color: selectedCategory === 'all' ? 'white' : '#8E8E93' }
          ]}>
            All ({achievements.length})
          </Text>
        </Pressable>

        {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
          const IconComponent = config.icon;
          const isActive = selectedCategory === category;
          const categoryTasks = achievements.filter(task => task.category === category);
          
          return (
            <Pressable
              key={category}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? config.color : 'rgba(255,255,255,0.05)',
                  borderColor: isActive ? config.color : 'rgba(255,255,255,0.1)',
                }
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <IconComponent 
                size={14} 
                color={isActive ? 'white' : '#8E8E93'} 
              />
              <Text style={[
                styles.filterText,
                { color: isActive ? 'white' : '#8E8E93' }
              ]}>
                {config.label} ({categoryTasks.length})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Show Completed Toggle */}
      <Pressable
        style={[
          styles.toggleChip,
          {
            backgroundColor: showCompleted ? '#34C759' : 'rgba(255,255,255,0.05)',
            borderColor: showCompleted ? '#34C759' : 'rgba(255,255,255,0.1)',
          }
        ]}
        onPress={() => setShowCompleted(!showCompleted)}
      >
        <CheckCircle2 
          size={14} 
          color={showCompleted ? 'white' : '#8E8E93'} 
        />
        <Text style={[
          styles.filterText,
          { color: showCompleted ? 'white' : '#8E8E93' }
        ]}>
          Completed ({completedTasks.length})
        </Text>
      </Pressable>
    </View>
  );

  const renderProgressBar = (achievement: Achievement) => {
    const percentage = getProgressPercentage(achievement);
    const category = CATEGORY_CONFIG[achievement.category as keyof typeof CATEGORY_CONFIG];
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              {
                backgroundColor: achievement.completed ? category?.color || '#FF6B35' : '#3A3A3C',
                width: `${percentage}%`
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {achievement.maxProgress 
            ? `${achievement.progress || 0}/${achievement.maxProgress}`
            : achievement.completed ? 'Complete' : 'Not started'
          }
        </Text>
      </View>
    );
  };

  const renderTaskCard = (achievement: Achievement) => {
    const category = CATEGORY_CONFIG[achievement.category as keyof typeof CATEGORY_CONFIG];
    const IconComponent = category?.icon || Trophy;
    
    return (
      <Pressable
        key={achievement.id}
        style={[
          styles.taskCard,
          {
            opacity: achievement.completed ? 0.7 : 1,
            borderLeftColor: category?.color || '#FF6B35',
          }
        ]}
        onPress={() => handleAchievementPress(achievement)}
      >
        {/* Header */}
        <View style={styles.taskHeader}>
          <View style={styles.checkboxContainer}>
            {achievement.completed ? (
              <CheckCircle2 size={24} color={category?.color || '#FF6B35'} />
            ) : (
              <Circle size={24} color="#8E8E93" />
            )}
          </View>

          <View style={styles.taskInfo}>
            <Text style={[
              styles.taskTitle,
              { 
                color: achievement.completed ? '#8E8E93' : 'white',
                textDecorationLine: achievement.completed ? 'line-through' : 'none',
              }
            ]}>
              {achievement.title}
            </Text>
            <Text style={styles.taskDescription}>
              {achievement.description}
            </Text>
          </View>

          <View style={styles.taskMeta}>
            <View style={[
              styles.categoryBadge,
              { backgroundColor: category?.bgColor || 'rgba(255,107,53,0.1)' }
            ]}>
              <IconComponent size={12} color={category?.color || '#FF6B35'} />
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        {renderProgressBar(achievement)}

        {/* Footer */}
        <View style={styles.taskFooter}>
          <View style={styles.taskReward}>
            <Zap size={14} color="#FFD60A" />
            <Text style={styles.rewardText}>+{achievement.xpReward || 100} XP</Text>
          </View>

          <View style={styles.taskDetails}>
            <View style={styles.detailItem}>
              <Clock size={12} color="#8E8E93" />
              <Text style={styles.detailText}>Complete during nights out</Text>
            </View>
          </View>
        </View>
      </Pressable>
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

        {/* Progress Overview */}
        {renderStatsHeader()}

        {/* Filters */}
        {renderFilters()}

        {/* Tasks List */}
        <View style={styles.tasksContainer}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'All Tasks' : CATEGORY_CONFIG[selectedCategory as keyof typeof CATEGORY_CONFIG]?.label || 'Tasks'}
            <Text style={styles.countBadge}> ({filteredAchievements.length})</Text>
          </Text>

          {filteredAchievements.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {showCompleted 
                  ? 'No completed tasks yet' 
                  : 'No pending tasks'
                }
              </Text>
            </View>
          ) : (
            filteredAchievements.map(renderTaskCard)
          )}
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
            backgroundColor: themeColors.glass?.background || themeColors.card,
            borderColor: themeColors.glass?.border || themeColors.border,
          }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                {selectedAchievement?.icon} {selectedAchievement?.title}
              </Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setSelectedAchievement(null)}
              >
                <Text style={[styles.closeButtonText, { color: themeColors.subtext }]}>✕</Text>
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
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
  },
  filtersSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  filtersContent: {
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
    marginBottom: 8,
  },
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  tasksContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  countBadge: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  taskCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 20,
  },
  taskDescription: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  taskMeta: {
    alignItems: 'flex-end',
  },
  categoryBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 60,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskReward: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    color: '#FFD60A',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  taskDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  infoCard: {
    marginHorizontal: 20,
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
  footer: {
    height: 32,
  },
  // MVP Coming Soon Styles
  comingSoonCard: {
    margin: 20,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  comingSoonDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '500',
  },
  featureList: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  featureItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
    fontWeight: '500',
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
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
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