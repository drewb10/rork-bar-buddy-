import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, ScrollView, Animated } from 'react-native';
import { Plus, Minus, ChartBar as BarChart3, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { BlurView } from 'expo-blur';

interface DrinkItem {
  id: string;
  name: string;
  icon: string;
  xpType: 'shots' | 'scoop_and_scores' | 'beers' | 'beer_towers' | 'funnels' | 'shotguns' | 'pool_games' | 'dart_games';
}

const drinkItems: DrinkItem[] = [
  { id: 'shots', name: 'Shots', icon: '🥃', xpType: 'shots' },
  { id: 'scoopAndScores', name: 'Scoop & Scores', icon: '🍺', xpType: 'scoop_and_scores' },
  { id: 'beers', name: 'Beers', icon: '🍻', xpType: 'beers' },
  { id: 'beerTowers', name: 'Beer Towers', icon: '🗼', xpType: 'beer_towers' },
  { id: 'funnels', name: 'Funnels', icon: '⏳', xpType: 'funnels' },
  { id: 'shotguns', name: 'Shotguns', icon: '🔫', xpType: 'shotguns' },
  { id: 'poolGamesWon', name: 'Pool Games Won', icon: '🎱', xpType: 'pool_games' },
  { id: 'dartGamesWon', name: 'Dart Games Won', icon: '🎯', xpType: 'dart_games' },
];

interface DailyTrackerProps {
  visible: boolean;
  onClose: () => void;
}

export default function DailyTracker({ visible, onClose }: DailyTrackerProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { awardXP, updateDailyTrackerTotals, getDailyStats, addDrunkScaleRating, canSubmitDrunkScale } = useUserProfileStore();
  
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [drunkScale, setDrunkScale] = useState(1);
  const [hasSubmittedDrunkScale, setHasSubmittedDrunkScale] = useState(false);
  const [scaleAnimation] = useState(new Animated.Value(0));

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
      setHasSubmittedDrunkScale(!canSubmitDrunkScale());
      
      // Animate in
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [visible, isInitialized, getDailyStats, canSubmitDrunkScale]);

  // Reset initialization when modal closes
  useEffect(() => {
    if (!visible) {
      setIsInitialized(false);
      scaleAnimation.setValue(0);
    }
  }, [visible]);

  // Award XP for increases - moved outside of render
  const awardXPForIncrease = useCallback((itemId: string, change: number) => {
    if (change > 0) {
      const item = drinkItems.find(d => d.id === itemId);
      if (item) {
        awardXP(item.xpType, `Had ${change} ${item.name.toLowerCase()}`);
      }
    }
  }, [awardXP]);

  const updateCount = (itemId: string, change: number) => {
    if (Platform.OS !== 'web') {
      // Haptics would go here for native platforms
    }

    setCounts(prev => {
      const newCount = Math.max(0, (prev[itemId] || 0) + change);
      const newCounts = { ...prev, [itemId]: newCount };
      
      // Award XP for increases using useEffect to avoid setState during render
      if (change > 0) {
        setTimeout(() => {
          awardXPForIncrease(itemId, change);
        }, 0);
      }
      
      return newCounts;
    });
  };

  const handleDrunkScaleSubmit = () => {
    if (canSubmitDrunkScale() && !hasSubmittedDrunkScale) {
      addDrunkScaleRating(drunkScale);
      setHasSubmittedDrunkScale(true);
      
      if (Platform.OS !== 'web') {
        // Haptics would go here for native platforms
      }
    }
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

    // Animate out
    Animated.spring(scaleAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      onClose();
    });
  };

  const getDrunkScaleLabel = (value: number) => {
    const labels = [
      '', 'Sober', 'Tipsy', 'Buzzed', 'Drunk', 'Very Drunk', 
      'Wasted', 'Blackout', 'Gone', 'Dead', 'Legendary'
    ];
    return labels[value] || '';
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        {Platform.OS !== 'web' ? (
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: themeColors.overlay }]} />
        )}
        
        <Animated.View 
          style={[
            styles.container, 
            { 
              backgroundColor: themeColors.cardElevated,
              transform: [{ scale: scaleAnimation }]
            }
          ]}
        >
          <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: themeColors.primary + '20' }]}>
                <BarChart3 size={24} color={themeColors.primary} />
              </View>
              <Text style={[styles.title, { color: themeColors.text }]}>
                Daily Tracker
              </Text>
            </View>
            <Pressable onPress={handleClose} style={[styles.closeButton, { backgroundColor: themeColors.border }]}>
              <X size={20} color={themeColors.text} />
            </Pressable>
          </View>
          
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Drunk Scale Slider */}
            <View style={[styles.drunkScaleContainer, { 
              backgroundColor: themeColors.cardElevated,
              shadowColor: themeColors.shadowSecondary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }]}>
              <Text style={[styles.drunkScaleTitle, { color: themeColors.text }]}>
                How drunk are you? 🍻
              </Text>
              <Text style={[styles.drunkScaleValue, { color: themeColors.primary }]}>
                {drunkScale}/10 - {getDrunkScaleLabel(drunkScale)}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={drunkScale}
                onValueChange={setDrunkScale}
                minimumTrackTintColor={themeColors.primary}
                maximumTrackTintColor={themeColors.border}
                thumbTintColor={themeColors.primary}
                disabled={hasSubmittedDrunkScale}
              />
              {!hasSubmittedDrunkScale ? (
                <Pressable
                  style={[styles.submitButton, { 
                    backgroundColor: themeColors.primary,
                    shadowColor: themeColors.shadowPrimary,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 6,
                  }]}
                  onPress={handleDrunkScaleSubmit}
                >
                  <Text style={styles.submitButtonText}>Submit Level</Text>
                </Pressable>
              ) : (
                <Text style={[styles.submittedText, { color: themeColors.subtext }]}>
                  ✓ Level submitted for today
                </Text>
              )}
            </View>

            <View style={styles.itemsGrid}>
              {drinkItems.map((item) => (
                <View key={item.id} style={[styles.itemCard, { 
                  backgroundColor: themeColors.cardElevated,
                  shadowColor: themeColors.shadowSecondary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                  elevation: 4,
                }]}>
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                  <Text style={[styles.itemName, { color: themeColors.text }]}>
                    {item.name}
                  </Text>
                  
                  <View style={styles.counter}>
                    <Pressable
                      style={[styles.counterButton, { 
                        backgroundColor: counts[item.id] === 0 ? themeColors.border : themeColors.background,
                        borderColor: themeColors.border,
                        borderWidth: 1,
                        shadowColor: themeColors.shadowSecondary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }]}
                      onPress={() => updateCount(item.id, -1)}
                      disabled={counts[item.id] === 0}
                    >
                      <Minus size={16} color={counts[item.id] === 0 ? themeColors.subtext : themeColors.text} />
                    </Pressable>
                    
                    <Text style={[styles.count, { color: themeColors.text }]}>
                      {counts[item.id] || 0}
                    </Text>
                    
                    <Pressable
                      style={[styles.counterButton, { 
                        backgroundColor: themeColors.primary,
                        shadowColor: themeColors.shadowPrimary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.4,
                        shadowRadius: 8,
                        elevation: 4,
                      }]}
                      onPress={() => updateCount(item.id, 1)}
                    >
                      <Plus size={16} color="white" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  drunkScaleContainer: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  drunkScaleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  drunkScaleValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 16,
  },
  submitButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submittedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  itemCard: {
    width: '47%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
});