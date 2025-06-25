import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { Plus, Minus, ChartBar as BarChart3, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useDailyTrackerStore } from '@/stores/dailyTrackerStore';
import { Platform } from 'react-native';
import Slider from '@react-native-community/slider';

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
  const { addDrunkScaleRating, canSubmitDrunkScale, updateDailyTrackerTotals } = useUserProfileStore();
  const { getDailyStats, updateDailyStats } = useDailyTrackerStore();
  
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [drunkScale, setDrunkScale] = useState(1);
  const [hasSubmittedDrunkScale, setHasSubmittedDrunkScale] = useState(false);
  const [showDrunkScaleModal, setShowDrunkScaleModal] = useState(false);

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
    }
  }, [visible, isInitialized, getDailyStats, canSubmitDrunkScale]);

  // Reset initialization when modal closes
  useEffect(() => {
    if (!visible) {
      setIsInitialized(false);
      setShowDrunkScaleModal(false);
    }
  }, [visible]);

  const updateCount = (itemId: string, change: number) => {
    if (Platform.OS !== 'web') {
      // Haptics would go here for native platforms
    }

    setCounts(prev => {
      const newCount = Math.max(0, (prev[itemId] || 0) + change);
      const newCounts = { ...prev, [itemId]: newCount };
      
      return newCounts;
    });
  };

  const handleDrunkScalePress = () => {
    if (canSubmitDrunkScale() && !hasSubmittedDrunkScale) {
      setShowDrunkScaleModal(true);
    }
  };

  const handleDrunkScaleSubmit = async () => {
    if (canSubmitDrunkScale() && !hasSubmittedDrunkScale) {
      await addDrunkScaleRating(drunkScale);
      setHasSubmittedDrunkScale(true);
      setShowDrunkScaleModal(false);
      
      if (Platform.OS !== 'web') {
        // Haptics would go here for native platforms
      }
    }
  };

  const handleDrunkScaleClose = () => {
    setShowDrunkScaleModal(false);
  };

  const handleClose = async () => {
    // Save current progress before closing
    const statsToUpdate = {
      shots: counts.shots,
      scoopAndScores: counts.scoopAndScores,
      beers: counts.beers,
      beerTowers: counts.beerTowers,
      funnels: counts.funnels,
      shotguns: counts.shotguns,
      poolGamesWon: counts.poolGamesWon,
      dartGamesWon: counts.dartGamesWon,
    };

    // Update both stores
    updateDailyStats(statsToUpdate);
    await updateDailyTrackerTotals(statsToUpdate);

    onClose();
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
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Drunk Scale Button */}
          <Pressable 
            style={[
              styles.drunkScaleButton, 
              { 
                backgroundColor: hasSubmittedDrunkScale ? themeColors.border : themeColors.primary,
                opacity: hasSubmittedDrunkScale ? 0.6 : 1
              }
            ]}
            onPress={handleDrunkScalePress}
            disabled={hasSubmittedDrunkScale}
          >
            <Text style={[styles.drunkScaleButtonText, { color: 'white' }]}>
              🍻 {hasSubmittedDrunkScale ? 'Drunk Level Submitted for Today' : 'Submit Drunk Level (+25 XP)'}
            </Text>
          </Pressable>

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
        </ScrollView>
      </View>

      {/* Drunk Scale Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDrunkScaleModal}
        onRequestClose={handleDrunkScaleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                How drunk are you? 🍻
              </Text>
              <Pressable onPress={handleDrunkScaleClose} style={styles.modalCloseButton}>
                <X size={24} color={themeColors.subtext} />
              </Pressable>
            </View>
            
            <View style={styles.modalBody}>
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
              />
              
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton, { backgroundColor: themeColors.border }]}
                  onPress={handleDrunkScaleClose}
                >
                  <Text style={[styles.modalButtonText, { color: themeColors.text }]}>Cancel</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.modalButton, styles.submitButton, { backgroundColor: themeColors.primary }]}
                  onPress={handleDrunkScaleSubmit}
                >
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>Submit (+25 XP)</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  drunkScaleButton: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  drunkScaleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '90%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalBody: {
    alignItems: 'center',
  },
  drunkScaleValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    // Additional styles for cancel button
  },
  submitButton: {
    // Additional styles for submit button
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});