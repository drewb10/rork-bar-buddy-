import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Venue } from '@/types/venue';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { getCurrentDay, generateTimeSlots } from '@/utils';

import VenueImage from './VenueImage';
import VenueContent from './VenueContent';
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

  // Memoized interaction data
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

  const handleInteraction = useCallback(() => {
    if (!interactionData.canInteractWithVenue || isInteracting) return;
    setIsInteracting(true);
    setRsvpModalVisible(true);
  }, [interactionData.canInteractWithVenue, isInteracting]);

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
        <Pressable 
          style={[styles.compactCard, { backgroundColor: themeColors.card }]} 
          onPress={handlePress}
          disabled={isInteracting || isLiking}
        >
          <VenueImage 
            venue={venue} 
            interactionData={interactionData}
            compact={true}
            onChatPress={handleChatPress}
            isLiking={isLiking}
          />
          
          <VenueContent 
            venue={venue}
            interactionData={interactionData}
            todaySpecials={venueData.todaySpecials}
            compact={true}
          />
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
      <Pressable 
        style={[styles.card, { backgroundColor: themeColors.card }]} 
        onPress={handlePress}
        disabled={isInteracting || isLiking}
      >
        <VenueImage 
          venue={venue} 
          interactionData={interactionData}
          onChatPress={handleChatPress}
          onLikePress={handleLikePress}
          isLiking={isLiking}
        />
        
        <VenueContent 
          venue={venue}
          interactionData={interactionData}
          todaySpecials={venueData.todaySpecials}
        />
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
  card: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  compactCard: {
    width: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});