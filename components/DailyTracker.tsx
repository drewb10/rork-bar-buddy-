import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Plus, Minus, BarChart3 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface DrinkItem {
  id: string;
  name: string;
  icon: string;
  xpType: 'shots' | 'scoop_and_scores' | 'beers' | 'beer_towers' | 'funnels' | 'shotguns';
}

const drinkItems: DrinkItem[] = [
  { id: 'shots', name: 'Shots', icon: '🥃', xpType: 'shots' },
  { id: 'scoopAndScores', name: 'Scoop & Scores', icon: '🍺', xpType: 'scoop_and_scores' },
  { id: 'beers', name: 'Beers', icon: '🍻', xpType: 'beers' },
  { id: 'beerTowers', name: 'Beer Towers', icon: '🗼', xpType: 'beer_towers' },
  { id: 'funnels', name: 'Funnels', icon: '⏳', xpType: 'funnels' },
  { id: 'shotguns', name: 'Shotguns', icon: '🔫', xpType: 'shotguns' },
];

export default function DailyTracker() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { awardXP, updateDailyTrackerTotals } = useUserProfileStore();
  const [counts, setCounts] = useState<Record<string, number>>({
    shots: 0,
    scoopAndScores: 0,
    beers: 0,
    beerTowers: 0,
    funnels: 0,
    shotguns: 0,
  });

  const updateCount = (itemId: string, change: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setCounts(prev => {
      const newCount = Math.max(0, (prev[itemId] || 0) + change);
      const newCounts = { ...prev, [itemId]: newCount };
      
      // Award XP for the change
      if (change > 0) {
        const item = drinkItems.find(d => d.id === itemId);
        if (item) {
          awardXP(item.xpType, `Had ${change} ${item.name.toLowerCase()}`);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Update totals in user profile
    updateDailyTrackerTotals({
      shots: counts.shots,
      scoopAndScores: counts.scoopAndScores,
      beers: counts.beers,
      beerTowers: counts.beerTowers,
      funnels: counts.funnels,
      shotguns: counts.shotguns,
    });

    // Reset counts
    setCounts({
      shots: 0,
      scoopAndScores: 0,
      beers: 0,
      beerTowers: 0,
      funnels: 0,
      shotguns: 0,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.card }]}>
      <View style={styles.header}>
        <BarChart3 size={20} color={themeColors.primary} />
        <Text style={[styles.title, { color: themeColors.text }]}>
          Daily Tracker
        </Text>
      </View>
      
      <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
        Track your drinks tonight
      </Text>

      <View style={styles.itemsGrid}>
        {drinkItems.map((item) => (
          <View key={item.id} style={[styles.itemCard, { backgroundColor: themeColors.background }]}>
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
            Save Progress ({getTotalCount()} drinks)
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  itemCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  itemIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});