import React from 'react';
import { StyleSheet, View, Text, Pressable, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, Flame, TrendingUp, MessageCircle } from 'lucide-react-native';
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
  const { getLikeCount, canLikeVenue } = useVenueInteractionStore();
  
  const likeCount = getLikeCount(venue.id);
  const canLikeThisVenue = canLikeVenue(venue.id);

  const handlePress = () => {
    router.push(`/venue/${venue.id}`);
  };

  const handleChatPress = (e: any) => {
    e.stopPropagation(); // Prevent venue navigation
    router.push(`/venue/${venue.id}`);
  };

  const handleLikePress = (e: any) => {
    e.stopPropagation(); // Prevent venue navigation
    router.push(`/venue/${venue.id}`);
  };

  return (
    <Pressable 
      style={[styles.card, { backgroundColor: themeColors.card }]} 
      onPress={handlePress}
    >
      <Image source={{ uri: venue.featuredImage }} style={styles.image} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      />
      
      {/* Total likes display - top left */}
      {likeCount > 0 && (
        <View style={[styles.totalLikesDisplay, { backgroundColor: themeColors.primary }]}>
          <Flame size={14} color="white" fill="white" />
          <Text style={styles.totalLikesText}>{likeCount}</Text>
        </View>
      )}

      {/* Like button - top right */}
      <Pressable 
        style={[
          styles.likeButton, 
          { 
            backgroundColor: canLikeThisVenue ? themeColors.primary : themeColors.border,
            opacity: canLikeThisVenue ? 1 : 0.3
          }
        ]}
        onPress={handleLikePress}
      >
        <Flame 
          size={14} 
          color="white"
          fill={canLikeThisVenue ? "transparent" : "white"}
        />
      </Pressable>

      {/* Chat Button */}
      <Pressable 
        style={[styles.chatButton, { backgroundColor: themeColors.primary }]}
        onPress={handleChatPress}
      >
        <MessageCircle size={14} color="white" />
      </Pressable>
      
      <View style={styles.content}>
        <Text style={[styles.name, { color: themeColors.text }]} numberOfLines={1}>
          {venue.name}
        </Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.ratingContainer}>
            <Star size={12} color={themeColors.accent} fill={themeColors.accent} />
            <Text style={[styles.rating, { color: themeColors.subtext }]}>{venue.rating}</Text>
          </View>
          
          <Text style={[styles.venueType, { color: themeColors.subtext }]} numberOfLines={1}>
            {venue.types[0]?.replace('-', ' ')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    height: 120,
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
    flexDirection: 'row',
  },
  image: {
    width: 120,
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 120,
    height: '100%',
  },
  totalLikesDisplay: {
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
  totalLikesText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chatButton: {
    position: 'absolute',
    top: 8,
    right: 44,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '700',
  },
  venueType: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'capitalize',
    flex: 1,
    textAlign: 'right',
  },
});