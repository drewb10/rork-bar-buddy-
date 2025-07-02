import React from 'react';
import { StyleSheet, View, Image, Pressable, Text } from 'react-native';
import { Flame, MessageCircle, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Venue } from '@/types/venue';

interface VenueImageProps {
  venue: Venue;
  interactionData: {
    likeCount: number;
    canLikeThisVenue: boolean;
  };
  compact?: boolean;
  onChatPress: (e: any) => void;
  onLikePress?: (e: any) => void;
  isLiking?: boolean;
}

export default function VenueImage({ 
  venue, 
  interactionData, 
  compact = false, 
  onChatPress, 
  onLikePress,
  isLiking = false 
}: VenueImageProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const imageHeight = compact ? 100 : 180;

  return (
    <View style={[styles.container, { height: imageHeight }]}>
      <Image 
        source={{ uri: venue.featuredImage }} 
        style={[styles.image, { height: imageHeight }]} 
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={[styles.gradient, { height: imageHeight }]}
      />
      
      {/* Total likes display - top left */}
      {interactionData.likeCount > 0 && (
        <View style={[
          compact ? styles.compactTotalLikes : styles.totalLikes, 
          { backgroundColor: themeColors.primary }
        ]}>
          <Flame size={compact ? 12 : 18} color="white" fill="white" />
          <Text style={compact ? styles.compactLikesText : styles.likesText}>
            {interactionData.likeCount}
          </Text>
        </View>
      )}

      {/* Action buttons moved to right side */}
      <View style={compact ? styles.compactActionButtons : styles.actionButtons}>
        {/* Like button - rightmost position */}
        {!compact && onLikePress && (
          <Pressable 
            style={[
              styles.likeButton, 
              { 
                backgroundColor: interactionData.canLikeThisVenue ? themeColors.primary : themeColors.border,
                opacity: interactionData.canLikeThisVenue ? 1 : 0.3
              }
            ]}
            onPress={onLikePress}
            disabled={!interactionData.canLikeThisVenue || isLiking}
          >
            <Flame 
              size={18} 
              color="white"
              fill={interactionData.canLikeThisVenue ? "transparent" : "white"}
            />
          </Pressable>
        )}

        {/* Chat Button - second from right */}
        <Pressable 
          style={[
            compact ? styles.compactChatButton : styles.chatButton,
            { backgroundColor: themeColors.primary }
          ]}
          onPress={onChatPress}
        >
          <MessageCircle size={compact ? 14 : 18} color="white" />
        </Pressable>
      </View>

      {/* Analytics indicator for venues with data */}
      {!compact && interactionData.likeCount > 5 && (
        <View style={[styles.analyticsIndicator, { backgroundColor: themeColors.primary + '20' }]}>
          <TrendingUp size={12} color={themeColors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  totalLikes: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  compactTotalLikes: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  likesText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  compactLikesText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  // Action buttons container - moved to right
  actionButtons: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  compactActionButtons: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  compactChatButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  likeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  analyticsIndicator: {
    position: 'absolute',
    top: 60,
    left: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});