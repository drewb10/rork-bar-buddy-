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

const STAT_ITEMS = [
  { key: 'shots', label: 'Shots', emoji: '🥃', xp: 5, color: '#FF6B35' },
  { key: 'beers', label: 'Beers', emoji: '🍻', xp: 5, color: '#FF6B35' },
  { key: 'beer_towers', label: 'Beer Towers', emoji: '🗼', xp: 15, color: '#FF6B35' },
  { key: 'funnels', label: 'Funnels', emoji: '🌪️', xp: 10, color: '#FF6B35' },
  { key: 'shotguns', label: 'Shotguns', emoji: '💥', xp: 10, color: '#FF6B35' },
  { key: 'pool_games_won', label: 'Pool Games Won', emoji: '🎱', xp: 15, color: '#FF6B35' },
  { key: 'dart_games_won', label: 'Dart Games Won', emoji: '🎯', xp: 15, color: '#FF6B35' },
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

  const handleFeelingChange = useCallback((value: number) => {
    if (isSaving || !canSubmitScale) return;
    
    updateLocalStats({ drunk_scale: value });
  }, [isSaving, canSubmitScale, updateLocalStats]);

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
        'Please add some activities or select a feeling rating before saving.',
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

  // Helper function to get feeling label based on value
  const getFeelLabel = (value: number): string => {
    if (value <= 2) return 'Sober';
    if (value <= 4) return 'Buzzed';
    if (value <= 6) return 'Tipsy';
    if (value <= 8) return 'Drunk';
    return 'Very Drunk';
  };

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
                  { backgroundColor: '#FF6B35' } // All plus buttons now orange
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
      <Text style={styles.sectionTitle}>How Are You Feeling? (1-10)</Text>
      <Text style={styles.sectionSubtitle}>
        {canSubmitScale 
          ? 'Tap a number to rate how you feel for +25 XP'
          : 'Already submitted today'
        }
      </Text>

      {canSubmitScale ? (
        <View style={styles.feelingContainer}>
          <View style={styles.feelingHeader}>
            <Text style={styles.feelingValue}>
              {localStats.drunk_scale || 1}
            </Text>
            <Text style={styles.feelingLabel}>
              {localStats.drunk_scale ? getFeelLabel(localStats.drunk_scale) : 'Not set'}
            </Text>
          </View>
          
          {/* Custom feeling selector using pressable buttons */}
          <View style={styles.customFeelingSelector}>
            <View style={styles.feelingTrack}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <View key={value} style={styles.feelingDotContainer}>
                  <View
                    style={[
                      styles.feelingDot,
                      {
                        backgroundColor: (localStats.drunk_scale || 1) >= value ? '#FF6B35' : 'rgba(255,255,255,0.2)',
                      }
                    ]}
                  />
                </View>
              ))}
            </View>
            
            <View style={styles.feelingNumbers}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <Pressable
                  key={value}
                  style={[
                    styles.feelingNumberButton,
                    {
                      backgroundColor: (localStats.drunk_scale || 1) === value ? '#FF6B35' : 'transparent',
                    }
                  ]}
                  onPress={() => handleFeelingChange(value)}
                  disabled={isSaving || !canSaveStats}
                >
                  <Text style={[
                    styles.feelingNumberText,
                    { color: (localStats.drunk_scale || 1) === value ? 'white' : '#8E8E93' }
                  ]}>
                    {value}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          
          <View style={styles.feelingLabels}>
            <Text style={styles.feelingEndLabel}>1 - Sober</Text>
            <Text style={styles.feelingEndLabel}>10 - Very Drunk</Text>
          </View>
        </View>
      ) : (
        <View style={styles.drunkScaleDisabled}>
          <Target size={40} color="#8E8E93" />
          <Text style={styles.drunkScaleDisabledText}>
            Feeling scale submitted for today
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
    backgroundColor: '#FF6B35', // All plus buttons now orange
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
  
  // Custom feeling selector styles
  feelingContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  
  feelingHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  feelingValue: {
    color: '#FF6B35',
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 8,
  },
  
  feelingLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  
  customFeelingSelector: {
    marginBottom: 16,
  },
  
  feelingTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  
  feelingDotContainer: {
    flex: 1,
    alignItems: 'center',
  },
  
  feelingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  feelingNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  feelingNumberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  feelingNumberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  feelingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  feelingEndLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
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