import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { X, Plus, Minus, TrendingUp, Award, Target } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useDailyTrackerStore } from '@/stores/dailyTrackerStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { LinearGradient } from 'expo-linear-gradient';

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
    hasDrunkScaleForToday 
  } = useDailyTrackerStore();
  const { awardXP } = useUserProfileStore();

  const [localStats, setLocalStats] = useState(getDailyStats());
  const [selectedDrunkScale, setSelectedDrunkScale] = useState<number | null>(null);
  const [showDrunkScale, setShowDrunkScale] = useState(false);

  useEffect(() => {
    if (visible) {
      setLocalStats(getDailyStats());
      setSelectedDrunkScale(null);
      setShowDrunkScale(false);
    }
  }, [visible]);

  // Fixed close handler - no side effects
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

  const handleSaveStats = () => {
    updateDailyStats(localStats);
    
    Alert.alert(
      'Stats Saved! 🎉',
      'Your daily stats have been updated and XP awarded!',
      [{ text: 'Awesome!', onPress: handleClose }]
    );
  };

  const handleDrunkScaleSubmit = () => {
    if (selectedDrunkScale === null) {
      Alert.alert('Please select a rating', 'Choose how you are feeling right now.');
      return;
    }

    submitDrunkScale(selectedDrunkScale);
    awardXP('drunk_scale_submission', 'Submitted drunk scale rating');
    
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
    { key: 'beers' as const, label: 'Beers', emoji: '🍻', xp: 8 },
    { key: 'beerTowers' as const, label: 'Beer Towers', emoji: '🗼', xp: 25 },
    { key: 'funnels' as const, label: 'Funnels', emoji: '🌪️', xp: 15 },
    { key: 'shotguns' as const, label: 'Shotguns', emoji: '💥', xp: 12 },
    { key: 'poolGamesWon' as const, label: 'Pool Games Won', emoji: '🎱', xp: 20 },
    { key: 'dartGamesWon' as const, label: 'Dart Games Won', emoji: '🎯', xp: 20 },
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
          {/* Header with fixed close button */}
          <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
            <View style={styles.headerContent}>
              <TrendingUp size={24} color={themeColors.primary} />
              <Text style={[styles.title, { color: themeColors.text }]}>
                Daily Tracker
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={themeColors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Stats Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Track Your Night 🍻
              </Text>
              
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
                      <Minus size={16} color={themeColors.text} />
                    </Pressable>
                    
                    <Text style={[styles.statValue, { color: themeColors.text }]}>
                      {localStats[item.key] as number}
                    </Text>
                    
                    <Pressable
                      style={[styles.controlButton, { backgroundColor: themeColors.primary }]}
                      onPress={() => handleStatChange(item.key, 1)}
                    >
                      <Plus size={16} color="white" />
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
                    ? 'Already submitted today (resets in 24h)'
                    : canSubmitScale 
                      ? 'Submit once every 24 hours (+50 XP)'
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
                    <Award size={20} color="white" />
                    <Text style={styles.submitDrunkScaleText}>
                      Submit Rating (+50 XP)
                    </Text>
                  </Pressable>
                </>
              ) : (
                <View style={[styles.drunkScaleDisabled, { backgroundColor: themeColors.background }]}>
                  <Target size={32} color={themeColors.subtext} />
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
              <Text style={styles.saveButtonText}>Save Stats & Earn XP</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    maxHeight: 500,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statXP: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  drunkScaleOptions: {
    marginBottom: 20,
  },
  drunkScaleOption: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  drunkScaleEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  drunkScaleLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  drunkScaleDescription: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  submitDrunkScaleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitDrunkScaleText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  drunkScaleDisabled: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drunkScaleDisabledText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  saveButton: {
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});