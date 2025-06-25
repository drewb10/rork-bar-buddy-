import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Clock, Star, Flame, Heart, TrendingUp, MessageCircle } from 'lucide-react-native';
import { Venue } from '@/types/venue';
import { colors } from '@/constants/colors';
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
  const themeColors = colors[theme];
  const { 
    incrementInteraction, 
    getInteractionCount, 
    getLikeCount, 
    canInteract, 
    canLikeVenue,
    likeVenue,
    getPopularArrivalTime 
  } = useVenueInteractionStore();
  const { incrementNightsOut, incrementBarsHit, canIncrementNightsOut } = useUserProfileStore();
  const interactionCount = getInteractionCount(venue.id);
  const likeCount = getLikeCount(venue.id);
  const popularTime = getPopularArrivalTime(venue.id);
  const [rsvpModalVisible, setRsvpModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const canInteractWithVenue = canInteract(venue.id);
  const canLikeThisVenue = canLikeVenue(venue.id);

  const handlePress = () => {
    if (isInteracting) return; // Prevent multiple clicks
    router.push(`/venue/${venue.id}`);
  };

  const handleChatPress = (e: any) => {
    e.stopPropagation(); // Prevent venue navigation
    setChatModalVisible(true);
  };

  const handleLikePress = (e: any) => {
    e.stopPropagation(); // Prevent venue navigation
    
    if (!canLikeThisVenue) {
      // Show message about daily limit
      return;
    }
    
    likeVenue(venue.id);
  };

  const handleInteraction = () => {
    if (!canInteractWithVenue || isInteracting) return;
    
    setIsInteracting(true);
    
    // Show RSVP modal
    setRsvpModalVisible(true);
  };

  const handleRsvpSubmit = async () => {
    if (selectedTime) {
      incrementInteraction(venue.id, selectedTime);
      
      // Increment bars hit (always increments and awards XP)
      await incrementBarsHit();
      
      // Increment nights out (only once per day and awards XP)
      if (canIncrementNightsOut()) {
        await incrementNightsOut();
      }
      
      setRsvpModalVisible(false);
      setSelectedTime(null);
      setIsInteracting(false);
    }
  };

  const handleRsvpCancel = () => {
    setRsvpModalVisible(false);
    setSelectedTime(null);
    setIsInteracting(false);
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

  // Generate time slots for RSVP
  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const startHour = 19; // 7 PM
    const endHour = 2; // 2 AM
    
    for (let hour = startHour; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour}:${minute === 0 ? '00' : minute}`);
      }
    }
    
    // Add early morning hours
    for (let hour = 0; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour}:${minute === 0 ? '00' : minute}`);
      }
    }
    
    return slots;
  };

  const formatTimeSlot = (timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const timeSlots = generateTimeSlots();

  if (compact) {
    return (
      <Pressable 
        style={[styles.compactCard, { backgroundColor: themeColors.card }]} 
        onPress={handlePress}
        disabled={isInteracting}
      >
        <Image source={{ uri: venue.featuredImage }} style={styles.compactImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.compactGradient}
        />
        
        {/* Like Button for compact cards */}
        <Pressable 
          style={[
            styles.compactLikeButton, 
            { 
              backgroundColor: canLikeThisVenue ? themeColors.primary : themeColors.border,
              opacity: canLikeThisVenue ? 1 : 0.5
            }
          ]}
          onPress={handleLikePress}
          disabled={!canLikeThisVenue}
        >
          <Heart size={12} color="white" fill={likeCount > 0 ? "white" : "transparent"} />
          {likeCount > 0 && (
            <Text style={styles.compactLikeText}>{likeCount}</Text>
          )}
        </Pressable>

        {/* Chat Button for Compact Cards */}
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
              <Star size={12} color={themeColors.accent} fill={themeColors.accent} />
              <Text style={[styles.rating, { color: themeColors.subtext }]}>{venue.rating}</Text>
            </View>
          </View>
        </View>

        {/* Chat Modal for Compact Cards */}
        <ChatModal
          visible={chatModalVisible}
          onClose={() => setChatModalVisible(false)}
          venue={venue}
        />
      </Pressable>
    );
  }

  return (
    <Pressable 
      style={[styles.card, { backgroundColor: themeColors.card }]} 
      onPress={handlePress}
      disabled={isInteracting}
    >
      <Image source={{ uri: venue.featuredImage }} style={styles.image} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.imageGradient}
      />
      
      {/* Flame Button - No counter, just functional */}
      <Pressable 
        style={[
          styles.interactionButton, 
          { 
            backgroundColor: interactionCount > 0 ? themeColors.primary : themeColors.card,
            opacity: canInteractWithVenue && !isInteracting ? 1 : 0.5
          }
        ]}
        onPress={handleInteraction}
        disabled={!canInteractWithVenue || isInteracting}
      >
        <Flame 
          size={18} 
          color={interactionCount > 0 ? 'white' : themeColors.primary} 
        />
      </Pressable>

      {/* Chat Button - New prominent position */}
      <Pressable 
        style={[styles.chatButton, { backgroundColor: themeColors.primary }]}
        onPress={handleChatPress}
      >
        <MessageCircle size={18} color="white" />
      </Pressable>

      {/* Like Button with daily limit indicator */}
      <Pressable 
        style={[
          styles.likeButton, 
          { 
            backgroundColor: canLikeThisVenue ? themeColors.primary : themeColors.border,
            opacity: canLikeThisVenue ? 1 : 0.5
          }
        ]}
        onPress={handleLikePress}
        disabled={!canLikeThisVenue}
      >
        <Heart size={16} color="white" fill={likeCount > 0 ? "white" : "transparent"} />
        {likeCount > 0 && (
          <Text style={styles.likeButtonText}>{likeCount}</Text>
        )}
      </Pressable>

      {/* Analytics indicator for venues with data */}
      {likeCount > 5 && (
        <View style={[styles.analyticsIndicator, { backgroundColor: themeColors.primary + '20' }]}>
          <TrendingUp size={12} color={themeColors.primary} />
        </View>
      )}
      
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

        {/* Enhanced Hot Time Badge with likes info */}
        {popularTime && (
          <View style={[styles.hotTimeBadge, { backgroundColor: themeColors.primary + '20' }]}>
            <Flame size={14} color={themeColors.primary} />
            <Text style={[styles.hotTimeText, { color: themeColors.primary }]}>
              Hot Time: {popularTime.includes('/') 
                ? popularTime.split('/').map(time => formatTimeSlot(time)).join('/')
                : formatTimeSlot(popularTime)
              }
            </Text>
            {likeCount > 0 && (
              <View style={styles.hotTimeLikes}>
                <Heart size={10} color={themeColors.primary} fill={themeColors.primary} />
                <Text style={[styles.hotTimeLikesText, { color: themeColors.primary }]}>
                  {likeCount}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Daily like limit indicator */}
        {!canLikeThisVenue && (
          <View style={[styles.limitBadge, { backgroundColor: themeColors.border + '40' }]}>
            <Text style={[styles.limitText, { color: themeColors.subtext }]}>
              💡 Daily like used • Resets at 4:59 AM
            </Text>
          </View>
        )}
        
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

      {/* RSVP Modal with glassmorphism */}
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

      {/* Chat Modal */}
      <ChatModal
        visible={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
        venue={venue}
      />
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
  image: {
    width: '100%',
    height: 180,
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  interactionButton: {
    position: 'absolute',
    top: 12,
    right: 12,
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
  chatButton: {
    position: 'absolute',
    top: 12,
    right: 60,
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
  likeButton: {
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
  likeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
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
  content: {
    padding: 20,
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
  hotTimeLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  hotTimeLikesText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },
  limitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  limitText: {
    fontSize: 12,
    fontWeight: '600',
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
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
  compactLikeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
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
  compactLikeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  compactChatButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  compactContent: {
    padding: 12,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#999',
  },
  cancelButtonText: {
    color: '#999',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  submitButton: {
    backgroundColor: '#FF6A00',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});