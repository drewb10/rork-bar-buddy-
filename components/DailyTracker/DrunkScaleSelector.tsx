import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

interface DrunkScaleSelectorProps {
  localStats: Record<string, any>;
  canSubmitScale: boolean;
  canSaveStats: boolean;
  isSaving: boolean;
  onDrunkScaleSelect: (rating: number) => void;
}

const DRUNK_SCALE_OPTIONS = [
  { value: 1, label: 'Sober', emoji: '😐' },
  { value: 2, label: 'Buzzed', emoji: '🙂' },
  { value: 3, label: 'Tipsy', emoji: '😊' },
  { value: 4, label: 'Drunk', emoji: '😄' },
  { value: 5, label: 'Very Drunk', emoji: '🥴' },
];

export default function DrunkScaleSelector({
  localStats,
  canSubmitScale,
  canSaveStats,
  isSaving,
  onDrunkScaleSelect,
}: DrunkScaleSelectorProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          How drunk are you? 🥴
        </Text>
        <Text style={[styles.sectionSubtitle, { color: themeColors.subtext }]}>
          Rate your current state (1-5 scale)
        </Text>
        {!canSubmitScale && (
          <Text style={[styles.warningText, { color: themeColors.warning }]}>
            You can only submit one drunk scale rating per day
          </Text>
        )}
      </View>

      <View style={styles.scaleContainer}>
        {DRUNK_SCALE_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.scaleOption,
              {
                backgroundColor: localStats.drunk_scale === option.value 
                  ? themeColors.primary 
                  : themeColors.background,
                borderColor: themeColors.primary,
                opacity: (!canSubmitScale || !canSaveStats || isSaving) ? 0.5 : 1,
              }
            ]}
            onPress={() => onDrunkScaleSelect(option.value)}
            disabled={!canSubmitScale || !canSaveStats || isSaving}
          >
            <Text style={styles.scaleEmoji}>{option.emoji}</Text>
            <Text style={[
              styles.scaleValue,
              { color: localStats.drunk_scale === option.value ? 'white' : themeColors.text }
            ]}>
              {option.value}
            </Text>
            <Text style={[
              styles.scaleLabel,
              { color: localStats.drunk_scale === option.value ? 'white' : themeColors.subtext }
            ]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 24,
    paddingTop: 0,
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
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  scaleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  scaleOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  scaleEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  scaleValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  scaleLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});