import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, Alert } from 'react-native';
import { User, TrendingUp, MapPin, BarChart3, Settings } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { useAuthStore } from '@/stores/authStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';

export default function TrackingScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { signOut } = useAuthStore();
  const { profile, resetProfile } = useUserProfileStore();
  const { interactions } = useVenueInteractionStore();
  
  const totalInteractions = interactions.reduce((sum, interaction) => sum + (interaction.count || 0), 0);

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

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Your stats will be saved and restored when you sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: signOut
        }
      ]
    );
  };

  const handleResetStats = () => {
    Alert.alert(
      'Reset All Stats',
      'This will permanently delete all your progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            resetProfile();
            Alert.alert('Stats Reset', 'All your stats have been reset.');
          }
        }
      ]
    );
  };

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
        </View>

        {/* Stats Grid */}
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

          {/* Total Check-ins */}
          <View style={[styles.statCard, styles.fullWidthCard, { backgroundColor: themeColors.card }]}>
            <BarChart3 size={28} color={themeColors.primary} />
            <Text style={[styles.statNumber, { color: themeColors.text }]}>
              {totalInteractions}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
              Total Check-ins
            </Text>
          </View>

          {/* Activity Summary */}
          <View style={[styles.summaryCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.summaryTitle, { color: themeColors.text }]}>
              Activity Summary
            </Text>
            <Text style={[styles.summaryText, { color: themeColors.subtext }]}>
              You've been out {profile.nightsOut} {profile.nightsOut === 1 ? 'night' : 'nights'} and visited {profile.barsHit} different {profile.barsHit === 1 ? 'bar' : 'bars'}. 
              {totalInteractions > 0 && ` You've checked in ${totalInteractions} ${totalInteractions === 1 ? 'time' : 'times'} total.`}
            </Text>
            
            <Text style={[styles.persistenceNote, { color: themeColors.primary }]}>
              💾 Your stats are automatically saved and will persist even if you log out or reinstall the app.
            </Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Settings
          </Text>
          
          <Pressable 
            style={[styles.settingButton, { backgroundColor: themeColors.card }]}
            onPress={handleSignOut}
          >
            <Text style={[styles.settingButtonText, { color: themeColors.text }]}>
              Sign Out
            </Text>
            <Text style={[styles.settingButtonSubtext, { color: themeColors.subtext }]}>
              Your stats will be saved
            </Text>
          </Pressable>

          <Pressable 
            style={[styles.settingButton, styles.dangerButton, { backgroundColor: themeColors.error + '20' }]}
            onPress={handleResetStats}
          >
            <Text style={[styles.settingButtonText, { color: themeColors.error }]}>
              Reset All Stats
            </Text>
            <Text style={[styles.settingButtonSubtext, { color: themeColors.error }]}>
              Permanently delete all progress
            </Text>
          </Pressable>
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
    marginBottom: 24,
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
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
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
    marginBottom: 16,
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  persistenceNote: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  settingsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  settingButton: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  settingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingButtonSubtext: {
    fontSize: 12,
  },
  footer: {
    height: 24,
  },
});