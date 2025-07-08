import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { X, Star, Crown, Trophy } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { LinearGradient } from 'expo-linear-gradient';

interface RankLevel {
  title: string;
  minXP: number;
  maxXP: number;
  color: string;
  gradientColors: [string, string];
  description: string;
  icon: string;
}

const RANK_LEVELS: RankLevel[] = [
  { 
    title: 'Newcomer', 
    minXP: 0, 
    maxXP: 499, 
    color: '#8B8B8B', 
    gradientColors: ['#8B8B8B', '#A0A0A0'] as [string, string],
    description: 'Just getting started on your bar journey',
    icon: '🌟'
  },
  { 
    title: 'Regular', 
    minXP: 500, 
    maxXP: 1499, 
    color: '#4A90E2', 
    gradientColors: ['#4A90E2', '#5BA0F2'] as [string, string],
    description: 'Finding your rhythm in the nightlife scene',
    icon: '🍺'
  },
  { 
    title: 'Bar Explorer', 
    minXP: 1500, 
    maxXP: 2999, 
    color: '#FF6A00', 
    gradientColors: ['#FF6A00', '#FF8533'] as [string, string],
    description: 'Discovering new places and experiences',
    icon: '🗺️'
  },
  { 
    title: 'Nightlife Pro', 
    minXP: 3000, 
    maxXP: 4999, 
    color: '#7B68EE', 
    gradientColors: ['#7B68EE', '#9B88FF'] as [string, string],
    description: 'You know the scene like the back of your hand',
    icon: '🎯'
  },
  { 
    title: 'Bar Legend', 
    minXP: 5000, 
    maxXP: 9999, 
    color: '#FFD700', 
    gradientColors: ['#FFD700', '#FFED4A'] as [string, string],
    description: 'A respected veteran of the bar scene',
    icon: '👑'
  },
  { 
    title: 'Master of the Night', 
    minXP: 10000, 
    maxXP: Infinity, 
    color: '#FF1493', 
    gradientColors: ['#FF1493', '#FF69B4'] as [string, string],
    description: 'The ultimate bar buddy - legendary status',
    icon: '🏆'
  }
];

interface RankModalProps {
  visible: boolean;
  onClose: () => void;
  currentXP: number;
}

export default function RankModal({ visible, onClose, currentXP }: RankModalProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const getCurrentRank = () => {
    return RANK_LEVELS.find(rank => currentXP >= rank.minXP && currentXP <= rank.maxXP) || RANK_LEVELS[0];
  };

  const getNextRank = () => {
    const currentRankIndex = RANK_LEVELS.findIndex(rank => currentXP >= rank.minXP && currentXP <= rank.maxXP);
    return currentRankIndex < RANK_LEVELS.length - 1 ? RANK_LEVELS[currentRankIndex + 1] : null;
  };

  const getProgressToNextRank = () => {
    const nextRank = getNextRank();
    if (!nextRank) return 100;
    
    const currentRank = getCurrentRank();
    const progress = ((currentXP - currentRank.minXP) / (nextRank.minXP - currentRank.minXP)) * 100;
    return Math.min(progress, 100);
  };

  const currentRank = getCurrentRank();
  const nextRank = getNextRank();
  const progressPercent = getProgressToNextRank();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
            <Text style={[styles.title, { color: themeColors.text }]}>Ranking System</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={themeColors.subtext} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Current Rank Section */}
            <View style={styles.currentRankSection}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Your Current Rank
              </Text>
              
              <LinearGradient
                colors={currentRank.gradientColors}
                style={styles.currentRankCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.currentRankIcon}>{currentRank.icon}</Text>
                <Text style={styles.currentRankTitle}>{currentRank.title}</Text>
                <Text style={styles.currentRankXP}>{currentXP.toLocaleString()} XP</Text>
                <Text style={styles.currentRankDescription}>{currentRank.description}</Text>
              </LinearGradient>

              {/* Progress to Next Rank */}
              {nextRank && (
                <View style={[styles.progressSection, { backgroundColor: themeColors.card }]}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressTitle, { color: themeColors.text }]}>
                      Progress to {nextRank.title}
                    </Text>
                    <Text style={[styles.progressPercent, { color: themeColors.primary }]}>
                      {Math.round(progressPercent)}%
                    </Text>
                  </View>
                  
                  <View style={[styles.progressBarContainer, { backgroundColor: themeColors.border }]}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { 
                          backgroundColor: nextRank.color,
                          width: `${progressPercent}%`
                        }
                      ]} 
                    />
                  </View>
                  
                  <Text style={[styles.progressText, { color: themeColors.subtext }]}>
                    {(nextRank.minXP - currentXP).toLocaleString()} XP to go
                  </Text>
                </View>
              )}
            </View>

            {/* All Ranks Section */}
            <View style={styles.allRanksSection}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                All Rank Levels
              </Text>
              
              {RANK_LEVELS.map((rank, index) => {
                const isUnlocked = currentXP >= rank.minXP;
                const isCurrent = currentRank.title === rank.title;
                
                return (
                  <View 
                    key={rank.title} 
                    style={[
                      styles.rankItem,
                      { 
                        backgroundColor: themeColors.card,
                        borderColor: isCurrent ? rank.color : themeColors.border,
                        borderWidth: isCurrent ? 2 : 1,
                        opacity: isUnlocked ? 1 : 0.6
                      }
                    ]}
                  >
                    <View style={styles.rankItemLeft}>
                      <Text style={[
                        styles.rankIcon,
                        { opacity: isUnlocked ? 1 : 0.4 }
                      ]}>
                        {rank.icon}
                      </Text>
                      <View style={styles.rankInfo}>
                        <View style={styles.rankTitleRow}>
                          <Text style={[
                            styles.rankTitle,
                            { 
                              color: isUnlocked ? rank.color : themeColors.subtext,
                              fontWeight: isCurrent ? '800' : '600'
                            }
                          ]}>
                            {rank.title}
                          </Text>
                          {isCurrent && (
                            <View style={[styles.currentBadge, { backgroundColor: rank.color }]}>
                              <Text style={styles.currentBadgeText}>CURRENT</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.rankRange, { color: themeColors.subtext }]}>
                          {rank.maxXP === Infinity 
                            ? `${rank.minXP.toLocaleString()}+ XP` 
                            : `${rank.minXP.toLocaleString()} - ${rank.maxXP.toLocaleString()} XP`
                          }
                        </Text>
                        <Text style={[styles.rankDescription, { color: themeColors.text }]}>
                          {rank.description}
                        </Text>
                      </View>
                    </View>
                    
                    {isUnlocked && (
                      <Trophy size={20} color={rank.color} />
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  currentRankSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  currentRankCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  currentRankIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  currentRankTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  currentRankXP: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  currentRankDescription: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  progressSection: {
    padding: 16,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  allRanksSection: {
    padding: 20,
    paddingTop: 0,
  },
  rankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  rankItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  rankInfo: {
    flex: 1,
  },
  rankTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rankTitle: {
    fontSize: 18,
    marginRight: 8,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  rankRange: {
    fontSize: 14,
    marginBottom: 4,
  },
  rankDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});