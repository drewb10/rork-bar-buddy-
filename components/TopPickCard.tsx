import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Flame } from 'lucide-react-native';
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
          <Flame size={10} color="white" fill="white" />
          <Text style={styles.flameText}>{likeCount}</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={[styles.venueName, { color: themeColors.text }]} numberOfLines={2}>
          {venue.name}
        </Text>
        
        <Text style={[styles.venueType, { color: themeColors.subtext }]} numberOfLines={1}>
          {venue.types[0]?.replace('-', ' ')}
        </Text>

        {/* Hot Time Display */}
        {hotTimeData && (
          <View style={[styles.hotTimeBadge, { backgroundColor: themeColors.primary + '20' }]}>
            <Flame size={10} color={themeColors.primary} />
            <Text style={[styles.hotTimeText, { color: themeColors.primary }]}>
              Hot: {formatTimeSlot(hotTimeData.time)}
            </Text>
          </View>
        )}

        {/* Today's Special */}
        {todaySpecials.length > 0 && (
          <Text style={[styles.specialText, { color: themeColors.accent }]} numberOfLines={2}>
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
    width: 150, // Increased from 120 to 150 (25% increase)
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  image: {
    width: '100%',
    height: 80,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 80,
  },
  flameBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  flameText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '700',
    marginLeft: 2,
  },
  content: {
    flex: 1,
    padding: 8,
  },
  venueName: {
    fontSize: 12, // Slightly increased for better readability with wider card
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  venueType: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  hotTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  hotTimeText: {
    fontSize: 8,
    fontWeight: '700',
    marginLeft: 3,
  },
  specialText: {
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 12,
  },
});