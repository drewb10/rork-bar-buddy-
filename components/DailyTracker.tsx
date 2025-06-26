import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Alert, Platform, Modal } from 'react-native';
import { X, Plus, Minus, TrendingUp, Target } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';

interface DailyTrackerProps {
  visible: boolean;
  onClose: () => void;
}

export default function DailyTracker({ visible, onClose }: DailyTrackerProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { 
    updateDailyTrackerTotals, 
    canSubmitDrunkScale, 
    addDrunkScaleRating,
    profile
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
  const [drunkScaleValue, setDrunkScaleValue] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);

  // Reset local stats when modal opens
  React.useEffect(() => {
    if (visible) {
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
      setDrunkScaleValue(1);
      setIsSaving(false);
    }
  }, [visible]);

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
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      console.log('🔄 Saving daily tracker stats:', localStats);
      
      // Check if there are any stats to save
      const hasStats = Object.values(localStats).some(value => value > 0);
      const canSubmitScale = canSubmitDrunkScale();
      
      if (!hasStats && !canSubmitScale) {
        Alert.alert(
          'No Stats to Save',
          'Please add some activities before saving.',
          [{ text: 'OK' }]
        );
        setIsSaving(false);
        return;
      }
      
      // Save drunk scale if user can submit it
      if (canSubmitScale) {
        await addDrunkScaleRating(drunkScaleValue);
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
      setDrunkScaleValue(1);
      
      const message = hasStats && canSubmitScale 
        ? 'Your stats and drunk scale rating have been updated and XP awarded! Check your trophies to see any new achievements.'
        : hasStats 
        ? 'Your stats have been updated and XP awarded! Check your trophies to see any new achievements.'
        : 'Your drunk scale rating has been recorded!';
      
      Alert.alert(
        'Stats Saved! 🎉',
        message,
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
  }, [isSaving, localStats, profile, updateDailyTrackerTotals, handleClose, canSubmitDrunkScale, addDrunkScaleRating, drunkScaleValue]);

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

  const getDrunkScaleLabel = (value: number): string => {
    if (value <= 2) return 'Sober';
    if (value <= 4) return 'Buzzed';
    if (value <= 6) return 'Tipsy';
    if (value <= 8) return 'Drunk';
    return 'Wasted';
  };

  const getDrunkScaleEmoji = (value: number): string => {
    if (value <= 2) return '😐';
    if (value <= 4) return '🙂';
    if (value <= 6) return '😊';
    if (value <= 8) return '😵';
    return '🤢';
  };

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
                      disabled={isSaving}
                    >
                      <Minus size={18} color={themeColors.text} />
                    </Pressable>
                    
                    <Text style={[styles.statValue, { color: themeColors.text }]}>
                      {localStats[item.key]}
                    </Text>
                    
                    <Pressable
                      style={[styles.controlButton, { backgroundColor: themeColors.primary }]}
                      onPress={() => handleStatChange(item.key, 1)}
                      disabled={isSaving}
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
                <View style={[styles.drunkScaleContainer, { backgroundColor: themeColors.background }]}>
                  <View style={styles.drunkScaleHeader}>
                    <Text style={styles.drunkScaleEmoji}>
                      {getDrunkScaleEmoji(drunkScaleValue)}
                    </Text>
                    <View style={styles.drunkScaleInfo}>
                      <Text style={[styles.drunkScaleValue, { color: themeColors.text }]}>
                        {drunkScaleValue}/10
                      </Text>
                      <Text style={[styles.drunkScaleLabel, { color: themeColors.primary }]}>
                        {getDrunkScaleLabel(drunkScaleValue)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.sliderContainer}>
                    <Text style={[styles.sliderLabel, { color: themeColors.subtext }]}>1</Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={1}
                      maximumValue={10}
                      step={1}
                      value={drunkScaleValue}
                      onValueChange={setDrunkScaleValue}
                      minimumTrackTintColor={themeColors.primary}
                      maximumTrackTintColor={themeColors.border}
                      thumbStyle={{ backgroundColor: themeColors.primary }}
                      disabled={isSaving}
                    />
                    <Text style={[styles.sliderLabel, { color: themeColors.subtext }]}>10</Text>
                  </View>
                </View>
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
                  opacity: isSaving ? 0.7 : 1,
                }
              ]}
              onPress={handleSaveStats}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save My Stats & Earn XP'}
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
  drunkScaleContainer: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  drunkScaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  drunkScaleEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  drunkScaleInfo: {
    flex: 1,
  },
  drunkScaleValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  drunkScaleLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 16,
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