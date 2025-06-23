import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Clock, Star } from 'lucide-react-native';
import { Venue } from '@/types/venue';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

interface VenueCardProps {
  venue: Venue;
}

export default function VenueCard({ venue }: VenueCardProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const handlePress = () => {
    router.push(`/venue/${venue.id}`);
  };

  const renderPriceLevel = () => {
    const symbols = [];
    for (let i = 0; i < venue.priceLevel; i++) {
      symbols.push('$');
    }
    return symbols.join('');
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
      <Image source={{ uri: venue.featuredImage }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: themeColors.text }]}>{venue.name}</Text>
          <View style={styles.ratingContainer}>
            <Star size={16} color={themeColors.accent} fill={themeColors.accent} />
            <Text style={[styles.rating, { color: themeColors.text }]}>{venue.rating}</Text>
          </View>
        </View>
        
        <View style={styles.typeContainer}>
          {venue.types.map((type, index) => (
            <View 
              key={index} 
              style={[styles.typeTag, { backgroundColor: themeColors.primary + '20' }]}
            >
              <Text style={[styles.typeText, { color: themeColors.primary }]}>
                {type.replace('-', ' ')}
              </Text>
            </View>
          ))}
          <Text style={[styles.price, { color: themeColors.subtext }]}>
            {renderPriceLevel()}
          </Text>
        </View>
        
        {todaySpecials.length > 0 && (
          <View style={[styles.specialsContainer, { backgroundColor: 'rgba(255,106,0,0.1)' }]}>
            <Text style={[styles.specialsTitle, { color: themeColors.primary }]}>
              Today's Specials:
            </Text>
            {todaySpecials.map((special, index) => (
              <Text key={index} style={[styles.specialText, { color: themeColors.text }]}>
                • {special.title}: {special.description}
              </Text>
            ))}
          </View>
        )}
        
        <View style={styles.infoRow}>
          <MapPin size={16} color={themeColors.subtext} />
          <Text style={[styles.infoText, { color: themeColors.subtext }]} numberOfLines={1}>
            {venue.address.split(',')[0]}
          </Text>
        </View>
        
        {venue.openHours.find(h => h.day === getCurrentDay() && !h.closed) && (
          <View style={styles.infoRow}>
            <Clock size={16} color={themeColors.subtext} />
            <Text style={[styles.infoText, { color: themeColors.subtext }]}>
              {formatOpenHours(venue.openHours.find(h => h.day === getCurrentDay()))}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function getCurrentDay(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

function formatOpenHours(hours?: { open: string; close: string; closed?: boolean }): string {
  if (!hours || hours.closed) return 'Closed today';
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}${minutes !== '00' ? ':' + minutes : ''} ${hour >= 12 ? 'PM' : 'AM'}`;
  };
  
  return `${formatTime(hours.open)} - ${formatTime(hours.close)}`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontWeight: '600',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    alignItems: 'center',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  price: {
    fontSize: 14,
    fontWeight: '500',
  },
  specialsContainer: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
  },
  specialsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  specialText: {
    fontSize: 13,
    marginBottom: 2,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
  },
});