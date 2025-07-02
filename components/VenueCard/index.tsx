import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, Star, MapPin, Clock, Flame, TrendingUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Venue } from '@/types/venue';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { getCurrentDay, generateTimeSlots } from '@/utils';

import VenueModals from './VenueModals';
import ChatModal from '@/components/ChatModal';

interface VenueCardProps {
  venue: Venue;
  compact?: boolean;
}

export default function VenueCard({ venue, compact = false }: VenueCardProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  
  const { 
    incrementInteraction, 
    likeVenue,
    canInteract,
    canLikeVenue,
    forceUpdate,
    getInteractionCount,
    getLikeCount,
    getHotTimeWithLikes,
  } = useVenueInteractionStore();
  
  const { incrementNightsOut, incrementBarsHit, canIncrementNightsOut } = useUserProfileStore();
  
  // Local state for real-time UI updates
  const [localLikeCount, setLocalLikeCount] = useState<number | null>(null);
  const [localCanLike, setLocalCanLike] = useState<boolean | null>(null);
  const [localHotTime, setLocalHotTime] = useState<{ time: string; likes: number } | null>(null);
  
  // Modal states
  const [rsvpModalVisible, setRsvpModalVisible] = useState(false);
  const [likeModalVisible, setLikeModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLikeTime, setSelectedLikeTime] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Memoized interaction data - fix the null to undefined conversion
  const interactionData = useMemo(() => {
    const hotTimeData = localHotTime !== null ? localHotTime : getHotTimeWithLikes(venue.id);
    
    return {
      interactionCount: getInteractionCount(venue.id),
      likeCount: localLikeCount !== null ? localLikeCount : getLikeCount(venue.id),
      hotTimeData: hotTimeData || undefined, // Convert null to undefined
      canInteractWithVenue: canInteract(venue.id),
      canLikeThisVenue: localCanLike !== null ? localCanLike : canLikeVenue(venue.id),
    };
  }, [venue.id, localLikeCount, localCanLike, localHotTime, getInteractionCount, getLikeCount, getHotTimeWithLikes, canInteract, canLikeVenue]);

  // Memoized venue data
  const venueData = useMemo(() => ({
    todaySpecials: venue.specials.filter(special => special.day === getCurrentDay()),
    timeSlots: generateTimeSlots(),
  }), [venue.specials]);

  // Event handlers
  const handlePress = useCallback(() => {
    if (isInteracting || isLiking) return;
    router.push(`/venue/${venue.id}`);
  }, [isInteracting, isLiking, router, venue.id]);

  const handleChatPress = useCallback((e: any) => {
    e.stopPropagation();
    setChatModalVisible(true);
  }, []);

  const handleLikePress = useCallback((e: any) => {
    e.stopPropagation();
    if (!interactionData.canLikeThisVenue || isLiking) return;
    setIsLiking(true);
    setLikeModalVisible(true);
  }, [interactionData.canLikeThisVenue, isLiking]);

  const handleRsvpSubmit = useCallback(async () => {
    if (!selectedTime) return;
    
    try {
      incrementInteraction(venue.id, selectedTime);
      await incrementBarsHit();
      
      if (canIncrementNightsOut()) {
        await incrementNightsOut();
      }
      
      setRsvpModalVisible(false);
      setSelectedTime(null);
      setIsInteracting(false);
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      setIsInteracting(false);
    }
  }, [selectedTime, venue.id, incrementInteraction, incrementBarsHit, canIncrementNightsOut, incrementNightsOut]);

  const handleLikeSubmit = useCallback(async () => {
    if (!selectedLikeTime) return;
    
    try {
      // Immediate UI update
      const currentLikeCount = getLikeCount(venue.id);
      setLocalLikeCount(currentLikeCount + 1);
      setLocalCanLike(false);
      setLocalHotTime({ time: selectedLikeTime, likes: 1 });
      
      // Submit like
      likeVenue(venue.id, selectedLikeTime);
      
      // Force update
      setTimeout(() => forceUpdate(), 100);
      
      setLikeModalVisible(false);
      setSelectedLikeTime(null);
      setIsLiking(false);
    } catch (error) {
      console.error('Error submitting like:', error);
      // Revert local state on error
      setLocalLikeCount(null);
      setLocalCanLike(null);
      setLocalHotTime(null);
      setIsLiking(false);
    }
  }, [selectedLikeTime, venue.id, likeVenue, getLikeCount, forceUpdate]);

  const handleModalCancel = useCallback((type: 'rsvp' | 'like') => {
    if (type === 'rsvp') {
      setRsvpModalVisible(false);
      setSelectedTime(null);
      setIsInteracting(false);
    } else {
      setLikeModalVisible(false);
      setSelectedLikeTime(null);
      setIsLiking(false);
    }
  }, []);

  if (compact) {
    return (
      <View>
        <Pressable style={styles.compactCard} onPress={handlePress}>
          <View style={styles.compactImageContainer}>
            <Image source={{ uri: venue.featuredImage }} style={styles.compactImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.compactGradient}
            />
            
            {/* Like button */}
            <Pressable 
              style={[styles.compactLikeButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
              onPress={handleLikePress}
            >
              <Heart 
                size={14} 
                color={interactionData.canLikeThisVenue ? '#FF385C' : 'white'} 
                fill={interactionData.canLikeThisVenue ? 'transparent' : '#FF385C'}
              />
            </Pressable>

            {/* Rating badge */}
            <View style={styles.ratingBadge}>
              <Star size={10} color="white" fill="white" />
              <Text style={styles.ratingText}>{venue.rating}</Text>
            </View>
          </View>
          
          <View style={styles.compactContent}>
            <Text style={styles.compactVenueName} numberOfLines={1}>
              {venue.name}
            </Text>
            <Text style={styles.compactVenueType} numberOfLines={1}>
              {venue.types.map(t => t.replace('-', ' ')).join(' • ')}
            </Text>
            <Text style={styles.compactPrice}>
              {'$'.repeat(venue.priceLevel)}
            </Text>
          </View>
        </Pressable>

        <ChatModal
          visible={chatModalVisible}
          onClose={() => setChatModalVisible(false)}
          venue={venue}
        />
      </View>
    );
  }

  return (
    <View>
      <Pressable style={styles.card} onPress={handlePress}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: venue.featuredImage }} style={styles.image} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          />
          
          {/* Top Action Bar */}
          <View style={styles.topActionBar}>
            {/* Hot count */}
            {interactionData.likeCount > 0 && (
              <View style={styles.hotBadge}>
                <Flame size={14} color="white" fill="#FF6B35" />
                <Text style={styles.hotCount}>{interactionData.likeCount}</Text>
              </View>
            )}
            
            <View style={styles.actionButtons}>
              <Pressable style={styles.actionButton} onPress={handleChatPress}>
                <MessageCircle size={16} color="white" />
              </Pressable>
              
              <Pressable 
                style={[styles.actionButton, styles.likeButton]}
                onPress={handleLikePress}
              >
                <Heart 
                  size={16} 
                  color={interactionData.canLikeThisVenue ? 'white' : '#FF385C'} 
                  fill={interactionData.canLikeThisVenue ? 'transparent' : '#FF385C'}
                />
              </Pressable>
            </View>
          </View>

          {/* Rating overlay */}
          <View style={styles.ratingOverlay}>
            <Star size={12} color="white" fill="white" />
            <Text style={styles.overlayRating}>{venue.rating}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.venueName}>{venue.name}</Text>
              <View style={styles.venueTypes}>
                {venue.types.slice(0, 2).map((type, index) => (
                  <View key={index} style={styles.typeChip}>
                    <Text style={styles.typeText}>{type.replace('-', ' ')}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>{'$'.repeat(venue.priceLevel)}</Text>
            </View>
          </View>

          {/* Hot Time */}
          {interactionData.hotTimeData && (
            <View style={styles.hotTimeContainer}>
              <TrendingUp size={14} color="#FF6B35" />
              <Text style={styles.hotTimeText}>
                Peak: {interactionData.hotTimeData.time} • {interactionData.hotTimeData.likes} likes
              </Text>
            </View>
          )}

          {/* Today's Specials */}
          {venueData.todaySpecials.length > 0 && (
            <View style={styles.specialsContainer}>
              <Text style={styles.specialsTitle}>Today's Specials</Text>
              {venueData.todaySpecials.slice(0, 2).map((special, index) => (
                <Text key={index} style={styles.specialText}>
                  • {special.title}: {special.description}
                </Text>
              ))}
            </View>
          )}

          {/* Location & Hours */}
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <MapPin size={14} color="#8E8E93" />
              <Text style={styles.infoText} numberOfLines={1}>
                {venue.address.split(',')[0]}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Clock size={14} color="#8E8E93" />
              <Text style={styles.infoText}>
                Open until 2:00 AM
              </Text>
            </View>
          </View>
        </View>
      </Pressable>

      <VenueModals
        venue={venue}
        rsvpModalVisible={rsvpModalVisible}
        likeModalVisible={likeModalVisible}
        selectedTime={selectedTime}
        selectedLikeTime={selectedLikeTime}
        timeSlots={venueData.timeSlots}
        onTimeSelect={setSelectedTime}
        onLikeTimeSelect={setSelectedLikeTime}
        onRsvpSubmit={handleRsvpSubmit}
        onLikeSubmit={handleLikeSubmit}
        onCancel={handleModalCancel}
      />

      <ChatModal
        visible={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
        venue={venue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Full Card Styles
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  
  imageContainer: {
    height: 240,
    position: 'relative',
  },
  
  image: {
    width: '100%',
    height: '100%',
  },
  
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  topActionBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
  },
  
  hotCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  
  likeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  
  ratingOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  overlayRating: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  content: {
    padding: 20,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  
  headerLeft: {
    flex: 1,
  },
  
  venueName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  
  venueTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  
  typeChip: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
  },
  
  typeText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  
  priceContainer: {
    alignItems: 'center',
  },
  
  priceText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  
  hotTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,53,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  
  hotTimeText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  specialsContainer: {
    backgroundColor: 'rgba(255,193,7,0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderLeft: 3,
    borderLeftColor: '#FFC107',
  },
  
  specialsTitle: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  
  specialText: {
    color: '#E5E5E7',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
    lineHeight: 18,
  },
  
  infoContainer: {
    gap: 8,
  },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  infoText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },

  // Compact Card Styles
  compactCard: {
    width: 180,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  
  compactImageContainer: {
    height: 120,
    position: 'relative',
  },
  
  compactImage: {
    width: '100%',
    height: '100%',
  },
  
  compactGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  compactLikeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  
  ratingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  
  compactContent: {
    padding: 12,
  },
  
  compactVenueName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  
  compactVenueType: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  
  compactPrice: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
  },
});