import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform } from 'react-native';
import { Trophy, Target, Users, Star } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';

export default function TrackingScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: '#121212' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <BarBuddyLogo size="small" />
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Achievement Tracking
          </Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.subtext }]}>
            Complete achievements during your nights out!
          </Text>
        </View>

        {/* Coming Soon */}
        <View style={[styles.comingSoonCard, { backgroundColor: themeColors.card }]}>
          <Trophy size={48} color={themeColors.primary} />
          <Text style={[styles.comingSoonTitle, { color: themeColors.text }]}>
            Achievement System
          </Text>
          <Text style={[styles.comingSoonText, { color: themeColors.subtext }]}>
            Track your nightlife achievements and unlock rewards! Coming soon...
          </Text>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  comingSoonCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    height: 24,
  },
});