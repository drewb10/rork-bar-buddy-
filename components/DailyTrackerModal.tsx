import React from 'react';
import { StyleSheet, View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { X, Plus, Minus, TrendingUp } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useDailyTrackerStore } from '@/stores/dailyTrackerStore';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface DailyTrackerModalProps {
  visible: boolean;
  onClose: () => void;
}

type StatKey = 'shots' | 'scoopAndScores' | 'beers' | 'beerTowers' | 'funnels' | 'shotguns';

interface StatItem {
  key: StatKey;
  label: string;
  emoji: string;
}

const STATS: StatItem[] = [
  { key: 'shots', label: 'Shots', emoji: '🥃' },
  { key: 'scoopAndScores', label: 'Scoop & Scores', emoji: '🍺' },
  { key: 'beers', label: 'Beers', emoji: '🍻' },
  { key: 'beerTowers', label: 'Beer Towers', emoji: '🗼' },
  { key: 'funnels', label: 'Funnels', emoji: '🌪️' },
  { key: 'shotguns', label: 'Shotguns', emoji: '💥' },
];

export default function DailyTrackerModal({ visible, onClose }: DailyTrackerModalProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { dailyStats, updateDailyStat, resetDailyStatsIfNeeded, getDailyTotal } = useDailyTrackerStore();

  React.useEffect(() => {
    if (visible) {
      resetDailyStatsIfNeeded();
    }
  }, [visible]);

  const handleStatUpdate = (stat: StatKey, increment: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    updateDailyStat(stat, increment);
  };

  const dailyTotal = getDailyTotal();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: themeColors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              Daily Tracker
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={themeColors.text} />
            </Pressable>
          </View>

          {/* Daily Total */}
          <View style={[styles.totalContainer, { backgroundColor: themeColors.primary + '20' }]}>
            <TrendingUp size={20} color={themeColors.primary} />
            <Text style={[styles.totalText, { color: themeColors.primary }]}>
              Today's Total: {dailyTotal}
            </Text>
          </View>

          {/* Stats List */}
          <ScrollView style={styles.statsContainer} showsVerticalScrollIndicator={false}>
            {STATS.map((stat) => (
              <View key={stat.key} style={[styles.statRow, { borderBottomColor: themeColors.border }]}>
                <View style={styles.statInfo}>
                  <Text style={styles.statEmoji}>{stat.emoji}</Text>
                  <Text style={[styles.statLabel, { color: themeColors.text }]}>
                    {stat.label}
                  </Text>
                </View>
                
                <View style={styles.statControls}>
                  <Pressable
                    style={[styles.controlButton, { backgroundColor: themeColors.primary + '20' }]}
                    onPress={() => handleStatUpdate(stat.key, -1)}
                  >
                    <Minus size={16} color={themeColors.primary} />
                  </Pressable>
                  
                  <Text style={[styles.statValue, { color: themeColors.text }]}>
                    {dailyStats[stat.key]}
                  </Text>
                  
                  <Pressable
                    style={[styles.controlButton, { backgroundColor: themeColors.primary + '20' }]}
                    onPress={() => handleStatUpdate(stat.key, 1)}
                  >
                    <Plus size={16} color={themeColors.primary} />
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer Note */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: themeColors.subtext }]}>
              Daily stats reset at 5:00 AM
            </Text>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    maxHeight: 400,
    paddingHorizontal: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  statInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  statControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});