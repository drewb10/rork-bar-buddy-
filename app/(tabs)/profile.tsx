import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform } from 'react-native';
import { User, TrendingUp, MapPin, Award } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';

export default function ProfileScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { profile } = useUserProfileStore();

  const formatJoinDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return 'Recently';
    }
  };

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
            Your Bar Buddy Stats
          </Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: themeColors.card }]}>
          <View style={[styles.avatar, { backgroundColor: themeColors.primary }]}>
            <User size={32} color="white" />
          </View>
          
          <Text style={[styles.userName, { color: themeColors.text }]}>
            {profile.firstName} {profile.lastName}
          </Text>
          
          <Text style={[styles.joinDate, { color: themeColors.subtext }]}>
            Member since {formatJoinDate(profile.joinDate)}
          </Text>

          {profile.userId && (
            <Text style={[styles.userId, { color: themeColors.primary }]}>
              {profile.userId}
            </Text>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Your Nightlife Stats
          </Text>
          
          <View style={styles.statsGrid}>
            {/* Nights Out */}
            <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
              <TrendingUp size={28} color={themeColors.primary} />
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {profile.nightsOut}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Nights Out
              </Text>
            </View>

            {/* Bars Hit */}
            <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
              <MapPin size={28} color={themeColors.primary} />
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {profile.barsHit}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Bars Hit
              </Text>
            </View>
          </View>

          {/* XP Card */}
          <View style={[styles.statCard, styles.fullWidthCard, { backgroundColor: themeColors.card }]}>
            <Award size={28} color={themeColors.primary} />
            <Text style={[styles.statNumber, { color: themeColors.text }]}>
              {profile.xp}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
              Experience Points
            </Text>
          </View>

          {/* Activity Summary */}
          <View style={[styles.summaryCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.summaryText, { color: themeColors.subtext }]}>
              You have been out {profile.nightsOut} {profile.nightsOut === 1 ? 'night' : 'nights'} and visited {profile.barsHit} different {profile.barsHit === 1 ? 'bar' : 'bars'}.
            </Text>
          </View>
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
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  joinDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  userId: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fullWidthCard: {
    flex: 0,
    width: '100%',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    height: 24,
  },
});