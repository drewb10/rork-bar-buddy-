import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Flame } from 'lucide-react-native';
import { Venue } from '@/types/venue';
import { getThemeColors, spacing, typography, borderRadius, shadows } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { LinearGradient } from 'expo-linear-gradient';

interface TopPickCardProps {
  venue: Venue;
}

export default function TopPickCard({ venue }: TopPickCardProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = getThemeColors(theme);
  const { getLikeCount, getHotTimeWithLikes } = useVenueInteractionStore();

  const interactionData = useMemo(() => ({
    likeCount: getLikeCount(venue.id),
    hotTimeData: getHotTimeWithLikes(venue.id),
  }), [venue.id, getLikeCount, getHotTimeWithLikes]);

  const handlePress = () => {
    router.push(`/venue/${venue.id}`);
  };

  const formatTimeSlot = (timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const todaySpecials = useMemo(() => {
    return venue.specials.filter(
      special => special.day === getCurrentDay()
    );
  }, [venue.specials]);

  return (
    <Pressable 
      style={[styles.card, { backgroundColor: themeColors.card }]} 
      onPress={handlePress}
    >
      <Image 
        source={{ uri: venue.featuredImage }} 
        style={styles.image} 
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      />
      
      {interactionData.likeCount > 0 && (
        <View style={[styles.flameBadge, { backgroundColor: themeColors.primary }]}>
          <Flame size={10} color="white" fill="white" />
          <Text style={styles.flameText}>{interactionData.likeCount}</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={[styles.venueName, { color: themeColors.text }]} numberOfLines={2}>
          {venue.name}
        </Text>
        
        <Text style={[styles.venueType, { color: themeColors.subtext }]} numberOfLines={1}>
          {venue.types[0]?.replace('-', ' ')}
        </Text>

        {interactionData.hotTimeData && (
          <View style={[styles.hotTimeBadge, { backgroundColor: themeColors.primary + '20' }]}>
            <Flame size={8} color={themeColors.primary} />
            <Text style={[styles.hotTimeText, { color: themeColors.primary }]}>
              Hot: {formatTimeSlot(interactionData.hotTimeData.time)}
            </Text>
          </View>
        )}

        {todaySpecials.length > 0 && (
          <Text style={[styles.specialText, { color: themeColors.primary }]} numberOfLines={2}>
            {todaySpecials[0].title}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function getCurrentDay(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginRight: spacing.md,
    position: 'relative',
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  image: {
    width: '100%',
    height: 100,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 100,
  },
  flameBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  flameText: {
    color: 'white',
    ...typography.small,
    marginLeft: spacing.xs,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  venueName: {
    ...typography.bodyMedium,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  venueType: {
    ...typography.caption,
    textTransform: 'capitalize',
    marginBottom: spacing.sm,
  },
  hotTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    alignSelf: 'flex-start',
  },
  hotTimeText: {
    ...typography.small,
    marginLeft: spacing.xs,
  },
  specialText: {
    ...typography.caption,
    lineHeight: 16,
  },
});