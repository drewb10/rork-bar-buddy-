import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Alert, Platform, Modal } from 'react-native';
import { X, Plus, Minus, TrendingUp, CheckCircle, Loader2, Target, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  color: string;
}

const drunkScaleOptions: DrunkScaleOption[] = [
  { value: 1, label: 'Sober', emoji: '😐', description: 'Completely sober', color: '#34C759' },
  { value: 2, label: 'Buzzed', emoji: '🙂', description: 'Feeling relaxed', color: '#FFD60A' },
  { value: 3, label: 'Tipsy', emoji: '😊', description: 'Feeling good', color: '#FF9500' },
  { value: 4, label: 'Drunk', emoji: '😵', description: 'Pretty drunk', color: '#FF6B35' },
  { value: 5, label: 'Wasted', emoji: '🤢', description: 'Very drunk', color: '#FF3B30' },
];

const STAT_ITEMS = [
  { key: 'shots', label: 'Shots', emoji: '🥃', xp: 5, color: '#FF6B35' },
  { key: 'beers', label: 'Beers', emoji: '🍻', xp: 5, color: '#FFD60A' },
  { key: 'beer_towers', label: 'Beer Towers', emoji: '🗼', xp: 15, color: '#30D158' },
  { key: 'funnels', label: 'Funnels', emoji: '🌪️', xp: 10, color: '#007AFF' },
  { key: 'shotguns', label: 'Shotguns', emoji: '💥', xp: 10, color: '#AF52DE' },
  { key: 'pool_games_won', label: 'Pool Games Won', emoji: '🎱', xp: 15, color: '#FF9500' },
  { key: 'dart_games_won', label: 'Dart Games Won', emoji: '🎯', xp: 15, color: '#FF3B30' },
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
  const [activeSection, setActiveSection] = useState<'stats' | 'scale'>('stats');

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
    
    updateLocalStats({ drunk_scale: localStats.drunk_scale === rating ? null : rating });
  }, [isSaving, canSubmitScale, updateLocalStats, localStats.drunk_scale]);

  const calculateTotalXP = useMemo(() => {
    return STAT_ITEMS.reduce((total, item) => {
      return total + ((localStats[item.key as keyof typeof localStats] as number) * item.xp);
    }, 0) + (localStats.drunk_scale ? 25 : 0);
  }, [localStats]);

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

      // CRITICAL FIX: Reset the form after successful submission
      setTimeout(() => {
        resetLocalStats();
        console.log('🔄 Daily tracker form reset to default values');
      }, 1000);
      
      // Auto-close modal after 2 seconds
      setTimeout(() => {
        setSaveSuccess(false);
        handleClose();
      }, 2000);
      
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

  const canSaveStats = useMemo(() => {
    return isAuthenticated && !isSaving && !isLoading;
  }, [isAuthenticated, isSaving, isLoading]);

  const getStatusMessage = () => {
    if (saveSuccess) return 'Stats saved successfully! Closing... 🎉';
    if (isSaving) return 'Saving your stats...';
    if (isLoading) return 'Loading your stats...';
    if (error) return `Error: ${error}`;
    if (!isAuthenticated) return 'Sign in to save your stats';
    return null;
  };

  const statusMessage = getStatusMessage();

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <TrendingUp size={24} color="#FF6B35" />
        <Text style={styles.title}>Daily Tracker</Text>
      </View>
      <Pressable style={styles.closeButton} onPress={handleClose}>
        <X size={24} color="white" />
      </Pressable>
    </View>
  );

  const renderXPSummary = () => (
    <View style={styles.xpContainer}>
      <LinearGradient
        colors={['#FF6B35', '#FF8F65']}
        style={styles.xpCard}
      >
        <View style={styles.xpContent}>
          <Zap size={20} color="white" />
          <Text style={styles.xpText}>Total XP: {calculateTotalXP}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderSectionTabs = () => (
    <View style={styles.tabsContainer}>
      <Pressable
        style={[
          styles.tab,
          {
            backgroundColor: activeSection === 'stats' ? '#FF6B35' : 'rgba(255,255,255,0.05)',
          }
        ]}
        onPress={() => setActiveSection('stats')}
      >
        <Target size={18} color={activeSection === 'stats' ? 'white' : '#8E8E93'} />
        <Text style={[
          styles.tabText,
          { color: activeSection === 'stats' ? 'white' : '#8E8E93' }
        ]}>
          Activities
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.tab,
          {
            backgroundColor: activeSection === 'scale' ? '#FF6B35' : 'rgba(255,255,255,0.05)',
          }
        ]}
        onPress={() => setActiveSection('scale')}
      >
        <Text style={styles.tabEmoji}>🤔</Text>
        <Text style={[
          styles.tabText,
          { color: activeSection === 'scale' ? 'white' : '#8E8E93' }
        ]}>
          How You Feel
        </Text>
      </Pressable>
    </View>
  );

  const renderStatsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Track Your Activities</Text>
      <Text style={styles.sectionSubtitle}>
        Tap to add or remove activities from your night
      </Text>

      {STAT_ITEMS.map((item) => (
        <View key={item.key} style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={styles.statInfo}>
              <Text style={styles.statEmoji}>{item.emoji}</Text>
              <View style={styles.statLabels}>
                <Text style={styles.statLabel}>{item.label}</Text>
                <View style={styles.xpBadge}>
                  <Zap size={12} color="#FFD60A" />
                  <Text style={styles.xpBadgeText}>+{item.xp} XP each</Text>
                </View>
              </View>
            </View>

            <View style={styles.statControls}>
              <Pressable
                style={[styles.controlButton, styles.minusButton]}
                onPress={() => handleStatChange(item.key as keyof typeof localStats, -1)}
                disabled={isSaving || !canSaveStats}
              >
                <Minus size={18} color="white" />
              </Pressable>

              <View style={styles.countContainer}>
                <Text style={styles.countText}>
                  {localStats[item.key as keyof typeof localStats] as number}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.controlButton,
                  styles.plusButton,
                  { backgroundColor: item.color }
                ]}
                onPress={() => handleStatChange(item.key as keyof typeof localStats, 1)}
                disabled={isSaving || !canSaveStats}
              >
                <Plus size={18} color="white" />
              </Pressable>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderScaleSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>How Are You Feeling?</Text>
      <Text style={styles.sectionSubtitle}>
        {canSubmitScale 
          ? 'Select your current state for +25 XP'
          : 'Already submitted today'
        }
      </Text>

      {canSubmitScale ? (
        <View style={styles.drunkScaleOptions}>
          {drunkScaleOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.scaleCard,
                {
                  borderColor: localStats.drunk_scale === option.value ? option.color : 'rgba(255,255,255,0.1)',
                  backgroundColor: localStats.drunk_scale === option.value ? option.color + '20' : '#1C1C1E',
                }
              ]}
              onPress={() => handleDrunkScaleSelect(option.value)}
              disabled={isSaving || !canSaveStats}
            >
              <View style={styles.scaleContent}>
                <Text style={styles.scaleEmoji}>{option.emoji}</Text>
                <View style={styles.scaleInfo}>
                  <Text style={[
                    styles.scaleLabel,
                    { color: localStats.drunk_scale === option.value ? option.color : 'white' }
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.scaleDescription}>
                    {option.description}
                  </Text>
                </View>
                {localStats.drunk_scale === option.value && (
                  <CheckCircle size={20} color={option.color} />
                )}
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.drunkScaleDisabled}>
          <Target size={40} color="#8E8E93" />
          <Text style={styles.drunkScaleDisabledText}>
            Drunk scale submitted for today
          </Text>
        </View>
      )}
    </View>
  );

  const renderSaveButton = () => (
    <View style={styles.footer}>
      <Pressable
        style={[
          styles.saveButton,
          {
            backgroundColor: saveSuccess 
              ? '#34C759' 
              : '#FF6B35',
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
                  : 'Save My Stats & Earn XP'
            }
          </Text>
        </View>
      </Pressable>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {renderHeader()}
          {renderXPSummary()}
          {renderSectionTabs()}

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {activeSection === 'stats' ? renderStatsSection() : renderScaleSection()}
          </ScrollView>

          {renderSaveButton()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  
  container: {
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  
  closeButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  xpContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  
  xpCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  xpContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  xpText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 12,
  },
  
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  tabEmoji: {
    fontSize: 16,
  },
  
  content: {
    maxHeight: 400,
  },
  
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  
  sectionSubtitle: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
    lineHeight: 18,
  },
  
  statCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  
  statLabels: {
    flex: 1,
  },
  
  statLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  xpBadgeText: {
    color: '#FFD60A',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  statControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  minusButton: {
    backgroundColor: '#3A3A3C',
  },
  
  plusButton: {
    backgroundColor: '#FF6B35',
  },
  
  countContainer: {
    minWidth: 32,
    alignItems: 'center',
  },
  
  countText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  
  drunkScaleOptions: {
    marginBottom: 24,
  },
  
  scaleCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  
  scaleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  scaleEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  
  scaleInfo: {
    flex: 1,
  },
  
  scaleLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  
  scaleDescription: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  
  drunkScaleDisabled: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
  },
  
  drunkScaleDisabledText: {
    color: '#8E8E93',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    fontSize: 16,
    fontWeight: '700',
  },
});