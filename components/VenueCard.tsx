import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Image, Dimensions, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Clock, Star, Flame } from 'lucide-react-native';
import { Venue } from '@/types/venue';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface VenueCardProps {
  venue: Venue;
  compact?: boolean;
}

export default function VenueCard({ venue, compact = false }: VenueCardProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { incrementInteraction, getInteractionCount, canInteract, getPopularArrivalTime } = useVenueInteractionStore();
  const interactionCount = getInteractionCount(venue.id);
  const popularTime = getPopularArrivalTime(venue.id);
  const [rsvpModalVisible, setRsvpModalVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const canInteractWithVenue = canInteract(venue.id);

  const handlePress = () => {
    router.push(`/venue/${venue.id}`);
  };

  const handleInteraction = () => {
    if (!canInteractWithVenue) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Show RSVP modal
    setRsvpModalVisible(true);
  };

  const handleRsvpSubmit = () => {
    if (selectedTime) {
      incrementInteraction(venue.id, selectedTime);
      setRsvpModalVisible(false);
      setSelectedTime(null);
    }
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
      >
        <Image source={{ uri: venue.featuredImage }} style={styles.compactImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.compactGradient}
        />
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
      </Pressable>
    );
  }

  return (
    <Pressable 
      style={[styles.card, { backgroundColor: themeColors.card }]} 
      onPress={handlePress}
    >
      <Image source={{ uri: venue.featuredImage }} style={styles.image} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.imageGradient}
      />
      
      <Pressable 
        style={[
          styles.interactionButton, 
          { 
            backgroundColor: interactionCount > 0 ? themeColors.primary : themeColors.card,
            opacity: canInteractWithVenue ? 1 : 0.5
          }
        ]}
        onPress={handleInteraction}
        disabled={!canInteractWithVenue}
      >
        <Flame 
          size={18} 
          color={interactionCount > 0 ? 'white' : themeColors.primary} 
        />
        {interactionCount > 0 && (
          <Text style={styles.interactionCount}>{interactionCount}</Text>
        )}
      </Pressable>
      
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

        {/* Hot Time Badge */}
        {popularTime && (
          <View style={[styles.hotTimeBadge, { backgroundColor: themeColors.primary + '20' }]}>
            <Flame size={14} color={themeColors.primary} />
            <Text style={[styles.hotTimeText, { color: themeColors.primary }]}>
              Hot Time: {formatTimeSlot(popularTime)}
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

      {/* RSVP Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={rsvpModalVisible}
        onRequestClose={() => setRsvpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
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
                onPress={() => {
                  setRsvpModalVisible(false);
                  setSelectedTime(null);
                }}
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
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  interactionCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4500',
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontWeight: '600',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    alignItems: 'center',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  price: {
    fontSize: 14,
    fontWeight: '500',
  },
  hotTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  hotTimeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  specialsContainer: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
  },
  specialsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  specialText: {
    fontSize: 13,
    marginBottom: 2,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
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
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
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
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timeSlot: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    margin: 5,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: '#999',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#FF6A00',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});