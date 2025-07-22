import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import BarBuddyLogo from '@/components/BarBuddyLogo';

// FEATURE: TROPHIES - MVP Version (Disabled)
// All complex trophy logic is preserved and can be restored by enabling feature flag

export default function TrophiesScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  // Feature flag check - return null if trophies are disabled
  if (!FEATURE_FLAGS.ENABLE_TROPHIES) {
    return null; // This tab won't be shown in navigation when disabled
  }

  // When trophies are enabled, this would contain the full component
  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      
      <View style={styles.header}>
        <BarBuddyLogo size="small" />
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          Trophies
        </Text>
      </View>

      <View style={styles.comingSoon}>
        <Text style={styles.comingSoonIcon}>🏅</Text>
        <Text style={[styles.comingSoonTitle, { color: themeColors.text }]}>
          Trophies Coming Soon
        </Text>
        <Text style={[styles.comingSoonText, { color: themeColors.subtext }]}>
          Trophy collection, rare achievements, and special recognition will be available soon!
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
FEATURE: TROPHIES - COMPONENT DISABLED FOR MVP

To restore trophies:
1. Set ENABLE_TROPHIES = true in constants/featureFlags.ts
2. Implement full trophies component with:
   - Trophy collection display
   - Rare achievement trophies
   - Special recognition system
   - Trophy categories and rarities
   - Visual trophy showcase
   - Trophy earning animations

This placeholder ensures the app doesn't crash when the trophies tab
is conditionally hidden in the navigation.
*/