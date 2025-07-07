import React from 'react';
import { StyleSheet, View, Text, Modal, ScrollView, Pressable } from 'react-native';
import { X, Crown, Award, Star, Target, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

interface RankModalProps {
  visible: boolean;
  onClose: () => void;
  currentXP: number;
}

// ✅ FIX: Define rank system with clear thresholds
export const RANK_SYSTEM = [
  {
    id: 1,
    title: 'Newbie',
    subTitle: 'Just getting started',
    minXP: 0,
    maxXP: 99,
    color: '#8E8E93',
    gradient: ['#8E8E93', '#AEAEB2'] as const,
    icon: Target,
    description: 'Welcome to the nightlife! Start tracking your activities to earn XP.',
    perks: ['Access to Daily Tracker', 'Basic profile features'],
  },
  {
    id: 2,
    title: 'Social Drinker',
    subTitle: 'Getting the hang of it',
    minXP: 100,
    maxXP: 299,
    color: '#34C759',
    gradient: ['#34C759', '#52D681'] as const,
    icon: Star,
    description: 'You\'re building good habits! Keep logging your nights out.',
    perks: ['Unlock achievements', 'Friend system access', 'Basic trophies'],
  },
  {
    id: 3,
    title: 'Bar Regular',
    subTitle: 'Know your way around',
    minXP: 300,
    maxXP: 699,
    color: '#007AFF',
    gradient: ['#007AFF', '#40A9FF'] as const,
    icon: Award,
    description: 'You\'re becoming a familiar face at the local bars.',
    perks: ['Advanced tracking', 'Venue hot times', 'Special achievements'],
  },
  {
    id: 4,
    title: 'Night Owl',
    subTitle: 'Out every weekend',
    minXP: 700,
    maxXP: 1499,
    color: '#FF6B35',
    gradient: ['#FF6B35', '#FF8F65'] as const,
    icon: Target,
    description: 'The nightlife is your second home. You know all the best spots.',
    perks: ['Premium features', 'Exclusive venues', 'Bonus XP multipliers'],
  },
  {
    id: 5,
    title: 'Party Legend',
    subTitle: 'The life of the party',
    minXP: 1500,
    maxXP: 2999,
    color: '#AF52DE',
    gradient: ['#AF52DE', '#C77DFF'] as const,
    icon: Crown,
    description: 'You\'re legendary in the scene. Others look up to your expertise.',
    perks: ['VIP status', 'Early access features', 'Leaderboard prominence'],
  },
  {
    id: 6,
    title: 'Nightlife Master',
    subTitle: 'The ultimate veteran',
    minXP: 3000,
    maxXP: Infinity,
    color: '#FFD60A',
    gradient: ['#FFD60A', '#FFED4A'] as const,
    icon: Crown,
    description: 'You\'ve mastered the art of nightlife. You are the benchmark.',
    perks: ['Master status', 'All premium features', 'Community recognition', 'Special badges'],
  },
];

export const getRankInfo = (xp: number) => {
  const rank = RANK_SYSTEM.find(rank => xp >= rank.minXP && xp <= rank.maxXP) || RANK_SYSTEM[0];
  const nextRank = RANK_SYSTEM.find(r => r.minXP > xp);
  
  return {
    current: rank,
    next: nextRank,
    progress: nextRank ? 
      ((xp - rank.minXP) / (nextRank.minXP - rank.minXP)) * 100 : 100,
    xpToNext: nextRank ? nextRank.minXP - xp : 0,
  };
};

export default function RankModal({ visible, onClose, currentXP }: RankModalProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const rankInfo = getRankInfo(currentXP);

  const renderRankCard = (rank: typeof RANK_SYSTEM[0], isCurrentRank: boolean, isUnlocked: boolean) => {
    const IconComponent = rank.icon;
    
    return (
      <View
        key={rank.id}
        style={[
          styles.rankCard,
          {
            backgroundColor: isCurrentRank ? rank.color + '20' : themeColors.card,
            borderColor: isCurrentRank ? rank.color : 'rgba(255,255,255,0.1)',
            borderWidth: isCurrentRank ? 2 : 1,
            opacity: isUnlocked ? 1 : 0.6,
          }
        ]}
      >
        {isCurrentRank && (
          <LinearGradient
            colors={rank.gradient}
            style={styles.currentRankOverlay}
          >
            <Text style={styles.currentRankLabel}>CURRENT RANK</Text>
          </LinearGradient>
        )}
        
        <View style={styles.rankHeader}>
          <View style={[
            styles.rankIconContainer,
            { backgroundColor: rank.color + '20' }
          ]}>
            <IconComponent size={24} color={rank.color} />
          </View>
          
          <View style={styles.rankTitleContainer}>
            <Text style={[
              styles.rankTitle,
              { 
                color: isCurrentRank ? rank.color : themeColors.text,
                fontWeight: isCurrentRank ? '800' : '700'
              }
            ]}>
              {rank.title}
            </Text>
            <Text style={[styles.rankSubtitle, { color: themeColors.subtext }]}>
              {rank.subTitle}
            </Text>
          </View>
          
          <View style={styles.rankXPContainer}>
            <Text style={[styles.rankXP, { color: rank.color }]}>
              {rank.maxXP === Infinity ? `${rank.minXP}+` : `${rank.minXP}-${rank.maxXP}`}
            </Text>
            <Text style={[styles.rankXPLabel, { color: themeColors.subtext }]}>
              XP
            </Text>
          </View>
        </View>
        
        <Text style={[styles.rankDescription, { color: themeColors.subtext }]}>
          {rank.description}
        </Text>
        
        <View style={styles.perksContainer}>
          <Text style={[styles.perksTitle, { color: themeColors.text }]}>
            Perks:
          </Text>
          {rank.perks.map((perk, index) => (
            <Text key={index} style={[styles.perkItem, { color: themeColors.subtext }]}>
              • {perk}
            </Text>
          ))}
        </View>
        
        {isCurrentRank && rankInfo.next && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: themeColors.text }]}>
                Progress to {rankInfo.next.title}
              </Text>
              <Text style={[styles.progressXP, { color: rank.color }]}>
                {rankInfo.xpToNext} XP to go
              </Text>
            </View>
            
            <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <LinearGradient
                colors={rank.gradient}
                style={[
                  styles.progressFill,
                  { width: `${Math.min(rankInfo.progress, 100)}%` }
                ]}
              />
            </View>
            
            <Text style={[styles.progressPercentage, { color: rank.color }]}>
              {Math.round(rankInfo.progress)}% Complete
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Crown size={24} color={rankInfo.current.color} />
              <Text style={[styles.title, { color: themeColors.text }]}>
                Rank System
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color={themeColors.text} />
            </Pressable>
          </View>

          {/* Current Status */}
          <View style={[styles.statusCard, { backgroundColor: themeColors.card }]}>
            <LinearGradient
              colors={rankInfo.current.gradient}
              style={styles.statusGradient}
            >
              <View style={styles.statusContent}>
                <View style={styles.statusIcon}>
                  <rankInfo.current.icon size={32} color="white" />
                </View>
                <View style={styles.statusText}>
                  <Text style={styles.statusRank}>
                    {rankInfo.current.title}
                  </Text>
                  <Text style={styles.statusXP}>
                    {currentXP} XP
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Rank List */}
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              All Ranks
            </Text>
            
            {RANK_SYSTEM.map((rank) => {
              const isCurrentRank = rankInfo.current.id === rank.id;
              const isUnlocked = currentXP >= rank.minXP;
              
              return renderRankCard(rank, isCurrentRank, isUnlocked);
            })}
            
            <View style={styles.footer}>
              <View style={[styles.tipCard, { backgroundColor: themeColors.card }]}>
                <Zap size={20} color={rankInfo.current.color} />
                <Text style={[styles.tipText, { color: themeColors.text }]}>
                  Keep using the Daily Tracker, visiting new bars, and completing achievements to earn more XP!
                </Text>
              </View>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  
  closeButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  statusCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  statusGradient: {
    padding: 20,
  },
  
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  
  statusText: {
    flex: 1,
  },
  
  statusRank: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  
  statusXP: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  
  scrollView: {
    flex: 1,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  
  rankCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  
  currentRankOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 16,
  },
  
  currentRankLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  rankIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  rankTitleContainer: {
    flex: 1,
  },
  
  rankTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  
  rankSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  rankXPContainer: {
    alignItems: 'flex-end',
  },
  
  rankXP: {
    fontSize: 16,
    fontWeight: '700',
  },
  
  rankXPLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  rankDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  
  perksContainer: {
    marginBottom: 16,
  },
  
  perksTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  
  perkItem: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  
  progressContainer: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  progressXP: {
    fontSize: 12,
    fontWeight: '700',
  },
  
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  footer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
});