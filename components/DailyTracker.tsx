import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Modal } from 'react-native';
import { Plus, Minus, ChartBar as BarChart3, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useAchievementStore } from '@/stores/achievementStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import { Platform } from 'react-native';

interface DrinkItem {
  id: string;
  name: string;
  icon: string;
  xpType: 'shots' | 'scoop_and_scores' | 'beers' | 'beer_towers' | 'funnels' | 'shotguns' | 'pool_games_won' | 'dart_games_won';
}

const drinkItems: DrinkItem[] = [
  { id: 'shots', name: 'Shots', icon: '🥃', xpType: 'shots' },
  { id: 'scoopAndScores', name: 'Scoop & Scores', icon: '🍺', xpType: 'scoop_and_scores' },
  { id: 'beers', name: 'Beers', icon: '🍻', xpType: 'beers' },
  { id: 'beerTowers', name: 'Beer Towers', icon: '🗼', xpType: 'beer_towers' },
  { id: 'funnels', name: 'Funnels', icon: '⏳', xpType: 'funnels' },
  { id: 'shotguns', name: 'Shotguns', icon: '🔫', xpType: 'shotguns' },
  { id: 'poolGamesWon', name: 'Pool Games Won', icon: '🎱', xpType: 'pool_games_won' },
  { id: 'dartGamesWon', name: 'Dart Games Won', icon: '🎯', xpType: 'dart_games_won' },
];

interface DailyTrackerProps {
  visible: boolean;
  onClose: () => void;
}

export default function DailyTracker({ visible, onClose }: DailyTrackerProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { awardXP, updateDailyTrackerTotals, getDailyStats } = useUserProfileStore();
  const { checkAndUpdateMultiLevelAchievements } = useAchievementStore();
  
  // Initialize counts from daily stats
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize counts when modal becomes visible
  useEffect(() => {
    if (visible && !isInitialized) {
      const dailyStats = getDailyStats();
      setCounts({
        shots: dailyStats.shots || 0,
        scoopAndScores: dailyStats.scoopAndScores || 0,
        beers: dailyStats.beers || 0,
        beerTowers: dailyStats.beerTowers || 0,
        funnels: dailyStats.funnels || 0,
        shotguns: dailyStats.shotguns || 0,
        poolGamesWon: dailyStats.poolGamesWon || 0,
        dartGamesWon: dailyStats.dartGamesWon || 0,
      });
      setIsInitialized(true);
    }
  }, [visible, isInitialized, getDailyStats]);

  // Reset initialization when modal closes
  useEffect(() => {
    if (!visible) {
      setIsInitialized(false);
    }
  }, [visible]);

  const updateCount = (itemId: string, change: number) => {
    if (Platform.OS !== 'web') {
      // Haptics would go here for native platforms
    }

    setCounts(prev => {
      const newCount = Math.max(0, (prev[itemId] || 0) + change);
      const newCounts = { ...prev, [itemId]: newCount };
      
      // Award XP for increases
      if (change > 0) {
        const item = drinkItems.find(d => d.id === itemId);
        if (item) {
          // Use setTimeout to avoid setState during render
          setTimeout(() => {
            awardXP(item.xpType, `Had ${change} ${item.name.toLowerCase()}`);
          }, 0);
        }
      }
      
      return newCounts;
    });
  };

  const getTotalCount = () => {
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  };

  const handleSaveProgress = () => {
    if (Platform.OS !== 'web') {
      // Haptics would go here for native platforms
    }

    // Update totals in user profile
    updateDailyTrackerTotals({
      shots: counts.shots,
      scoopAndScores: counts.scoopAndScores,
      beers: counts.beers,
      beerTowers: counts.beerTowers,
      funnels: counts.funnels,
      shotguns: counts.shotguns,
      poolGamesWon: counts.poolGamesWon,
      dartGamesWon: counts.dartGamesWon,
    });

    // Trigger achievement check after updating totals
    setTimeout(() => {
      const userProfileStore = (window as any).__userProfileStore;
      if (userProfileStore?.getState) {
        const { profile } = userProfileStore.getState();
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
      }
    }, 100);

    onClose();
  };

  const handleClose = () => {
    // Save current progress before closing
    updateDailyTrackerTotals({
      shots: counts.shots,
      scoopAndScores: counts.scoopAndScores,
      beers: counts.beers,
      beerTowers: counts.beerTowers,
      funnels: counts.funnels,
      shotguns: counts.shotguns,
      poolGamesWon: counts.poolGamesWon,
      dartGamesWon: counts.dartGamesWon,
    });

    // Trigger achievement check after updating totals
    setTimeout(() => {
      const userProfileStore = (window as any).__userProfileStore;
      if (userProfileStore?.getState) {
        const { profile } = userProfileStore.getState();
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
      }
    }, 100);

    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <View style={styles.headerLeft}>
            <BarChart3 size={24} color={themeColors.primary} />
            <Text style={[styles.title, { color: themeColors.text }]}>
              Daily Tracker
            </Text>
          </View>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={themeColors.text} />
          </Pressable>
        </View>
        
        <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
          Track your activities tonight
        </Text>

        <View style={styles.itemsGrid}>
          {drinkItems.map((item) => (
            <View key={item.id} style={[styles.itemCard, { backgroundColor: themeColors.card }]}>
              <Text style={styles.itemIcon}>{item.icon}</Text>
              <Text style={[styles.itemName, { color: themeColors.text }]}>
                {item.name}
              </Text>
              
              <View style={styles.counter}>
                <Pressable
                  style={[styles.counterButton, { backgroundColor: themeColors.border }]}
                  onPress={() => updateCount(item.id, -1)}
                  disabled={counts[item.id] === 0}
                >
                  <Minus size={16} color={counts[item.id] === 0 ? themeColors.subtext : themeColors.text} />
                </Pressable>
                
                <Text style={[styles.count, { color: themeColors.text }]}>
                  {counts[item.id] || 0}
                </Text>
                
                <Pressable
                  style={[styles.counterButton, { backgroundColor: themeColors.primary }]}
                  onPress={() => updateCount(item.id, 1)}
                >
                  <Plus size={16} color="white" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {getTotalCount() > 0 && (
          <Pressable
            style={[styles.saveButton, { backgroundColor: themeColors.primary }]}
            onPress={handleSaveProgress}
          >
            <Text style={styles.saveButtonText}>
              Save Progress ({getTotalCount()} activities)
            </Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  itemCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});