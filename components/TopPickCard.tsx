import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Star } from 'lucide-react-native';
import { Venue, Special } from '@/types/venue';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

interface TopPickCardProps {
  venue: Venue;
  todaySpecial?: Special;
}

export default function TopPickCard({ venue, todaySpecial }: TopPickCardProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const handlePress = () => {
    router.push(`/venue/${venue.id}${todaySpecial ? `?specialId=${todaySpecial.id}` : ''}`);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}${minutes !== '00' ? ':' + minutes : ''} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <Pressable 
      style={[styles.card, { backgroundColor: themeColors.card }]} 
      onPress={handlePress}
    >
      <Image 
        source={{ uri: venue.featuredImage }} 
        style={styles.image} 
      />
      
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
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 100,
  },
  content: {
    padding: 10,
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