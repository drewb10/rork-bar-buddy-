import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, Flame } from 'lucide-react-native';
import { Venue } from '@/types/venue';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { LinearGradient } from 'expo-linear-gradient';

interface TopPickCardProps {
  venue: Venue;
}

export default function TopPickCard({ venue }: TopPickCardProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { getLikeCount, getHotTimeWithLikes } = useVenueInteractionStore();
  
  const likeCount = getLikeCount(venue.id);
  const hotTimeData = getHotTimeWithLikes(venue.id);

  const handlePress = () => {
    router.push(`/venue/${venue.id}`);
  };

  // Get today's specials
  const todaySpecials = venue.specials.filter(
    special => special.day === getCurrentDay()
  );

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
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      />
      
      {/* Flame count badge - top left */}
      {likeCount > 0 && (
        <View style={[styles.flameBadge, { backgroundColor: themeColors.primary }]}>
          <Flame size={12} color="white" fill="white" />
          <Text style={styles.flameText}>{likeCount}</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={[styles.venueName, { color: themeColors.text }]} numberOfLines={1}>
          {venue.name}
        </Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.ratingContainer}>
            <Star size={14} color={themeColors.accent} fill={themeColors.accent} />
            <Text style={[styles.rating, { color: themeColors.subtext }]}>{venue.rating}</Text>
          </View>
          
          <Text style={[styles.venueType, { color: themeColors.subtext }]} numberOfLines={1}>
            {venue.types[0]?.replace('-', ' ')}
          </Text>
        </View>

        {/* Hot Time Display */}
        {hotTimeData && (
          <View style={[styles.hotTimeBadge, { backgroundColor: themeColors.primary + '20' }]}>
            <Flame size={12} color={themeColors.primary} />
            <Text style={[styles.hotTimeText, { color: themeColors.primary }]}>
              Hot: {formatTimeSlot(hotTimeData.time)}
            </Text>
          </View>
        )}

        {/* Today's Special */}
        {todaySpecials.length > 0 && (
          <Text style={[styles.specialText, { color: themeColors.accent }]} numberOfLines={1}>
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

function formatTimeSlot(timeSlot: string): string {
  const [hours, minutes] = timeSlot.split(':');
  const hour = parseInt(hours);
  return `${hour % 12 || 12}${minutes !== '00' ? ':' + minutes : ''} ${hour >= 12 ? 'PM' : 'AM'}`;
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  image: {
    width: '100%',
    height: 120,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 120,
  },
  flameBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  flameText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  venueName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  venueType: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
    flex: 1,
    textAlign: 'right',
  },
  hotTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  hotTimeText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  specialText: {
    fontSize: 11,
    fontWeight: '600',
  },
});