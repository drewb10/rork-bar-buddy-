import React from 'react';
import { StyleSheet, View, Text, Pressable, Image, Animated } from 'react-native';
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

  // Animation values for premium interactions
  const scaleAnim = new Animated.Value(1);

  const handlePress = () => {
    // Subtle press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
    
    router.push(`/venue/${venue.id}?specialId=${special.id}`);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}${minutes !== '00' ? ':' + minutes : ''} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  if (compact) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
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
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20, // Increased for premium feel
    marginBottom: 16,
    overflow: 'hidden',
    // Enhanced shadow system
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    // Subtle border
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    paddingHorizontal: 12, // More padding
    paddingVertical: 6,
    borderRadius: 16, // More rounded
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  specialTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700', // Bolder
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  content: {
    padding: 20, // Increased padding
  },
  title: {
    fontSize: 18,
    fontWeight: '700', // Bolder
    marginBottom: 6, // More spacing
    letterSpacing: 0.3,
  },
  venue: {
    fontSize: 14,
    fontWeight: '600', // Bolder
    marginBottom: 12, // More spacing
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16, // More spacing
    fontWeight: '500', // Slightly bolder
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16, // Add gap for better spacing
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500', // Slightly bolder
  },
  compactCard: {
    width: 160,
    borderRadius: 16, // More rounded
    overflow: 'hidden',
    marginRight: 12,
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    padding: 12, // More padding
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '700', // Bolder
    marginBottom: 4, // More spacing
    letterSpacing: 0.2,
  },
  compactVenue: {
    fontSize: 12,
    marginBottom: 8, // More spacing
    fontWeight: '500', // Slightly bolder
  },
  compactTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactTimeText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '500', // Slightly bolder
  },
});