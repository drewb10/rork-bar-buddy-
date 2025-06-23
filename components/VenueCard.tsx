import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Image, Modal, Animated } from 'react-native';
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
  const { incrementInteraction, getInteractionCount, getLikeCount, canInteract, getPopularArrivalTime } = useVenueInteractionStore();
  const { incrementNightsOut, incrementBarsHit, canIncrementNightsOut } = useUserProfileStore();
  const interactionCount = getInteractionCount(venue.id);
  const likeCount = getLikeCount(venue.id);
  const popularTime = getPopularArrivalTime(venue.id);
  const [rsvpModalVisible, setRsvpModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const canInteractWithVenue = canInteract(venue.id);

  // Animation values for premium interactions
  const scaleAnim = new Animated.Value(1);
  const shadowAnim = new Animated.Value(1);

  const handlePress = () => {
    if (isInteracting) return; // Prevent multiple clicks
    
    // Subtle press animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: false,
      })
    ]).start(() => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(shadowAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        })
      ]).start();
    });
    
    router.push(`/venue/${venue.id}`);
  };

  const handleChatPress = (e: any) => {
    e.stopPropagation(); // Prevent venue navigation
    setChatModalVisible(true);
  };

  const handleInteraction = () => {
    if (!canInteractWithVenue || isInteracting) return;
    
    setIsInteracting(true);
    
    // Show RSVP modal
    setRsvpModalVisible(true);
  };

  const handleRsvpSubmit = () => {
    if (selectedTime) {
      incrementInteraction(venue.id, selectedTime);
      
      // Increment bars hit (always increments)
      incrementBarsHit();
      
      // Increment nights out (only once per day)
      if (canIncrementNightsOut()) {
        incrementNightsOut();
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
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
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
          
          {/* Like count badge for compact cards */}
          {likeCount > 0 && (
            <View style={[styles.compactLikeBadge, { backgroundColor: themeColors.primary }]}>
              <Heart size={10} color="white" fill="white" />
              <Text style={styles.compactLikeText}>{likeCount}</Text>
            </View>
          )}

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
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      style={{ 
        transform: [{ scale: scaleAnim }],
        shadowOpacity: shadowAnim,
      }}
    >
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

        {/* Like count badge with enhanced styling */}
        {likeCount > 0 && (
          <View style={[styles.likeBadge, { backgroundColor: themeColors.primary }]}>
            <Heart size={14} color="white" fill="white" />
            <Text style={styles.likeText}>{likeCount}</Text>
          </View>
        )}

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
              backgroundColor: themeColors.glass.background,
              borderColor: themeColors.glass.border,
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
                  <Text style={styles.submitButtonText}>Submit</Text>
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
    </Animated.View>
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
    borderRadius: 20, // Increased for more premium feel
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    // Enhanced shadow system for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    // Subtle border for definition
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
    width: 40, // Slightly larger for better touch target
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    // Subtle border for premium feel
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chatButton: {
    position: 'absolute',
    top: 12,
    right: 60, // Adjusted for larger interaction button
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
  likeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10, // Slightly more padding
    paddingVertical: 6,
    borderRadius: 16, // More rounded
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  likeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700', // Bolder for better readability
    marginLeft: 4,
  },
  analyticsIndicator: {
    position: 'absolute',
    top: 60, // Adjusted for larger like badge
    left: 12,
    width: 28, // Slightly larger
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
    padding: 20, // Increased padding for better spacing
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Increased spacing
  },
  name: {
    fontSize: 18,
    fontWeight: '700', // Bolder for hierarchy
    flex: 1,
    letterSpacing: 0.3, // Subtle letter spacing
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontWeight: '700', // Bolder
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16, // Increased spacing
    alignItems: 'center',
  },
  typeTag: {
    paddingHorizontal: 12, // More padding
    paddingVertical: 6,
    borderRadius: 16, // More rounded
    marginRight: 8,
    marginBottom: 4,
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600', // Slightly bolder
    textTransform: 'capitalize',
    letterSpacing: 0.2,
  },
  price: {
    fontSize: 14,
    fontWeight: '600', // Bolder
  },
  hotTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, // More padding
    paddingVertical: 8,
    borderRadius: 20, // More rounded
    marginBottom: 16, // Increased spacing
    alignSelf: 'flex-start',
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hotTimeText: {
    fontSize: 12,
    fontWeight: '700', // Bolder
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  hotTimeLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 8, // More padding
    paddingVertical: 4,
    borderRadius: 12, // More rounded
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  hotTimeLikesText: {
    fontSize: 10,
    fontWeight: '700', // Bolder
    marginLeft: 2,
  },
  specialsContainer: {
    marginBottom: 16, // Increased spacing
    padding: 12, // More padding
    borderRadius: 12, // More rounded
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  specialsTitle: {
    fontSize: 14,
    fontWeight: '700', // Bolder
    marginBottom: 6, // More spacing
    letterSpacing: 0.2,
  },
  specialText: {
    fontSize: 13,
    marginBottom: 2,
    lineHeight: 18,
    fontWeight: '500', // Slightly bolder
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10, // Increased spacing
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500', // Slightly bolder
  },
  compactCard: {
    width: 160,
    borderRadius: 16, // More rounded
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
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
  compactLikeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8, // More padding
    paddingVertical: 4,
    borderRadius: 12, // More rounded
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  compactLikeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700', // Bolder
    marginLeft: 3,
  },
  compactChatButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32, // Slightly larger
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
    padding: 12, // More padding
  },
  compactName: {
    fontSize: 14,
    fontWeight: '700', // Bolder
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
    fontWeight: '500', // Slightly bolder
  },
  // Modal styles with glassmorphism
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker overlay
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 24, // More rounded
    padding: 24, // More padding
    alignItems: 'center',
    borderWidth: 1,
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700', // Bolder
    marginBottom: 24, // More spacing
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24, // More spacing
  },
  timeSlot: {
    paddingHorizontal: 16, // More padding
    paddingVertical: 10,
    borderRadius: 24, // More rounded
    borderWidth: 1.5, // Thicker border
    margin: 6, // More spacing
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600', // Bolder
    letterSpacing: 0.2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16, // Add gap for better spacing
  },
  modalButton: {
    paddingVertical: 14, // More padding
    paddingHorizontal: 24,
    borderRadius: 28, // More rounded
    minWidth: 120,
    alignItems: 'center',
    // Enhanced shadow
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
    fontWeight: '600', // Bolder
    letterSpacing: 0.3,
  },
  submitButton: {
    backgroundColor: '#FF6A00',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '700', // Bolder
    letterSpacing: 0.3,
  },
});