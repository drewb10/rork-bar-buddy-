import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Alert, Platform, Modal } from 'react-native';
import { X, Plus, Minus, TrendingUp, Award, Target } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useDailyTrackerStore } from '@/stores/dailyTrackerStore';
import { useUserProfileStore } from '@/stores/userProfileStore';

interface DailyTrackerProps {
  visible: boolean;
  onClose: () => void;
}

interface DrunkScaleOption {
  value: number;
  label: string;
  emoji: string;
  description: string;
}

const drunkScaleOptions: DrunkScaleOption[] = [
  { value: 1, label: 'Sober', emoji: '😐', description: 'Completely sober' },
  { value: 2, label: 'Buzzed', emoji: '🙂', description: 'Feeling relaxed' },
  { value: 3, label: 'Tipsy', emoji: '😊', description: 'Feeling good' },
  { value: 4, label: 'Drunk', emoji: '😵', description: 'Pretty drunk' },
  { value: 5, label: 'Wasted', emoji: '🤢', description: 'Very drunk' },
];

export default function DailyTracker({ visible, onClose }: DailyTrackerProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { 
    getDailyStats, 
    updateDailyStats, 
    submitDrunkScale, 
    canSubmitDrunkScale, 
    hasDrunkScaleForToday,
    resetDailyStats
  } = useDailyTrackerStore();
  const { updateDailyTrackerTotals } = useUserProfileStore();

  const [localStats, setLocalStats] = useState(getDailyStats());
  const [selectedDrunkScale, setSelectedDrunkScale] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setLocalStats(getDailyStats());
      setSelectedDrunkScale(null);
    }
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

  const handleStatChange = (statKey: keyof typeof localStats, delta: number) => {
    if (statKey === 'date' || statKey === 'lastResetAt' || statKey === 'drunkScaleSubmitted' || 
        statKey === 'drunkScaleRating' || statKey === 'drunkScaleTimestamp' || 
        statKey === 'lastDrunkScaleSubmission') return;

    const currentValue = localStats[statKey] as number;
    const newValue = Math.max(0, currentValue + delta);
    
    setLocalStats(prev => ({
      ...prev,
      [statKey]: newValue
    }));
  };

  const handleSaveStats = async () => {
    try {
      console.log('🔄 Saving daily tracker stats:', localStats);
      
      // Update user profile totals (this handles XP awarding and prevents double-counting)
      await updateDailyTrackerTotals({
        shots: localStats.shots,
        scoopAndScores: localStats.scoopAndScores,
        beers: localStats.beers,
        beerTowers: localStats.beerTowers,
        funnels: localStats.funnels,
        shotguns: localStats.shotguns,
        poolGamesWon: localStats.poolGamesWon,
        dartGamesWon: localStats.dartGamesWon,
      });
      
      console.log('✅ Stats saved successfully');
      
      // Reset the daily stats to zero after saving
      resetDailyStats();
      
      // Reset local state to zero
      const resetStats = {
        ...localStats,
        shots: 0,
        scoopAndScores: 0,
        beers: 0,
        beerTowers: 0,
        funnels: 0,
        shotguns: 0,
        poolGamesWon: 0,
        dartGamesWon: 0
      };
      setLocalStats(resetStats);
      
      Alert.alert(
        'Stats Saved! 🎉',
        'Your daily stats have been updated, XP awarded, and trackers reset!',
        [{ text: 'Awesome!', onPress: handleClose }]
      );
    } catch (error) {
      console.error('❌ Error saving stats:', error);
      Alert.alert(
        'Error',
        'Failed to save stats. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDrunkScaleSubmit = () => {
    if (selectedDrunkScale === null) {
      Alert.alert('Please select a rating', 'Choose how you are feeling right now.');
      return;
    }

    submitDrunkScale(selectedDrunkScale);
    
    Alert.alert(
      'Thanks for sharing! 🍻',
      'Your drunk scale has been recorded. Stay safe and have fun!',
      [{ text: 'Got it!', onPress: handleClose }]
    );
  };

  const canSubmitScale = canSubmitDrunkScale();
  const hasSubmittedToday = hasDrunkScaleForToday();

  const statItems = [
    { key: 'shots' as const, label: 'Shots', emoji: '🥃', xp: 5 },
    { key: 'scoopAndScores' as const, label: 'Scoop & Scores', emoji: '🍺', xp: 10 },
    { key: 'beers' as const, label: 'Beers', emoji: '🍻', xp: 5 },
    { key: 'beerTowers' as const, label: 'Beer Towers', emoji: '🗼', xp: 15 },
    { key: 'funnels' as const, label: 'Funnels', emoji: '🌪️', xp: 10 },
    { key: 'shotguns' as const, label: 'Shotguns', emoji: '💥', xp: 10 },
    { key: 'poolGamesWon' as const, label: 'Pool Games Won', emoji: '🎱', xp: 15 },
    { key: 'dartGamesWon' as const, label: 'Dart Games Won', emoji: '🎯', xp: 15 },
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: themeColors.card }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
            <View style={styles.headerContent}>
              <TrendingUp size={28} color={themeColors.primary} />
              <Text style={[styles.title, { color: themeColors.text }]}>
                Daily Tracker
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <X size={28} color={themeColors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Stats Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  Track Your Night 🍻
                </Text>
                <Text style={[styles.sectionSubtitle, { color: themeColors.subtext }]}>
                  Earn XP for every activity you track
                </Text>
              </View>
              
              {statItems.map((item) => (
                <View key={item.key} style={[styles.statRow, { backgroundColor: themeColors.background }]}>
                  <View style={styles.statInfo}>
                    <Text style={styles.statEmoji}>{item.emoji}</Text>
                    <View style={styles.statTextContainer}>
                      <Text style={[styles.statLabel, { color: themeColors.text }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.statXP, { color: themeColors.primary }]}>
                        +{item.xp} XP each
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.statControls}>
                    <Pressable
                      style={[styles.controlButton, { backgroundColor: themeColors.border }]}
                      onPress={() => handleStatChange(item.key, -1)}
                    >
                      <Minus size={18} color={themeColors.text} />
                    </Pressable>
                    
                    <Text style={[styles.statValue, { color: themeColors.text }]}>
                      {localStats[item.key] as number}
                    </Text>
                    
                    <Pressable
                      style={[styles.controlButton, { backgroundColor: themeColors.primary }]}
                      onPress={() => handleStatChange(item.key, 1)}
                    >
                      <Plus size={18} color="white" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            {/* Drunk Scale Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  How are you feeling? 🤔
                </Text>
                <Text style={[styles.sectionSubtitle, { color: themeColors.subtext }]}>
                  {hasSubmittedToday 
                    ? 'Level Submitted for Today (resets in 24h)'
                    : canSubmitScale 
                      ? 'Submit once every 24 hours (+25 XP)'
                      : 'Can submit again in a few hours'
                  }
                </Text>
              </View>

              {canSubmitScale && !hasSubmittedToday ? (
                <>
                  <View style={styles.drunkScaleOptions}>
                    {drunkScaleOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.drunkScaleOption,
                          {
                            backgroundColor: selectedDrunkScale === option.value 
                              ? themeColors.primary 
                              : themeColors.background,
                            borderColor: selectedDrunkScale === option.value 
                              ? themeColors.primary 
                              : themeColors.border,
                          }
                        ]}
                        onPress={() => setSelectedDrunkScale(option.value)}
                      >
                        <Text style={styles.drunkScaleEmoji}>{option.emoji}</Text>
                        <Text style={[
                          styles.drunkScaleLabel, 
                          { 
                            color: selectedDrunkScale === option.value 
                              ? 'white' 
                              : themeColors.text 
                          }
                        ]}>
                          {option.label}
                        </Text>
                        <Text style={[
                          styles.drunkScaleDescription, 
                          { 
                            color: selectedDrunkScale === option.value 
                              ? 'rgba(255,255,255,0.8)' 
                              : themeColors.subtext 
                          }
                        ]}>
                          {option.description}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable
                    style={[
                      styles.submitDrunkScaleButton,
                      {
                        backgroundColor: selectedDrunkScale !== null 
                          ? themeColors.primary 
                          : themeColors.border,
                        opacity: selectedDrunkScale !== null ? 1 : 0.5,
                      }
                    ]}
                    onPress={handleDrunkScaleSubmit}
                    disabled={selectedDrunkScale === null}
                  >
                    <Award size={22} color="white" />
                    <Text style={styles.submitDrunkScaleText}>
                      Submit Rating (+25 XP)
                    </Text>
                  </Pressable>
                </>
              ) : (
                <View style={[styles.drunkScaleDisabled, { backgroundColor: themeColors.background }]}>
                  <Target size={40} color={themeColors.subtext} />
                  <Text style={[styles.drunkScaleDisabledText, { color: themeColors.subtext }]}>
                    {hasSubmittedToday 
                      ? 'Thanks for sharing! Come back tomorrow.'
                      : 'Drunk scale available every 24 hours'
                    }
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Save Button */}
          <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
            <Pressable
              style={[styles.saveButton, { backgroundColor: themeColors.primary }]}
              onPress={handleSaveStats}
            >
              <Text style={styles.saveButtonText}>Save My Stats & Earn XP</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    maxHeight: 520,
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  statInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statXP: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  statControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginHorizontal: 20,
    minWidth: 28,
    textAlign: 'center',
  },
  drunkScaleOptions: {
    marginBottom: 24,
  },
  drunkScaleOption: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  drunkScaleEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  drunkScaleLabel: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  drunkScaleDescription: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  submitDrunkScaleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  submitDrunkScaleText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: 0.4,
  },
  drunkScaleDisabled: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drunkScaleDisabledText: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
  },
  saveButton: {
    padding: 20,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});