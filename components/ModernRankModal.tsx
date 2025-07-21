import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { X, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

const { width: screenWidth } = Dimensions.get('window');

interface RankModalProps {
  visible: boolean;
  onClose: () => void;
  userXP: number;
}

// Modern rank system definitions
const RANK_SYSTEM = [
  {
    name: 'Sober Star',
    subRanks: [
      { level: 'I', xpRequired: 0 },
      { level: 'II', xpRequired: 250 },
      { level: 'III', xpRequired: 500 },
      { level: 'IV', xpRequired: 750 },
    ],
    color: '#9CA3AF',
    gradientColors: ['#9CA3AF', '#B3B9C4'],
    icon: '⭐',
    description: 'Just starting your nightlife journey',
  },
  {
    name: 'Tipsy Talent',
    subRanks: [
      { level: 'I', xpRequired: 1000 },
      { level: 'II', xpRequired: 1500 },
      { level: 'III', xpRequired: 2000 },
      { level: 'IV', xpRequired: 2500 },
    ],
    color: '#60A5FA',
    gradientColors: ['#60A5FA', '#7FB6FF'],
    icon: '🌟',
    description: 'Finding your rhythm in the scene',
  },
  {
    name: 'Buzzed Beginner',
    subRanks: [
      { level: 'I', xpRequired: 3000 },
      { level: 'II', xpRequired: 3750 },
      { level: 'III', xpRequired: 4500 },
      { level: 'IV', xpRequired: 5250 },
    ],
    color: '#34D399',
    gradientColors: ['#34D399', '#4ADE80'],
    icon: '✨',
    description: 'Getting comfortable with the nightlife',
  },
  {
    name: 'Drunk Dynamo',
    subRanks: [
      { level: 'I', xpRequired: 6000 },
      { level: 'II', xpRequired: 7500 },
      { level: 'III', xpRequired: 9000 },
      { level: 'IV', xpRequired: 10500 },
    ],
    color: '#F59E0B',
    gradientColors: ['#F59E0B', '#FBBF24'],
    icon: '🔥',
    description: 'A force to be reckoned with',
  },
  {
    name: 'Wasted Warrior',
    subRanks: [
      { level: 'I', xpRequired: 12000 },
      { level: 'II', xpRequired: 15000 },
      { level: 'III', xpRequired: 18000 },
      { level: 'IV', xpRequired: 21000 },
    ],
    color: '#EF4444',
    gradientColors: ['#EF4444', '#F87171'],
    icon: '⚡',
    description: 'Legendary nightlife warrior',
  },
  {
    name: 'Blackout Baron',
    subRanks: [
      { level: 'I', xpRequired: 24000 },
      { level: 'II', xpRequired: 30000 },
      { level: 'III', xpRequired: 36000 },
      { level: 'IV', xpRequired: 42000 },
    ],
    color: '#8B5CF6',
    gradientColors: ['#8B5CF6', '#A78BFA'],
    icon: '👑',
    description: 'The ultimate nightlife royalty',
  },
];

const RankModal: React.FC<RankModalProps> = ({ visible, onClose, userXP = 0 }) => {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  // Find current rank
  const getCurrentRank = () => {
    let currentRank = RANK_SYSTEM[0];
    let currentSubRank = currentRank.subRanks[0];

    for (const rank of RANK_SYSTEM) {
      for (const subRank of rank.subRanks) {
        if (userXP >= subRank.xpRequired) {
          currentRank = rank;
          currentSubRank = subRank;
        }
      }
    }

    return { rank: currentRank, subRank: currentSubRank };
  };

  const { rank: currentRank, subRank: currentSubRank } = getCurrentRank();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: '#000000' }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Ranking System
            </Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color={themeColors.text} />
            </Pressable>
          </View>

          {/* Current Rank Hero */}
          <LinearGradient
            colors={currentRank.gradientColors}
            style={styles.currentRankCard}
          >
            <View style={styles.glassOverlay}>
              <View style={styles.currentRankHeader}>
                <Text style={styles.currentRankIcon}>{currentRank.icon}</Text>
                <View style={styles.currentRankBadge}>
                  <Text style={styles.currentRankBadgeText}>CURRENT</Text>
                </View>
              </View>
              
              <Text style={styles.currentRankName}>
                {currentRank.name} {currentSubRank.level}
              </Text>
              
              <Text style={styles.currentRankXP}>
                {userXP.toLocaleString()} XP
              </Text>
              
              <Text style={styles.currentRankDescription}>
                {currentRank.description}
              </Text>
            </View>
          </LinearGradient>

          {/* All Ranks List */}
          <ScrollView 
            style={styles.ranksList}
            showsVerticalScrollIndicator={false}
          >
            {RANK_SYSTEM.map((rank, rankIndex) => (
              <View key={rank.name} style={styles.rankSection}>
                <LinearGradient
                  colors={[
                    rank === currentRank 
                      ? 'rgba(255, 107, 53, 0.15)' 
                      : 'rgba(255, 255, 255, 0.05)', 
                    'rgba(255, 255, 255, 0.02)'
                  ]}
                  style={[
                    styles.rankCard,
                    rank === currentRank && styles.activeRankCard
                  ]}
                >
                  <View style={styles.glassOverlay}>
                    <View style={styles.rankHeader}>
                      <Text style={styles.rankIcon}>{rank.icon}</Text>
                      <Text style={[styles.rankName, { color: themeColors.text }]}>
                        {rank.name}
                      </Text>
                      {rank === currentRank && (
                        <View style={[styles.activeBadge, { backgroundColor: themeColors.primary }]}>
                          <Star size={12} color="white" />
                        </View>
                      )}
                    </View>

                    <Text style={[styles.rankDescription, { color: themeColors.subtext }]}>
                      {rank.description}
                    </Text>

                    {/* Sub-ranks */}
                    <View style={styles.subRanksContainer}>
                      {rank.subRanks.map((subRank, subIndex) => {
                        const isCurrentSubRank = rank === currentRank && 
                          subRank.level === currentSubRank.level;
                        const isUnlocked = userXP >= subRank.xpRequired;
                        const isNext = userXP < subRank.xpRequired && 
                          (subIndex === 0 || userXP >= rank.subRanks[subIndex - 1]?.xpRequired);

                        return (
                          <View
                            key={subRank.level}
                            style={[
                              styles.subRankItem,
                              {
                                backgroundColor: isCurrentSubRank 
                                  ? `${themeColors.primary}20`
                                  : 'rgba(255, 255, 255, 0.05)',
                                borderColor: isCurrentSubRank 
                                  ? themeColors.primary
                                  : 'rgba(255, 255, 255, 0.1)',
                              }
                            ]}
                          >
                            <View style={styles.subRankLeft}>
                              <Text style={[
                                styles.subRankLevel, 
                                { 
                                  color: isCurrentSubRank 
                                    ? themeColors.primary 
                                    : themeColors.text,
                                  fontWeight: isCurrentSubRank ? '700' : '600'
                                }
                              ]}>
                                {rank.name} {subRank.level}
                              </Text>
                              <Text style={[styles.subRankXP, { color: themeColors.subtext }]}>
                                {subRank.xpRequired.toLocaleString()} XP required
                              </Text>
                            </View>

                            <View style={styles.subRankRight}>
                              {isCurrentSubRank && (
                                <View style={[styles.currentBadge, { backgroundColor: themeColors.primary }]}>
                                  <Text style={styles.currentBadgeText}>CURRENT</Text>
                                </View>
                              )}
                              {isNext && !isUnlocked && (
                                <View style={[styles.nextBadge, { borderColor: themeColors.primary }]}>
                                  <Text style={[styles.nextBadgeText, { color: themeColors.primary }]}>
                                    NEXT
                                  </Text>
                                </View>
                              )}
                              {!isUnlocked && !isNext && (
                                <View style={[styles.lockedBadge, { borderColor: themeColors.subtext }]}>
                                  <Text style={[styles.lockedBadgeText, { color: themeColors.subtext }]}>
                                    LOCKED
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </LinearGradient>
              </View>
            ))}

            {/* Footer spacing */}
            <View style={styles.footer} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentRankCard: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  glassOverlay: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
  },
  currentRankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentRankIcon: {
    fontSize: 32,
  },
  currentRankBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  currentRankBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  currentRankName: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 8,
  },
  currentRankXP: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  currentRankDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  ranksList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  rankSection: {
    marginBottom: 16,
  },
  rankCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  activeRankCard: {
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  rankName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankDescription: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
    marginBottom: 16,
  },
  subRanksContainer: {
    gap: 8,
  },
  subRankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  subRankLeft: {
    flex: 1,
  },
  subRankLevel: {
    fontSize: 16,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subRankXP: {
    fontSize: 13,
    fontWeight: '500',
  },
  subRankRight: {
    alignItems: 'flex-end',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  nextBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  nextBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  lockedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  footer: {
    height: 40,
  },
});

export default RankModal;