import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import BarBuddyLogo from '@/components/BarBuddyLogo';

// FEATURE: ACHIEVEMENTS - MVP Version (Disabled)
// All complex achievement logic is preserved in the backup file: achievements.tsx.backup
// To restore: Set ENABLE_ACHIEVEMENTS to true in featureFlags.ts and copy from backup

export default function AchievementsScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  // Feature flag check - return null if achievements are disabled
  if (!FEATURE_FLAGS.ENABLE_ACHIEVEMENTS) {
    return null; // This tab won't be shown in navigation when disabled
  }

  // When achievements are enabled, this would contain the full component
  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      
      <View style={styles.header}>
        <BarBuddyLogo size="small" />
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          Achievements
        </Text>
      </View>

      <View style={styles.comingSoon}>
        <Text style={styles.comingSoonIcon}>🏆</Text>
        <Text style={[styles.comingSoonTitle, { color: themeColors.text }]}>
          Achievements Coming Soon
        </Text>
        <Text style={[styles.comingSoonText, { color: themeColors.subtext }]}>
          Task system, badges, and achievement tracking will be available in a future update!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  comingSoonIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

/* 
FEATURE: ACHIEVEMENTS - FULL COMPONENT PRESERVED IN achievements.tsx.backup

To restore achievements:
1. Set ENABLE_ACHIEVEMENTS = true in constants/featureFlags.ts
2. Copy content from achievements.tsx.backup to replace this file
3. Test achievement functionality
4. Enable achievement store and related components

All complex achievement logic including:
- Achievement tracking and progress
- Category-based achievement system
- Progress visualization
- Completion notifications
- Badge system
- Task management
- Social achievements
- Venue-specific achievements

...is preserved in the backup file for future restoration.
*/