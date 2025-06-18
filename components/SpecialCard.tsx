import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock } from 'lucide-react-native';
import { Special, Venue } from '@/types/venue';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { LinearGradient } from 'expo-linear-gradient';

interface SpecialCardProps {
  special: Special;
  venue: Venue;
  compact?: boolean;
}

export default function SpecialCard({ special, venue, compact = false }: SpecialCardProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const handlePress = () => {
    router.push(`/venue/${venue.id}?specialId=${special.id}`);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}${minutes !== '00' ? ':' + minutes : ''} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  if (compact) {
    return (
      <Pressable 
        style={[styles.compactCard, { backgroundColor: themeColors.card }]} 
        onPress={handlePress}
      >
        <Image 
          source={{ uri: special.imageUrl || venue.featuredImage }} 
          style={styles.compactImage} 
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.compactGradient}
        />
        <View style={styles.compactContent}>
          <Text style={[styles.compactTitle, { color: themeColors.text }]} numberOfLines={1}>
            {special.title}
          </Text>
          <Text style={[styles.compactVenue, { color: themeColors.subtext }]} numberOfLines={1}>
            {venue.name}
          </Text>
          <View style={styles.compactTimeRow}>
            <Calendar size={12} color={themeColors.primary} />
            <Text style={[styles.compactTimeText, { color: themeColors.subtext }]}>
              {special.day}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable 
      style={[styles.card, { backgroundColor: themeColors.card }]} 
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: special.imageUrl || venue.featuredImage }} 
          style={styles.image} 
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageGradient}
        />
        <View 
          style={[styles.specialType, { backgroundColor: themeColors.primary }]}
        >
          <Text style={styles.specialTypeText}>
            {special.type.replace('-', ' ')}
          </Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          {special.title}
        </Text>
        <Text style={[styles.venue, { color: themeColors.primary }]}>
          {venue.name}
        </Text>
        
        <Text style={[styles.description, { color: themeColors.subtext }]} numberOfLines={2}>
          {special.description}
        </Text>
        
        <View style={styles.footer}>
          <View style={styles.timeRow}>
            <Calendar size={14} color={themeColors.subtext} />
            <Text style={[styles.timeText, { color: themeColors.subtext }]}>
              {special.day}
            </Text>
          </View>
          
          <View style={styles.timeRow}>
            <Clock size={14} color={themeColors.subtext} />
            <Text style={[styles.timeText, { color: themeColors.subtext }]}>
              {formatTime(special.startTime)} - {formatTime(special.endTime)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
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
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  specialType: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  venue: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: 6,
    fontSize: 13,
  },
  compactCard: {
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
  compactImage: {
    width: '100%',
    height: 100,
  },
  compactGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  compactContent: {
    padding: 10,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  compactVenue: {
    fontSize: 12,
    marginBottom: 6,
  },
  compactTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactTimeText: {
    marginLeft: 4,
    fontSize: 11,
  },
});