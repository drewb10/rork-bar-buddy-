import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { MapPin, Clock, Star, Flame } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Venue } from '@/types/venue';
import { formatTimeSlot, formatOpenHours, formatPrice, getCurrentDay } from '@/utils';

interface VenueContentProps {
  venue: Venue;
  interactionData: {
    hotTimeData?: { time: string; likes: number };
  };
  todaySpecials: any[];
  compact?: boolean;
}

export default function VenueContent({ 
  venue, 
  interactionData, 
  todaySpecials, 
  compact = false 
}: VenueContentProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  if (compact) {
    return (
      <View style={styles.compactContent}>
        <Text style={[styles.compactName, { color: themeColors.text }]} numberOfLines={1}>
          {venue.name}
        </Text>
        <View style={styles.compactDetails}>
          <Text style={[styles.compactType, { color: themeColors.subtext }]} numberOfLines={1}>
            {venue.types.map(t => t.replace('-', ' ')).join(' • ')}
          </Text>
          <View style={styles.ratingContainer}>
            <Star size={12} color={themeColors.primary} fill={themeColors.primary} />
            <Text style={[styles.rating, { color: themeColors.subtext }]}>{venue.rating}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.name, { color: themeColors.text }]}>{venue.name}</Text>
        <View style={styles.ratingContainer}>
          <Star size={16} color={themeColors.primary} fill={themeColors.primary} />
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
          {formatPrice(venue.priceLevel)}
        </Text>
      </View>

      {/* Hot Time Display */}
      {interactionData.hotTimeData && (
        <View style={[styles.hotTimeBadge, { backgroundColor: themeColors.primary + '20' }]}>
          <Flame size={14} color={themeColors.primary} />
          <Text style={[styles.hotTimeText, { color: themeColors.primary }]}>
            Hot Time: {formatTimeSlot(interactionData.hotTimeData.time)} — {interactionData.hotTimeData.likes} Likes
          </Text>
        </View>
      )}
      
      {/* Today's Specials */}
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
      
      {/* Venue Info */}
      <View style={styles.infoContainer}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  compactContent: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.3,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontWeight: '700',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    alignItems: 'center',
  },
  typeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    letterSpacing: 0.2,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
  },
  hotTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hotTimeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  specialsContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  specialsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  specialText: {
    fontSize: 13,
    marginBottom: 2,
    lineHeight: 18,
    fontWeight: '500',
  },
  infoContainer: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  compactDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactType: {
    fontSize: 12,
    flex: 1,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
});