import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Clock, Star, Flame, TrendingUp, MessageCircle } from 'lucide-react-native';
import { Venue } from '@/types/venue';
import { getThemeColors, spacing, typography, borderRadius, shadows } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import ChatModal from '@/components/ChatModal';
import { LinearGradient } from 'expo-linear-gradient';

interface VenueCardProps {
  venue: Venue;
  compact?: boolean;
}

export default function VenueCard({ venue, compact = false }: VenueCardProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = getThemeColors(theme);
  const { 
    incrementInteraction, 
    getInteractionCount, 
    getLikeCount, 
    canInteract, 
    getHotTimeWithLikes,
    likeVenue,
    canLikeVenue,
    forceUpdate
  } = useVenueInteractionStore();
  const { incrementNightsOut, incrementBarsHit, canIncrementNightsOut } = useUserProfileStore();
  
  // Local state for real-time UI updates
  const [localLikeCount, setLocalLikeCount] = useState<number | null>(null);
  const [localCanLike, setLocalCanLike] = useState<boolean | null>(null);
  const [localHotTime, setLocalHotTime] = useState<{ time: string; likes: number } | null>(null);
  
  // Memoize interaction data
  const interactionData = useMemo(() => ({
    interactionCount: getInteractionCount(venue.id),
    likeCount: localLikeCount !== null ? localLikeCount : getLikeCount(venue.id),
    hotTimeData: localHotTime !== null ? localHotTime : getHotTimeWithLikes(venue.id),
    canInteractWithVenue: canInteract(venue.id),
    canLikeThisVenue: localCanLike !== null ? localCanLike : canLikeVenue(venue.id),
  }), [venue.id, getInteractionCount, getLikeCount, getHotTimeWithLikes, canInteract, canLikeVenue, localLikeCount, localCanLike, localHotTime]);

  const [rsvpModalVisible, setRsvpModalVisible] = useState(false);
  const [likeModalVisible, setLikeModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLikeTime, setSelectedLikeTime] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

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
    if (selectedTime) {
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
    }
  }, [selectedTime, venue.id, incrementInteraction, incrementBarsHit, canIncrementNightsOut, incrementNightsOut]);

  const handleLikeSubmit = useCallback(async () => {
    if (selectedLikeTime) {
      try {
        const currentLikeCount = getLikeCount(venue.id);
        setLocalLikeCount(currentLikeCount + 1);
        setLocalCanLike(false);
        
        const newHotTime = { time: selectedLikeTime, likes: 1 };
        setLocalHotTime(newHotTime);
        
        likeVenue(venue.id, selectedLikeTime);
        
        setTimeout(() => {
          forceUpdate();
        }, 100);
        
        setLikeModalVisible(false);
        setSelectedLikeTime(null);
        setIsLiking(false);
      } catch (error) {
        console.error('Error submitting like:', error);
        setLocalLikeCount(null);
        setLocalCanLike(null);
        setLocalHotTime(null);
        setIsLiking(false);
      }
    }
  }, [selectedLikeTime, venue.id, likeVenue, getLikeCount, forceUpdate]);

  const handleRsvpCancel = useCallback(() => {
    setRsvpModalVisible(false);
    setSelectedTime(null);
    setIsInteracting(false);
  }, []);

  const handleLikeCancel = useCallback(() => {
    setLikeModalVisible(false);
    setSelectedLikeTime(null);
    setIsLiking(false);
  }, []);

  const renderPriceLevel = useCallback(() => {
    const symbols = [];
    for (let i = 0; i < venue.priceLevel; i++) {
      symbols.push('$');
    }
    return symbols.join('');
  }, [venue.priceLevel]);

  const todaySpecials = useMemo(() => {
    return venue.specials.filter(
      special => special.day === getCurrentDay()
    );
  }, [venue.specials]);

  const timeSlots = useMemo(() => {
    const slots = [];
    const startHour = 19;
    const endHour = 2;
    
    for (let hour = startHour; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour}:${minute === 0 ? '00' : minute}`);
      }
    }
    
    for (let hour = 0; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour}:${minute === 0 ? '00' : minute}`);
      }
    }
    
    return slots;
  }, []);

  const formatTimeSlot = useCallback((timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  }, []);

  if (compact) {
    return (
      <View>
        <Pressable 
          style={[styles.compactCard, { backgroundColor: themeColors.card }]} 
          onPress={handlePress}
          disabled={isInteracting || isLiking}
        >
          <Image source={{ uri: venue.featuredImage }} style={styles.compactImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.compactGradient}
          />
          
          {interactionData.likeCount > 0 && (
            <View style={[styles.compactTotalLikes, { backgroundColor: themeColors.primary }]}>
              <Flame size={12} color="white" fill="white" />
              <Text style={styles.compactTotalLikesText}>{interactionData.likeCount}</Text>
            </View>
          )}

          <Pressable 
            style={[styles.compactChatButton, { backgroundColor: themeColors.primary }]}
            onPress={handleChatPress}
          >
            <MessageCircle size={14} color="white" />
          </Pressable>
          
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
        <Image source={{ uri: venue.featuredImage }} style={styles.image} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.imageGradient}
        />
        
        {interactionData.likeCount > 0 && (
          <View style={[styles.totalLikesDisplay, { backgroundColor: themeColors.primary }]}>
            <Flame size={16} color="white" fill="white" />
            <Text style={styles.totalLikesText}>{interactionData.likeCount}</Text>
          </View>
        )}

        <Pressable 
          style={[
            styles.likeButton, 
            { 
              backgroundColor: interactionData.canLikeThisVenue ? themeColors.primary : themeColors.border,
              opacity: interactionData.canLikeThisVenue ? 1 : 0.4
            }
          ]}
          onPress={handleLikePress}
          disabled={!interactionData.canLikeThisVenue || isLiking}
        >
          <Flame 
            size={16} 
            color="white"
            fill={interactionData.canLikeThisVenue ? "transparent" : "white"}
          />
        </Pressable>

        <Pressable 
          style={[styles.chatButton, { backgroundColor: themeColors.primary }]}
          onPress={handleChatPress}
        >
          <MessageCircle size={16} color="white" />
        </Pressable>

        {interactionData.likeCount > 5 && (
          <View style={[styles.analyticsIndicator, { backgroundColor: themeColors.primary + '20' }]}>
            <TrendingUp size={12} color={themeColors.primary} />
          </View>
        )}
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.name, { color: themeColors.text }]}>{venue.name}</Text>
            <View style={styles.ratingContainer}>
              <Star size={14} color={themeColors.primary} fill={themeColors.primary} />
              <Text style={[styles.rating, { color: themeColors.text }]}>{venue.rating}</Text>
            </View>
          </View>
          
          <View style={styles.typeContainer}>
            {venue.types.map((type, index) => (
              <View 
                key={index} 
                style={[styles.typeTag, { backgroundColor: themeColors.primary + '15' }]}
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

          {interactionData.hotTimeData && (
            <View style={[styles.hotTimeBadge, { backgroundColor: themeColors.primary + '15' }]}>
              <Flame size={12} color={themeColors.primary} />
              <Text style={[styles.hotTimeText, { color: themeColors.primary }]}>
                Hot Time: {formatTimeSlot(interactionData.hotTimeData.time)} — {interactionData.hotTimeData.likes} Likes
              </Text>
            </View>
          )}
          
          {todaySpecials.length > 0 && (
            <View style={[styles.specialsContainer, { backgroundColor: themeColors.primary + '10' }]}>
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
            <MapPin size={14} color={themeColors.subtext} />
            <Text style={[styles.infoText, { color: themeColors.subtext }]} numberOfLines={1}>
              {venue.address.split(',')[0]}
            </Text>
          </View>
          
          {venue.openHours.find(h => h.day === getCurrentDay() && !h.closed) && (
            <View style={styles.infoRow}>
              <Clock size={14} color={themeColors.subtext} />
              <Text style={[styles.infoText, { color: themeColors.subtext }]}>
                {formatOpenHours(venue.openHours.find(h => h.day === getCurrentDay()))}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      {/* RSVP Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={rsvpModalVisible}
        onRequestClose={handleRsvpCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { 
            backgroundColor: themeColors.glass?.background || themeColors.card,
            borderColor: themeColors.glass?.border || themeColors.border,
          }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              What time are you heading to {venue.name}?
            </Text>
            
            <View style={styles.timeSlotContainer}>
              {timeSlots.map((time, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.timeSlot,
                    { 
                      backgroundColor: selectedTime === time 
                        ? themeColors.primary 
                        : 'transparent',
                      borderColor: themeColors.primary
                    }
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text 
                    style={[
                      styles.timeSlotText, 
                      { color: selectedTime === time ? 'white' : themeColors.primary }
                    ]}
                  >
                    {formatTimeSlot(time)}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            <View style={styles.modalActions}>
              <Pressable 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={handleRsvpCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable 
                style={[
                  styles.modalButton, 
                  styles.submitButton, 
                  { 
                    backgroundColor: selectedTime ? themeColors.primary : themeColors.card,
                    opacity: selectedTime ? 1 : 0.5
                  }
                ]} 
                onPress={handleRsvpSubmit}
                disabled={!selectedTime}
              >
                <Text style={styles.submitButtonText}>Submit (+35 XP)</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Like Time Slot Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={likeModalVisible}
        onRequestClose={handleLikeCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { 
            backgroundColor: themeColors.glass?.background || themeColors.card,
            borderColor: themeColors.glass?.border || themeColors.border,
          }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              What time are you most likely to visit {venue.name}?
            </Text>
            
            <View style={styles.timeSlotContainer}>
              {timeSlots.map((time, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.timeSlot,
                    { 
                      backgroundColor: selectedLikeTime === time 
                        ? themeColors.primary 
                        : 'transparent',
                      borderColor: themeColors.primary
                    }
                  ]}
                  onPress={() => setSelectedLikeTime(time)}
                >
                  <Text 
                    style={[
                      styles.timeSlotText, 
                      { color: selectedLikeTime === time ? 'white' : themeColors.primary }
                    ]}
                  >
                    {formatTimeSlot(time)}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            <View style={styles.modalActions}>
              <Pressable 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={handleLikeCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable 
                style={[
                  styles.modalButton, 
                  styles.submitButton, 
                  { 
                    backgroundColor: selectedLikeTime ? themeColors.primary : themeColors.card,
                    opacity: selectedLikeTime ? 1 : 0.5
                  }
                ]} 
                onPress={handleLikeSubmit}
                disabled={!selectedLikeTime}
              >
                <Text style={styles.submitButtonText}>Like This Bar 🔥</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ChatModal
        visible={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
        venue={venue}
      />
    </View>
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
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  image: {
    width: '100%',
    height: 200,
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  totalLikesDisplay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  totalLikesText: {
    color: 'white',
    ...typography.smallMedium,
    marginLeft: spacing.xs,
  },
  likeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chatButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md + 52,
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  analyticsIndicator: {
    position: 'absolute',
    top: spacing.md + 52,
    left: spacing.md,
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  content: {
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  name: {
    ...typography.heading3,
    flex: 1,
    marginRight: spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: spacing.xs,
    ...typography.bodyMedium,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  typeTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  typeText: {
    ...typography.captionMedium,
    textTransform: 'capitalize',
  },
  price: {
    ...typography.bodyMedium,
  },
  hotTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    alignSelf: 'flex-start',
    ...shadows.sm,
  },
  hotTimeText: {
    ...typography.captionMedium,
    marginLeft: spacing.sm,
  },
  specialsContainer: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  specialsTitle: {
    ...typography.captionMedium,
    marginBottom: spacing.sm,
  },
  specialText: {
    ...typography.caption,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  infoText: {
    marginLeft: spacing.sm,
    ...typography.caption,
  },
  compactCard: {
    width: 180,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginRight: spacing.md,
    position: 'relative',
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  compactImage: {
    width: '100%',
    height: 120,
  },
  compactGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  compactTotalLikes: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  compactTotalLikesText: {
    color: 'white',
    ...typography.small,
    marginLeft: spacing.xs,
  },
  compactChatButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  compactContent: {
    padding: spacing.md,
  },
  compactName: {
    ...typography.bodyMedium,
    marginBottom: spacing.xs,
  },
  compactDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactType: {
    ...typography.caption,
    flex: 1,
    textTransform: 'capitalize',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    ...shadows.xl,
  },
  modalTitle: {
    ...typography.heading3,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  timeSlot: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    margin: spacing.sm,
    ...shadows.sm,
  },
  timeSlotText: {
    ...typography.bodyMedium,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing.lg,
  },
  modalButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    minWidth: 120,
    alignItems: 'center',
    ...shadows.md,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#999',
  },
  cancelButtonText: {
    color: '#999',
    ...typography.bodyMedium,
  },
  submitButton: {
    backgroundColor: '#FF6A00',
  },
  submitButtonText: {
    color: 'white',
    ...typography.bodyMedium,
  },
});