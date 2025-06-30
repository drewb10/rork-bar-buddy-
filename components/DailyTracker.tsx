import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Alert, Platform, Modal } from 'react-native';
import { X, Plus, Minus, TrendingUp, Target, Loader2, CheckCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useDailyTrackerStore } from '@/stores/dailyTrackerStore';
import { useAuthStore } from '@/stores/authStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useAchievementStore } from '@/stores/achievementStore';

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
  const { isAuthenticated, checkSession } = useAuthStore();
  const { profile } = useUserProfileStore();
  const { checkAndUpdateMultiLevelAchievements } = useAchievementStore();
  const { 
    localStats,
    isLoading,
    isSaving,
    error,
    updateLocalStats,
    loadTodayStats,
    saveTodayStats,
    canSubmitDrunkScale,
    clearError,
    resetLocalStats
  } = useDailyTrackerStore();

  const [canSubmitScale, setCanSubmitScale] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load today's stats when modal opens
  useEffect(() => {
    if (visible) {
      console.log('📊 DailyTracker: Modal opened, loading today stats...');
      setSaveSuccess(false);
      clearError();
      loadTodayStats();
      
      // Check drunk scale submission eligibility
      canSubmitDrunkScale().then(setCanSubmitScale);
    }
  }, [visible, loadTodayStats, canSubmitDrunkScale, clearError]);

  // Check session when modal opens
  useEffect(() => {
    if (visible && !isAuthenticated) {
      console.log('📊 DailyTracker: Checking session...');
      checkSession();
    }
  }, [visible, isAuthenticated, checkSession]);

  const handleClose = useCallback(() => {
    if (!isSaving) {
      setSaveSuccess(false);
      clearError();
      onClose();
    }
  }, [isSaving, onClose, clearError]);

  const handleStatChange = useCallback((statKey: keyof typeof localStats, delta: number) => {
    if (isSaving) return;
    
    const currentValue = localStats[statKey] as number;
    const newValue = Math.max(0, currentValue + delta);
    
    updateLocalStats({ [statKey]: newValue });
  }, [isSaving, localStats, updateLocalStats]);

  const handleDrunkScaleSelect = useCallback((rating: number) => {
    if (isSaving || !canSubmitScale) return;
    
    updateLocalStats({ drunk_scale: rating });
  }, [isSaving, canSubmitScale, updateLocalStats]);

  const handleSaveStats = useCallback(async () => {
    if (isSaving) {
      console.log('⚠️ Save already in progress');
      return;
    }

    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to save your stats and earn XP.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if there are any stats to save
    const hasStats = Object.entries(localStats).some(([key, value]) => {
      if (key === 'drunk_scale') return value !== null;
      return value > 0;
    });

    if (!hasStats) {
      Alert.alert(
        'No Stats to Save',
        'Please add some activities or select a drunk scale rating before saving.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      console.log('📊 DailyTracker: Saving stats:', localStats);
      
      await saveTodayStats();
      
      setSaveSuccess(true);
      console.log('✅ Stats saved successfully');

      // Update achievements with current profile stats
      if (profile) {
        const updatedStats = {
          totalBeers: (profile.total_beers || 0) + localStats.beers,
          totalShots: (profile.total_shots || 0) + localStats.shots,
          totalBeerTowers: (profile.total_beer_towers || 0) + localStats.beer_towers,
          totalScoopAndScores: 0, // Not tracked in daily stats
          totalFunnels: (profile.total_funnels || 0) + localStats.funnels,
          totalShotguns: (profile.total_shotguns || 0) + localStats.shotguns,
          poolGamesWon: (profile.pool_games_won || 0) + localStats.pool_games_won,
          dartGamesWon: (profile.dart_games_won || 0) + localStats.dart_games_won,
          barsHit: profile.bars_hit || 0,
          nightsOut: profile.nights_out || 0,
        };
        
        // Update achievements
        checkAndUpdateMultiLevelAchievements(updatedStats);
      }

      // Reset the form after successful submission
      setTimeout(() => {
        resetLocalStats();
        console.log('🔄 Daily tracker form reset to default values');
      }, 1000);
      
      // Auto-close modal after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
        handleClose();
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error saving stats:', error);
      setSaveSuccess(false);
      
      let errorMessage = 'Failed to save stats. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('not authenticated')) {
          errorMessage = 'Please sign in to save your stats.';
        } else if (error.message.includes('not configured')) {
          errorMessage = 'Database not configured. Please contact support.';
        }
      }
      
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    }
  }, [isSaving, isAuthenticated, localStats, saveTodayStats, handleClose, resetLocalStats, profile, checkAndUpdateMultiLevelAchievements]);

  const statItems = useMemo(() => [
    { key: 'shots' as const, label: 'Shots', emoji: '🥃', xp: 5 },
    { key: 'beers' as const, label: 'Beers', emoji: '🍻', xp: 5 },
    { key: 'beer_towers' as const, label: 'Beer Towers', emoji: '🗼', xp: 15 },
    { key: 'funnels' as const, label: 'Funnels', emoji: '🌪️', xp: 10 },
    { key: 'shotguns' as const, label: 'Shotguns', emoji: '💥', xp: 10 },
    { key: 'pool_games_won' as const, label: 'Pool Games Won', emoji: '🎱', xp: 15 },
    { key: 'dart_games_won' as const, label: 'Dart Games Won', emoji: '🎯', xp: 15 },
  ], []);

  const canSaveStats = useMemo(() => {
    return isAuthenticated && !isSaving && !isLoading;
  }, [isAuthenticated, isSaving, isLoading]);

  const getStatusMessage = () => {
    if (saveSuccess) return 'Stats saved successfully! Form will reset... 🎉';
    if (isSaving) return 'Saving your stats...';
    if (isLoading) return 'Loading your stats...';
    if (error) return `Error: ${error}`;
    if (!isAuthenticated) return 'Sign in to save your stats';
    return null;
  };

  const statusMessage = getStatusMessage();

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
            <Pressable 
              style={[styles.closeButton, { opacity: isSaving ? 0.5 : 1 }]} 
              onPress={handleClose}
              disabled={isSaving}
            >
              <X size={28} color={themeColors.text} />
            </Pressable>
          </View>

          {/* Status Banner */}
          {statusMessage && (
            <View style={[
              styles.statusBanner, 
              { 
                backgroundColor: saveSuccess
                  ? themeColors.success + '20'
                  : isSaving 
                    ? themeColors.primary + '20' 
                    : error
                      ? themeColors.error + '20'
                      : themeColors.warning + '20' 
              }
            ]}>
              <View style={styles.statusContent}>
                {saveSuccess && (
                  <CheckCircle 
                    size={16} 
                    color={themeColors.success} 
                    style={styles.statusIcon} 
                  />
                )}
                {isSaving && (
                  <Loader2 
                    size={16} 
                    color={themeColors.primary} 
                    style={styles.statusIcon} 
                  />
                )}
                <Text style={[
                  styles.statusText, 
                  { 
                    color: saveSuccess
                      ? themeColors.success
                      : isSaving 
                        ? themeColors.primary 
                        : error
                          ? themeColors.error
                          : themeColors.warning 
                  }
                ]}>
                  {statusMessage}
                </Text>
              </View>
            </View>
          )}

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Stats Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  Track Your Night 🍻
                </Text>
                <Text style={[styles.sectionSubtitle, { color: themeColors.subtext }]}>
                  Track your activities for the day
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
                    </View>
                  </View>
                  
                  <View style={styles.statControls}>
                    <Pressable
                      style={[
                        styles.controlButton, 
                        { 
                          backgroundColor: themeColors.border,
                          opacity: (isSaving || !canSaveStats) ? 0.5 : 1
                        }
                      ]}
                      onPress={() => handleStatChange(item.key, -1)}
                      disabled={isSaving || !canSaveStats}
                    >
                      <Minus size={18} color={themeColors.text} />
                    </Pressable>
                    
                    <Text style={[styles.statValue, { color: themeColors.text }]}>
                      {localStats[item.key] || 0}
                    </Text>
                    
                    <Pressable
                      style={[
                        styles.controlButton, 
                        { 
                          backgroundColor: themeColors.primary,
                          opacity: (isSaving || !canSaveStats) ? 0.5 : 1
                        }
                      ]}
                      onPress={() => handleStatChange(item.key, 1)}
                      disabled={isSaving || !canSaveStats}
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
                  {canSubmitScale 
                    ? 'Submit once per day'
                    : 'Already submitted today'
                  }
                </Text>
              </View>

              {canSubmitScale ? (
                <View style={styles.drunkScaleOptions}>
                  {drunkScaleOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.drunkScaleOption,
                        {
                          backgroundColor: localStats.drunk_scale === option.value 
                            ? themeColors.primary 
                            : themeColors.background,
                          borderColor: localStats.drunk_scale === option.value 
                            ? themeColors.primary 
                            : themeColors.border,
                          opacity: (isSaving || !canSaveStats) ? 0.5 : 1
                        }
                      ]}
                      onPress={() => handleDrunkScaleSelect(option.value)}
                      disabled={isSaving || !canSaveStats}
                    >
                      <Text style={styles.drunkScaleEmoji}>{option.emoji}</Text>
                      <Text style={[
                        styles.drunkScaleLabel, 
                        { 
                          color: localStats.drunk_scale === option.value 
                            ? 'white' 
                            : themeColors.text 
                        }
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={[
                        styles.drunkScaleDescription, 
                        { 
                          color: localStats.drunk_scale === option.value 
                            ? 'rgba(255,255,255,0.8)' 
                            : themeColors.subtext 
                        }
                      ]}>
                        {option.description}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={[styles.drunkScaleDisabled, { backgroundColor: themeColors.background }]}>
                  <Target size={40} color={themeColors.subtext} />
                  <Text style={[styles.drunkScaleDisabledText, { color: themeColors.subtext }]}>
                    Drunk scale submitted for today
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Save Button */}
          <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
            <Pressable
              style={[
                styles.saveButton, 
                { 
                  backgroundColor: saveSuccess 
                    ? themeColors.success 
                    : themeColors.primary,
                  opacity: canSaveStats && !saveSuccess ? 1 : 0.5,
                }
              ]}
              onPress={handleSaveStats}
              disabled={!canSaveStats || saveSuccess}
            >
              <View style={styles.saveButtonContent}>
                {isSaving && (
                  <Loader2 
                    size={20} 
                    color="white" 
                    style={styles.saveButtonIcon} 
                  />
                )}
                {saveSuccess && (
                  <CheckCircle 
                    size={20} 
                    color="white" 
                    style={styles.saveButtonIcon} 
                  />
                )}
                <Text style={styles.saveButtonText}>
                  {saveSuccess
                    ? 'Saved Successfully!'
                    : isSaving 
                      ? 'Saving...' 
                      : statusMessage && !isAuthenticated
                        ? 'Sign In to Save' 
                        : 'Save My Stats'
                  }
                </Text>
              </View>
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
  statusBanner: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
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
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});