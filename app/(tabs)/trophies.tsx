import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform } from 'react-native';
import { Trophy, Award, Star, Target, CheckCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useAchievementStore } from '@/stores/achievementStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';

export default function TrophiesScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { profile, getRank } = useUserProfileStore();
  const { achievements } = useAchievementStore();
  
  const rankInfo = getRank();
  const completedAchievements = achievements.filter(a => a.completed);

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
            Trophy Case
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
                {completedAchievements.length}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Achievements
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

        {/* Earned Achievements */}
        {completedAchievements.length > 0 && (
          <View style={[styles.achievementsCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.achievementsHeader}>
              <Trophy size={24} color={themeColors.primary} />
              <Text style={[styles.achievementsTitle, { color: themeColors.text }]}>
                Earned Achievements
              </Text>
            </View>
            <View style={styles.achievementsList}>
              {completedAchievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <View style={styles.achievementDetails}>
                    <Text style={[styles.achievementName, { color: themeColors.text }]}>
                      {achievement.title}
                    </Text>
                    <Text style={[styles.achievementDesc, { color: themeColors.subtext }]}>
                      {achievement.description}
                    </Text>
                    {achievement.completedAt && (
                      <Text style={[styles.achievementDate, { color: themeColors.subtext }]}>
                        Earned {new Date(achievement.completedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <CheckCircle size={20} color={themeColors.primary} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Cumulative Stats */}
        <View style={[styles.cumulativeCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.cumulativeHeader}>
            <Target size={24} color={themeColors.accent} />
            <Text style={[styles.cumulativeTitle, { color: themeColors.text }]}>
              Lifetime Stats
            </Text>
          </View>
          <View style={styles.cumulativeGrid}>
            <View style={styles.cumulativeItem}>
              <Text style={[styles.cumulativeNumber, { color: themeColors.text }]}>
                {profile.totalShots || 0}
              </Text>
              <Text style={[styles.cumulativeLabel, { color: themeColors.subtext }]}>
                Shots
              </Text>
            </View>
            <View style={styles.cumulativeItem}>
              <Text style={[styles.cumulativeNumber, { color: themeColors.text }]}>
                {profile.totalBeers || 0}
              </Text>
              <Text style={[styles.cumulativeLabel, { color: themeColors.subtext }]}>
                Beers
              </Text>
            </View>
            <View style={styles.cumulativeItem}>
              <Text style={[styles.cumulativeNumber, { color: themeColors.text }]}>
                {profile.totalBeerTowers || 0}
              </Text>
              <Text style={[styles.cumulativeLabel, { color: themeColors.subtext }]}>
                Beer Towers
              </Text>
            </View>
            <View style={styles.cumulativeItem}>
              <Text style={[styles.cumulativeNumber, { color: themeColors.text }]}>
                {profile.totalScoopAndScores || 0}
              </Text>
              <Text style={[styles.cumulativeLabel, { color: themeColors.subtext }]}>
                Scoop & Scores
              </Text>
            </View>
            <View style={styles.cumulativeItem}>
              <Text style={[styles.cumulativeNumber, { color: themeColors.text }]}>
                {profile.totalFunnels || 0}
              </Text>
              <Text style={[styles.cumulativeLabel, { color: themeColors.subtext }]}>
                Funnels
              </Text>
            </View>
            <View style={styles.cumulativeItem}>
              <Text style={[styles.cumulativeNumber, { color: themeColors.text }]}>
                {profile.totalShotguns || 0}
              </Text>
              <Text style={[styles.cumulativeLabel, { color: themeColors.subtext }]}>
                Shotguns
              </Text>
            </View>
            <View style={styles.cumulativeItem}>
              <Text style={[styles.cumulativeNumber, { color: themeColors.text }]}>
                {profile.totalPoolGamesWon || 0}
              </Text>
              <Text style={[styles.cumulativeLabel, { color: themeColors.subtext }]}>
                Pool Wins
              </Text>
            </View>
            <View style={styles.cumulativeItem}>
              <Text style={[styles.cumulativeNumber, { color: themeColors.text }]}>
                {profile.totalDartGamesWon || 0}
              </Text>
              <Text style={[styles.cumulativeLabel, { color: themeColors.subtext }]}>
                Dart Wins
              </Text>
            </View>
          </View>
        </View>

        {completedAchievements.length === 0 && (
          <View style={[styles.emptyStateCard, { backgroundColor: themeColors.card }]}>
            <Trophy size={48} color={themeColors.subtext} />
            <Text style={[styles.emptyStateTitle, { color: themeColors.text }]}>
              No Trophies Yet
            </Text>
            <Text style={[styles.emptyStateText, { color: themeColors.subtext }]}>
              Complete achievements to earn trophies for your case!
            </Text>
          </View>
        )}

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
    fontSize: 24,
    fontWeight: '700',
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
  achievementsCard: {
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
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 14,
    marginBottom: 2,
  },
  achievementDate: {
    fontSize: 12,
  },
  cumulativeCard: {
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
  cumulativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cumulativeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  cumulativeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cumulativeItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  cumulativeNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  cumulativeLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyStateCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    height: 24,
  },
});