import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Star, Heart } from 'lucide-react-native';
import { Venue, Special } from '@/types/venue';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { LinearGradient } from 'expo-linear-gradient';

interface TopPickCardProps {
  venue: Venue;
  todaySpecial?: Special;
}

export default function TopPickCard({ venue, todaySpecial }: TopPickCardProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { getLikeCount } = useVenueInteractionStore();
  const [pressAnimation] = useState(new Animated.Value(1));
  
  const likeCount = getLikeCount(venue.id);

  const handlePressIn = () => {
    Animated.spring(pressAnimation, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePress = () => {
    router.push(`/venue/${venue.id}${todaySpecial ? `?specialId=${todaySpecial.id}` : ''}`);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}${minutes !== '00' ? ':' + minutes : ''} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <Animated.View style={{ transform: [{ scale: pressAnimation }] }}>
      <Pressable 
        style={[styles.card, { 
          backgroundColor: themeColors.cardElevated,
          shadowColor: themeColors.shadowSecondary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
        }]} 
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Image 
          source={{ uri: venue.featuredImage }} 
          style={styles.image} 
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        />
        
        {/* Like count badge */}
        {likeCount > 0 && (
          <View style={[styles.likeBadge, { 
            backgroundColor: themeColors.primary,
            shadowColor: themeColors.shadowPrimary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }]}>
            <Heart size={10} color="white" fill="white" />
            <Text style={styles.likeText}>{likeCount}</Text>
          </View>
        )}
        
        <View style={styles.content}>
          <Text style={[styles.venueName, { color: themeColors.text }]} numberOfLines={1}>
            {venue.name}
          </Text>
          
          <View style={styles.ratingContainer}>
            <Star size={12} color={themeColors.accent} fill={themeColors.accent} />
            <Text style={[styles.rating, { color: themeColors.subtext }]}>{venue.rating}</Text>
          </View>

          {todaySpecial ? (
            <View style={styles.specialContainer}>
              <Text style={[styles.specialTitle, { color: themeColors.primary }]} numberOfLines={1}>
                {todaySpecial.title}
              </Text>
              <Text style={[styles.specialDescription, { color: themeColors.subtext }]} numberOfLines={2}>
                {todaySpecial.description}
              </Text>
              <View style={styles.timeContainer}>
                <Clock size={10} color={themeColors.subtext} />
                <Text style={[styles.timeText, { color: themeColors.subtext }]}>
                  {formatTime(todaySpecial.startTime)} - {formatTime(todaySpecial.endTime)}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.noSpecial, { color: themeColors.subtext }]}>
              No specials today
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 100,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  likeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  likeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },
  content: {
    padding: 12,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  specialContainer: {
    marginTop: 4,
  },
  specialTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  specialDescription: {
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: 4,
    fontSize: 10,
  },
  noSpecial: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
});