import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Alert, Platform, Modal } from 'react-native';
import { X, Plus, Minus, TrendingUp, Award, Target } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
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
    updateDailyTrackerTotals, 
    canSubmitDrunkScale, 
    addDrunkScaleRating,
    profile,
    isLoading: profileIsLoading,
    isUpdating: profileIsUpdating,
    profileReady,
    loadProfile
  } = useUserProfileStore();

  const [localStats, setLocalStats] = useState({
    shots: 0,
    scoopAndScores: 0,
    beers: 0,
    beerTowers: 0,
    funnels: 0,
    shotguns: 0,
    poolGamesWon: 0,
    dartGamesWon: 0,
  });
  const [selectedDrunkScale, setSelectedDrunkScale] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset local stats when modal opens - use useCallback to prevent unnecessary re-renders
  const resetLocalStats = useCallback(() => {
    setLocalStats({
      shots: 0,
      scoopAndScores: 0,
      beers: 0,
      beerTowers: 0,
      funnels: 0,
      shotguns: 0,
      poolGamesWon: 0,
      dartGamesWon: 0,
    });
    setSelectedDrunkScale(null);
    setIsSaving(false);
  }, []);

  // Load profile when modal opens
  useEffect(() => {
    if (visible) {
      resetLocalStats();
      
      // Load profile if not already loaded or ready
      if (!profile || !profileReady) {
        console.log('🔄 Loading profile for Daily Tracker...');
        loadProfile();
      }
    }
  }, [visible, resetLocalStats, profile, profileReady, loadProfile]);

  const handleClose = useCallback(() => {
    if (!isSaving) {
      onClose();
    }
  }, [isSaving, onClose]);

  const handleStatChange = useCallback((statKey: keyof typeof localStats, delta: number) => {
    setLocalStats(prev => {
      const currentValue = prev[statKey];
      const newValue = Math.max(0, currentValue + delta);
      
      return {
        ...prev,
        [statKey]: newValue
      };
    });
  }, []);

  const handleSaveStats = useCallback(async () => {
    // Prevent duplicate saves
    if (isSaving) {
      console.log('⚠️ Save already in progress, ignoring duplicate request');
      return;
    }
    
    // Check if profile is still loading
    if (profileIsLoading) {
      Alert.alert(
        'Please Wait',
        'Still loading your profile. Please try again in a moment.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check if profile is not available
    if (!profile) {
      Alert.alert(
        'Profile Not Available',
        'Please wait, still loading your profile.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check if another update is in progress
    if (profileIsUpdating) {
      Alert.alert(
        'Update in Progress',
        'Update in progress. Try again in a second.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check if profile is ready
    if (!profileReady) {
      Alert.alert(
        'Profile Not Ready',
        'Please wait for your profile to finish loading.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      setIsSaving(true);
      console.log('🔄 Saving daily tracker stats:', localStats);
      
      // Check if there are any stats to save
      const hasStats = Object.values(localStats).some(value => value > 0);
      
      if (!hasStats && !selectedDrunkScale) {
        Alert.alert(
          'No Stats to Save',
          'Please add some activities or select a drunk scale rating before saving.',
          [{ text: 'OK' }]
        );
        setIsSaving(false);
        return;
      }
      
      // Submit drunk scale if selected
      if (selectedDrunkScale !== null && canSubmitDrunkScale()) {
        console.log('🔄 Submitting drunk scale rating:', selectedDrunkScale);
        await addDrunkScaleRating(selectedDrunkScale);
      }
      
      // Only update tracker totals if there are actual stats
      if (hasStats) {
        // Calculate new totals by adding current stats to existing totals
        const newTotals = {
          shots: (profile?.total_shots || 0) + localStats.shots,
          scoopAndScores: (profile?.total_scoop_and_scores || 0) + localStats.scoopAndScores,
          beers: (profile?.total_beers || 0) + localStats.beers,
          beerTowers: (profile?.total_beer_towers || 0) + localStats.beerTowers,
          funnels: (profile?.total_funnels || 0) + localStats.funnels,
          shotguns: (profile?.total_shotguns || 0) + localStats.shotguns,
          poolGamesWon: (profile?.pool_games_won || 0) + localStats.poolGamesWon,
          dartGamesWon: (profile?.dart_games_won || 0) + localStats.dartGamesWon,
        };
        
        console.log('🔄 New totals will be:', newTotals);
        
        // Update user profile totals (this handles XP awarding and achievement updates)
        await updateDailyTrackerTotals(newTotals);
      }
      
      console.log('✅ Stats saved successfully');
      
      // Reset local state to zero
      resetLocalStats();
      
      Alert.alert(
        'Stats Saved! 🎉',
        'Your stats have been updated and XP awarded! Check your trophies to see any new achievements.',
        [{ text: 'Awesome!', onPress: handleClose }]
      );
    } catch (error) {
      console.error('❌ Error saving stats:', error);
      setIsSaving(false);
      Alert.alert(
        'Error',
        'Failed to save stats. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [
    isSaving, 
    profileIsLoading, 
    profile, 
    profileIsUpdating, 
    profileReady, 
    localStats, 
    selectedDrunkScale, 
    canSubmitDrunkScale, 
    addDrunkScaleRating, 
    updateDailyTrackerTotals, 
    resetLocalStats, 
    handleClose
  ]);

  // Memoize canSubmitScale to prevent unnecessary re-calculations
  const canSubmitScale = useMemo(() => {
    try {
      return canSubmitDrunkScale();
    } catch (error) {
      console.warn('Error checking drunk scale submission:', error);
      return false;
    }
  }, [canSubmitDrunkScale]);

  const statItems = useMemo(() => [
    { key: 'shots' as const, label: 'Shots', emoji: '🥃', xp: 5 },
    { key: 'scoopAndScores' as const, label: 'Scoop & Scores', emoji: '🍺', xp: 10 },
    { key: 'beers' as const, label: 'Beers', emoji: '🍻', xp: 5 },
    { key: 'beerTowers' as const, label: 'Beer Towers', emoji: '🗼', xp: 15 },
    { key: 'funnels' as const, label: 'Funnels', emoji: '🌪️', xp: 10 },
    { key: 'shotguns' as const, label: 'Shotguns', emoji: '💥', xp: 10 },
    { key: 'poolGamesWon' as const, label: 'Pool Games Won', emoji: '🎱', xp: 15 },
    { key: 'dartGamesWon' as const, label: 'Dart Games Won', emoji: '🎯', xp: 15 },
  ], []);

  // Check if we can save stats (profile is ready and not saving)
  const canSaveStats = useMemo(() => {
    return profileReady && !isSaving && !profileIsLoading && !profileIsUpdating && profile;
  }, [profileReady, isSaving, profileIsLoading, profileIsUpdating, profile]);

  // Determine what status message to show
  const getStatusMessage = () => {
    if (profileIsLoading) return 'Loading your profile...';
    if (!profile) return 'Sign in to save your stats and earn XP';
    if (!profileReady) return 'Preparing your profile...';
    if (profileIsUpdating) return 'Updating your profile...';
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

          {/* Profile Status Banner */}
          {statusMessage && (
            <View style={[styles.warningBanner, { backgroundColor: themeColors.warning + '20' }]}>
              <Text style={[styles.warningText, { color: themeColors.warning }]}>
                {statusMessage}
              </Text>
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
                      disabled={isSaving || !canSaveStats}
                    >
                      <Minus size={18} color={themeColors.text} />
                    </Pressable>
                    
                    <Text style={[styles.statValue, { color: themeColors.text }]}>
                      {localStats[item.key]}
                    </Text>
                    
                    <Pressable
                      style={[styles.controlButton, { backgroundColor: themeColors.primary }]}
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
                    ? 'Submit once every 24 hours (+25 XP)'
                    : 'Can submit again in a few hours'
                  }
                </Text>
              </View>

              {canSubmitScale ? (
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
                        disabled={isSaving || !canSaveStats}
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
                </>
              ) : (
                <View style={[styles.drunkScaleDisabled, { backgroundColor: themeColors.background }]}>
                  <Target size={40} color={themeColors.subtext} />
                  <Text style={[styles.drunkScaleDisabledText, { color: themeColors.subtext }]}>
                    Drunk scale available every 24 hours
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
                  backgroundColor: themeColors.primary,
                  opacity: canSaveStats ? 1 : 0.5,
                }
              ]}
              onPress={handleSaveStats}
              disabled={!canSaveStats}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : statusMessage ? 'Loading Profile...' : 'Save My Stats & Earn XP'}
              </Text>
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
  warningBanner: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningText: {
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