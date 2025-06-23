import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform } from 'react-native';
import { Trophy, Award, Star } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';

export default function TrophiesScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { profile, getRank } = useUserProfileStore();
  
  const rankInfo = getRank();

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
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
            Your Stats & Achievements
          </Text>
        </View>

        {/* Stats Overview */}
        <View style={[styles.statsCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Trophy size={24} color={themeColors.primary} />
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {profile.venuesVisited || 0}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Venues Visited
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Award size={24} color={rankInfo.color} />
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {profile.xp}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Total XP
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Star size={24} color={themeColors.accent} />
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {profile.photosUploaded || 0}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Photos Taken
              </Text>
            </View>
          </View>
        </View>

        {/* Current Rank */}
        <View style={[styles.rankCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.rankContent}>
            <Award size={28} color={rankInfo.color} />
            <View style={styles.rankInfo}>
              <Text style={[styles.rankTitle, { color: rankInfo.color }]}>
                {rankInfo.title}
              </Text>
              <Text style={[styles.rankSubtitle, { color: themeColors.text }]}>
                {rankInfo.subTitle}
              </Text>
              <Text style={[styles.rankXP, { color: themeColors.subtext }]}>
                {profile.xp} XP
              </Text>
            </View>
          </View>
        </View>

        {/* Coming Soon */}
        <View style={[styles.comingSoonCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.comingSoonTitle, { color: themeColors.text }]}>
            More Features Coming Soon!
          </Text>
          <Text style={[styles.comingSoonText, { color: themeColors.subtext }]}>
            We are working on exciting new achievements and trophies for you to unlock.
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
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  rankCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankInfo: {
    marginLeft: 16,
    alignItems: 'center',
  },
  rankTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  rankSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  rankXP: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  comingSoonCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    height: 24,
  },
});