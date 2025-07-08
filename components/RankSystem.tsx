import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Star, X, Trophy } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

const { width } = Dimensions.get('window');

// Rank definitions with XP thresholds
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
    icon: '⭐',
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
    icon: '🌟',
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
    icon: '✨',
  },
  {
    name: 'Big Chocolate',
    subRanks: [
      { level: 'I', xpRequired: 6000 },
      { level: 'II', xpRequired: 7000 },
      { level: 'III', xpRequired: 8000 },
      { level: 'IV', xpRequired: 9000 },
    ],
    color: '#F59E0B',
    icon: '🍫',
  },
  {
    name: 'Scoop and Score Champ',
    subRanks: [
      { level: 'I', xpRequired: 10000 },
      { level: 'II', xpRequired: 12000 },
      { level: 'III', xpRequired: 15000 },
      { level: 'IV', xpRequired: 20000 },
    ],
    color: '#EF4444',
    icon: '🏆',
  },
];

interface RankSystemProps {
  userXP: number;
  onPress?: () => void;
}

interface RankModalProps {
  visible: boolean;
  userXP: number;
  onClose: () => void;
}

// Helper function to get current rank based on XP
const getCurrentRank = (xp: number) => {
  let currentRank = RANK_SYSTEM[0];
  let currentSubRank = currentRank.subRanks[0];
  
  for (const rank of RANK_SYSTEM) {
    for (const subRank of rank.subRanks) {
      if (xp >= subRank.xpRequired) {
        currentRank = rank;
        currentSubRank = subRank;
      } else {
        break;
      }
    }
  }
  
  return { rank: currentRank, subRank: currentSubRank };
};

// Helper function to get next rank
const getNextRank = (xp: number) => {
  for (const rank of RANK_SYSTEM) {
    for (const subRank of rank.subRanks) {
      if (xp < subRank.xpRequired) {
        return { rank, subRank };
      }
    }
  }
  return null;
};

const RankModal: React.FC<RankModalProps> = ({ visible, userXP, onClose }) => {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { rank: currentRank, subRank: currentSubRank } = getCurrentRank(userXP);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: '#000000' }]}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: themeColors.text }]}>
            Rank System
          </Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color={themeColors.text} />
          </Pressable>
        </View>

        {/* Current Rank Display */}
        <View style={[styles.currentRankCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.currentRankHeader}>
            <Text style={styles.currentRankEmoji}>{currentRank.icon}</Text>
            <View>
              <Text style={[styles.currentRankName, { color: currentRank.color }]}>
                {currentRank.name} {currentSubRank.level}
              </Text>
              <Text style={[styles.currentRankXP, { color: themeColors.subtext }]}>
                {userXP.toLocaleString()} XP
              </Text>
            </View>
          </View>
        </View>

        {/* All Ranks List */}
        <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
          {RANK_SYSTEM.map((rank, rankIndex) => (
            <View key={rank.name} style={[styles.rankSection, { backgroundColor: themeColors.card }]}>
              <View style={styles.rankHeader}>
                <Text style={styles.rankEmoji}>{rank.icon}</Text>
                <Text style={[styles.rankName, { color: rank.color }]}>
                  {rank.name}
                </Text>
              </View>
              
              {rank.subRanks.map((subRank, subIndex) => {
                const isCurrentRank = currentRank.name === rank.name && currentSubRank.level === subRank.level;
                const isUnlocked = userXP >= subRank.xpRequired;
                
                return (
                  <View
                    key={subRank.level}
                    style={[
                      styles.subRankItem,
                      {
                        backgroundColor: isCurrentRank
                          ? rank.color + '20'
                          : isUnlocked
                          ? themeColors.background
                          : 'rgba(255,255,255,0.05)',
                        borderColor: isCurrentRank ? rank.color : 'transparent',
                      }
                    ]}
                  >
                    <View style={styles.subRankLeft}>
                      <Text style={[
                        styles.subRankLevel,
                        {
                          color: isUnlocked ? rank.color : themeColors.subtext,
                          fontWeight: isCurrentRank ? 'bold' : 'normal'
                        }
                      ]}>
                        {rank.name} {subRank.level}
                      </Text>
                      <Text style={[styles.subRankXP, { color: themeColors.subtext }]}>
                        {subRank.xpRequired.toLocaleString()} XP
                      </Text>
                    </View>
                    
                    <View style={styles.subRankRight}>
                      {isCurrentRank && (
                        <View style={[styles.currentBadge, { backgroundColor: rank.color }]}>
                          <Text style={styles.currentBadgeText}>CURRENT</Text>
                        </View>
                      )}
                      {isUnlocked && !isCurrentRank && (
                        <Trophy size={16} color={rank.color} />
                      )}
                      {!isUnlocked && (
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
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const RankSystem: React.FC<RankSystemProps> = ({ userXP, onPress }) => {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [modalVisible, setModalVisible] = useState(false);
  
  const { rank: currentRank, subRank: currentSubRank } = getCurrentRank(userXP);
  const nextRank = getNextRank(userXP);

  const handlePress = () => {
    setModalVisible(true);
    onPress?.();
  };

  return (
    <>
      <Pressable
        style={[styles.rankCard, { backgroundColor: themeColors.card }]}
        onPress={handlePress}
      >
        <View style={[styles.rankEmblem, { backgroundColor: currentRank.color + '20' }]}>
          <Star size={24} color={currentRank.color} />
        </View>
        
        <Text style={[styles.rankTitle, { color: currentRank.color }]}>
          {currentRank.name}
        </Text>
        
        <Text style={[styles.rankSubtitle, { color: themeColors.subtext }]}>
          {currentSubRank.level}
        </Text>

        {nextRank && (
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: themeColors.subtext }]}>
              Next: {nextRank.subRank.xpRequired - userXP} XP to {nextRank.rank.name} {nextRank.subRank.level}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: themeColors.background }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: currentRank.color,
                    width: `${Math.min(100, ((userXP - currentSubRank.xpRequired) / (nextRank.subRank.xpRequired - currentSubRank.xpRequired)) * 100)}%`,
                  }
                ]}
              />
            </View>
          </View>
        )}
      </Pressable>

      <RankModal
        visible={modalVisible}
        userXP={userXP}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  rankCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rankEmblem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  rankSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  modalContainer: {
    flex: 1,
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  currentRankCard: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  currentRankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentRankEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  currentRankName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  currentRankXP: {
    fontSize: 16,
    marginTop: 4,
  },
  modalScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  rankSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  rankName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subRankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  subRankLeft: {
    flex: 1,
  },
  subRankLevel: {
    fontSize: 14,
    fontWeight: '600',
  },
  subRankXP: {
    fontSize: 12,
    marginTop: 2,
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
    fontWeight: 'bold',
  },
  lockedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default RankSystem;
