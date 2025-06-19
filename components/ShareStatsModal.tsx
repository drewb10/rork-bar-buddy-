import React from 'react';
import { StyleSheet, View, Text, Pressable, Image, Alert } from 'react-native';
import { X, User, TrendingUp, MapPin, Award, Share2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface ShareStatsModalProps {
  profile: {
    firstName: string;
    lastName: string;
    nightsOut: number;
    barsHit: number;
    profilePicture?: string;
  };
  rankInfo: {
    rank: number;
    title: string;
    color: string;
  };
  onClose: () => void;
}

export default function ShareStatsModal({ profile, rankInfo, onClose }: ShareStatsModalProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const handleShare = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    Alert.alert(
      'Share Stats',
      'Take a screenshot of this card to share your Bar Buddy stats on social media!',
      [
        { text: 'Got it!', style: 'default' }
      ]
    );
  };

  return (
    <View style={styles.overlay}>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerText, { color: themeColors.text }]}>
            Share Your Stats
          </Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={24} color={themeColors.subtext} />
          </Pressable>
        </View>

        {/* Shareable Card */}
        <View style={[styles.shareCard, { backgroundColor: themeColors.card }]}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <BarBuddyLogo size="small" />
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            {profile.profilePicture ? (
              <Image source={{ uri: profile.profilePicture }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profilePlaceholder, { backgroundColor: themeColors.primary }]}>
                <User size={24} color="white" />
              </View>
            )}
            <Text style={[styles.profileName, { color: themeColors.text }]}>
              {profile.firstName} {profile.lastName}
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: themeColors.background }]}>
              <TrendingUp size={20} color={themeColors.primary} />
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {profile.nightsOut}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Nights Out
              </Text>
            </View>

            <View style={[styles.statItem, { backgroundColor: themeColors.background }]}>
              <MapPin size={20} color={themeColors.primary} />
              <Text style={[styles.statNumber, { color: themeColors.text }]}>
                {profile.barsHit}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                Bars Hit
              </Text>
            </View>
          </View>

          {/* Rank Badge */}
          <View style={[styles.rankBadge, { backgroundColor: themeColors.background }]}>
            <Award size={20} color={rankInfo.color} />
            <Text style={[styles.rankTitle, { color: rankInfo.color }]}>
              {rankInfo.title}
            </Text>
            <Text style={[styles.rankSubtext, { color: themeColors.subtext }]}>
              Rank {rankInfo.rank}/4
            </Text>
          </View>

          {/* Footer */}
          <Text style={[styles.footerText, { color: themeColors.subtext }]}>
            Track your nightlife with Bar Buddy
          </Text>
        </View>

        {/* Share Button */}
        <Pressable 
          style={[styles.shareButton, { backgroundColor: themeColors.primary }]}
          onPress={handleShare}
        >
          <Share2 size={20} color="white" />
          <Text style={styles.shareButtonText}>
            Take Screenshot to Share
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  shareCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoContainer: {
    marginBottom: 16,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  rankBadge: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '70%',
  },
  rankTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  rankSubtext: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});