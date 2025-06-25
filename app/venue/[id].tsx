import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, Pressable, Linking, Platform, Dimensions, StatusBar, Modal } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Phone, Globe, Clock, Heart, Instagram, Share2, ChartBar as BarChart3, TrendingUp, MessageCircle, Flame } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { getVenueById } from '@/mocks/venues';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import SpecialCard from '@/components/SpecialCard';
import PopularTimesChart from '@/components/PopularTimesChart';
import ChatModal from '@/components/ChatModal';
import { LinearGradient } from 'expo-linear-gradient';

export default function VenueDetailScreen() {
  const { id, specialId } = useLocalSearchParams<{ id: string; specialId?: string }>();
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [venue, setVenue] = useState(getVenueById(id));
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPopularTimes, setShowPopularTimes] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [likeModalVisible, setLikeModalVisible] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);

  const { 
    likeVenue, 
    getLikeCount, 
    canLikeVenue 
  } = useVenueInteractionStore();

  if (!venue) return null;

  const likeCount = getLikeCount(venue.id);
  const canLikeThisVenue = canLikeVenue(venue.id);

  const handlePopularTimesToggle = () => {
    setShowPopularTimes(!showPopularTimes);
  };

  const handleChatPress = () => {
    setShowChat(true);
  };

  const handleLikePress = () => {
    if (!canLikeThisVenue || isLiking) return;
    setLikeModalVisible(true);
  };

  const handleLikeSubmit = async () => {
    if (!selectedTimeSlot) return;
    
    setIsLiking(true);
    likeVenue(venue.id, selectedTimeSlot);
    setLikeModalVisible(false);
    setSelectedTimeSlot(null);
    setIsLiking(false);
  };

  const handleLikeCancel = () => {
    setLikeModalVisible(false);
    setSelectedTimeSlot(null);
    setIsLiking(false);
  };

  // Generate time slots for like selection
  const generateTimeSlots = () => {
    const slots = [];
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

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerBackTitle: 'Home',
          headerTitle: '',
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: themeColors.text,
        }} 
      />
      
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        {/* Top Left: Total Likes Counter */}
        <View style={[styles.totalLikesContainer, { backgroundColor: themeColors.primary }]}>
          <Flame size={16} color="white" fill="white" />
          <Text style={styles.totalLikesText}>{likeCount}</Text>
        </View>

        {/* Top Right: Like Button */}
        <Pressable 
          style={[
            styles.likeButton, 
            { 
              backgroundColor: canLikeThisVenue ? themeColors.primary : themeColors.border,
              opacity: canLikeThisVenue ? 1 : 0.3
            }
          ]}
          onPress={handleLikePress}
          disabled={!canLikeThisVenue || isLiking}
        >
          <Flame 
            size={20} 
            color="white"
            fill={canLikeThisVenue ? "transparent" : "white"}
          />
        </Pressable>

        <ScrollView style={styles.scrollView}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: venue.images[activeImageIndex] }} 
              style={styles.image}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={StyleSheet.absoluteFill}
            />
          </View>

          <View style={styles.content}>
            <Text style={[styles.name, { color: themeColors.text }]}>
              {venue.name}
            </Text>
            
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
            </View>

            <Text style={[styles.description, { color: themeColors.text }]}>
              {venue.description}
            </Text>

            {/* Prominent Chat Button */}
            <Pressable 
              style={[styles.chatButton, { backgroundColor: themeColors.primary }]}
              onPress={handleChatPress}
            >
              <View style={styles.chatButtonContent}>
                <MessageCircle size={24} color="white" />
                <View style={styles.chatButtonText}>
                  <Text style={styles.chatButtonTitle}>
                    💬 Live Chat at {venue.name}
                  </Text>
                  <Text style={styles.chatButtonSubtitle}>
                    Anonymous • Keep it respectful
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Enhanced Popular Times Section */}
            <View style={[styles.popularTimesSection, { backgroundColor: themeColors.card }]}>
              <Pressable 
                style={styles.popularTimesHeader}
                onPress={handlePopularTimesToggle}
              >
                <View style={styles.popularTimesHeaderLeft}>
                  <TrendingUp size={24} color={themeColors.primary} />
                  <Text style={[styles.popularTimesTitle, { color: themeColors.text }]}>
                    Popular Times & Likes
                  </Text>
                </View>
                <BarChart3 
                  size={20} 
                  color={themeColors.primary}
                  style={{
                    transform: [{ rotate: showPopularTimes ? '180deg' : '0deg' }]
                  }}
                />
              </Pressable>

              {showPopularTimes && (
                <View style={styles.popularTimesContent}>
                  <PopularTimesChart venueId={venue.id} expanded={true} />
                </View>
              )}
            </View>

            <View style={styles.infoContainer}>
              <Pressable 
                style={styles.infoRow}
                onPress={() => Linking.openURL(`https://maps.google.com/?q=${venue.address}`)}
              >
                <MapPin size={20} color={themeColors.primary} />
                <Text style={[styles.infoText, { color: themeColors.text }]}>
                  {venue.address}
                </Text>
              </Pressable>

              <Pressable 
                style={styles.infoRow}
                onPress={() => Linking.openURL(`tel:${venue.phone}`)}
              >
                <Phone size={20} color={themeColors.primary} />
                <Text style={[styles.infoText, { color: themeColors.text }]}>
                  {venue.phone}
                </Text>
              </Pressable>

              {venue.website && (
                <Pressable 
                  style={styles.infoRow}
                  onPress={() => Linking.openURL(venue.website!)}
                >
                  <Globe size={20} color={themeColors.primary} />
                  <Text style={[styles.infoText, { color: themeColors.text }]}>
                    {venue.website}
                  </Text>
                </Pressable>
              )}

              {venue.instagram && (
                <Pressable 
                  style={styles.infoRow}
                  onPress={() => Linking.openURL(`https://instagram.com/${venue.instagram}`)}
                >
                  <Instagram size={20} color={themeColors.primary} />
                  <Text style={[styles.infoText, { color: themeColors.text }]}>
                    @{venue.instagram}
                  </Text>
                </Pressable>
              )}
            </View>

            {venue.specials.length > 0 && (
              <View style={styles.specialsSection}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  Specials
                </Text>
                {venue.specials.map(special => (
                  <SpecialCard 
                    key={special.id} 
                    special={special}
                    venue={venue}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

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
                        backgroundColor: selectedTimeSlot === time 
                          ? themeColors.primary 
                          : 'transparent',
                        borderColor: themeColors.primary
                      }
                    ]}
                    onPress={() => setSelectedTimeSlot(time)}
                  >
                    <Text 
                      style={[
                        styles.timeSlotText, 
                        { color: selectedTimeSlot === time ? 'white' : themeColors.primary }
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
                      backgroundColor: selectedTimeSlot ? themeColors.primary : themeColors.card,
                      opacity: selectedTimeSlot ? 1 : 0.5
                    }
                  ]} 
                  onPress={handleLikeSubmit}
                  disabled={!selectedTimeSlot}
                >
                  <Text style={styles.submitButtonText}>Like This Bar 🔥</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Chat Modal */}
        <ChatModal
          visible={showChat}
          onClose={() => setShowChat(false)}
          venue={venue}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  totalLikesContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
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
    zIndex: 10,
  },
  totalLikesText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  likeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  typeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  chatButton: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButtonText: {
    marginLeft: 16,
    flex: 1,
  },
  chatButtonTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  chatButtonSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  popularTimesSection: {
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  popularTimesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  popularTimesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularTimesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  popularTimesContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoContainer: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 12,
  },
  specialsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
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