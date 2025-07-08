import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

interface VenueInteraction {
  id: string;
  venueId: string;
  userId: string;
  arrivalTime?: string;
  likeTimeSlot?: string;
  likes: number;
  count: number;
  date: string;
  dailyLikesUsed?: number;
}

interface VenueInteractionState {
  interactions: VenueInteraction[];
  isLoading: boolean;
  lastSyncDate: string | null;
  // Core functions
  incrementInteraction: (venueId: string, arrivalTime: string) => void;
  likeVenue: (venueId: string, timeSlot: string) => void;
  // Query functions
  getInteractionCount: (venueId: string) => number;
  getLikeCount: (venueId: string) => number;
  getHotTimeWithLikes: (venueId: string) => { time: string; likes: number } | null;
  canInteract: (venueId: string) => boolean;
  canLikeVenue: (venueId: string) => boolean;
  // Real-time update function
  forceUpdate: () => void;
  triggerRerender: () => void;
  // Sync functions
  syncToSupabase: (venueId: string, arrivalTime?: string, likeTimeSlot?: string) => Promise<void>;
  loadFromSupabase: () => Promise<void>;
}

const DAILY_LIKE_LIMIT = 5;
const MAX_DAILY_INTERACTIONS = 10;

export const useVenueInteractionStore = create<VenueInteractionState>()(
  persist(
    (set, get) => ({
      interactions: [],
      isLoading: false,
      lastSyncDate: null,

      // FIXED: Real-time like updates with immediate UI feedback
      likeVenue: (venueId: string, timeSlot: string) => {
        const today = new Date().toISOString().split('T')[0];
        const userId = 'anonymous'; // or get from auth

        set((state) => {
          const existingInteraction = state.interactions.find(
            i => i.venueId === venueId && i.likeTimeSlot === timeSlot && i.date === today
          );

          let updatedInteractions;
          if (existingInteraction) {
            // Update existing interaction
            updatedInteractions = state.interactions.map(i =>
              i.id === existingInteraction.id
                ? { ...i, likes: i.likes + 1 }
                : i
            );
          } else {
            // Create new interaction
            const newInteraction: VenueInteraction = {
              id: Math.random().toString(36).substr(2, 9),
              venueId,
              userId,
              likeTimeSlot: timeSlot,
              likes: 1,
              count: 0,
              date: today,
              dailyLikesUsed: (get().interactions.find(i => i.venueId === venueId && i.date === today)?.dailyLikesUsed || 0) + 1
            };
            updatedInteractions = [...state.interactions, newInteraction];
          }

          // CRITICAL: Force re-render across all components
          setTimeout(() => {
            get().triggerRerender();
          }, 0);

          return { interactions: updatedInteractions };
        });

        // Sync to Supabase in background
        get().syncToSupabase(venueId, undefined, timeSlot);
      },

      // FIXED: Real-time interaction updates
      incrementInteraction: (venueId: string, arrivalTime: string) => {
        const today = new Date().toISOString().split('T')[0];
        const userId = 'anonymous';

        set((state) => {
          const existingInteraction = state.interactions.find(
            i => i.venueId === venueId && i.arrivalTime === arrivalTime && i.date === today
          );

          let updatedInteractions;
          if (existingInteraction) {
            updatedInteractions = state.interactions.map(i =>
              i.id === existingInteraction.id
                ? { ...i, count: i.count + 1 }
                : i
            );
          } else {
            const newInteraction: VenueInteraction = {
              id: Math.random().toString(36).substr(2, 9),
              venueId,
              userId,
              arrivalTime,
              likes: 0,
              count: 1,
              date: today
            };
            updatedInteractions = [...state.interactions, newInteraction];
          }

          // Force re-render
          setTimeout(() => get().triggerRerender(), 0);
          
          return { interactions: updatedInteractions };
        });

        get().syncToSupabase(venueId, arrivalTime);
      },

      // FIXED: Accurate like count calculation
      getLikeCount: (venueId: string) => {
        const { interactions } = get();
        return interactions
          .filter(i => i && i.venueId === venueId && i.likes > 0)
          .reduce((total, i) => total + (i.likes || 0), 0);
      },

      // FIXED: Hot time calculation with real-time updates
      getHotTimeWithLikes: (venueId: string) => {
        const { interactions } = get();
        const venueInteractions = interactions.filter(i => i && i.venueId === venueId);
        
        const timeSlotLikes: Record<string, number> = {};
        
        venueInteractions.forEach(interaction => {
          if (interaction && interaction.likeTimeSlot && interaction.likes > 0) {
            timeSlotLikes[interaction.likeTimeSlot] = (timeSlotLikes[interaction.likeTimeSlot] || 0) + interaction.likes;
          }
        });
        
        if (Object.keys(timeSlotLikes).length === 0) return null;
        
        const maxLikes = Math.max(...Object.values(timeSlotLikes));
        const hotTimeEntry = Object.entries(timeSlotLikes).find(([time, likes]) => likes === maxLikes);
        
        return hotTimeEntry ? { time: hotTimeEntry[0], likes: hotTimeEntry[1] } : null;
      },

      getInteractionCount: (venueId: string) => {
        const { interactions } = get();
        return interactions
          .filter(i => i && i.venueId === venueId && i.count > 0)
          .reduce((total, i) => total + (i.count || 0), 0);
      },

      canInteract: (venueId: string) => {
        const today = new Date().toISOString().split('T')[0];
        const { interactions } = get();
        const todayInteractions = interactions.filter(
          i => i && i.venueId === venueId && i.date === today
        );
        const totalInteractions = todayInteractions.reduce((sum, i) => sum + (i.count || 0), 0);
        return totalInteractions < MAX_DAILY_INTERACTIONS;
      },

      canLikeVenue: (venueId: string) => {
        const today = new Date().toISOString().split('T')[0];
        const { interactions } = get();
        const venueInteraction = interactions.find(
          i => i && i.venueId === venueId && i.date === today
        );
        const dailyLikesUsed = venueInteraction?.dailyLikesUsed || 0;
        return dailyLikesUsed < DAILY_LIKE_LIMIT;
      },

      // CRITICAL: Force update function for real-time UI updates
      forceUpdate: () => {
        set((state) => ({ ...state }));
      },

      triggerRerender: () => {
        // Trigger a minimal state change to force re-renders
        set((state) => ({ 
          ...state, 
          lastSyncDate: new Date().toISOString() 
        }));
      },

      // Background sync to Supabase
      syncToSupabase: async (venueId: string, arrivalTime?: string, likeTimeSlot?: string) => {
        try {
          if (!supabase) return;

          const { data: { user } } = await supabase.auth.getUser();
          const userId = user?.id || 'anonymous';

          const interactionData = {
            venue_id: venueId,
            user_id: userId,
            arrival_time: arrivalTime,
            like_time_slot: likeTimeSlot,
            likes: likeTimeSlot ? 1 : 0,
            count: arrivalTime ? 1 : 0,
            date: new Date().toISOString().split('T')[0]
          };

          await supabase.from('venue_interactions').upsert(interactionData);
        } catch (error) {
          console.warn('Sync to Supabase failed:', error);
        }
      },

      loadFromSupabase: async () => {
        try {
          if (!supabase) return;

          set({ isLoading: true });
          const { data, error } = await supabase
            .from('venue_interactions')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          const mappedInteractions: VenueInteraction[] = (data || []).map(item => ({
            id: item.id,
            venueId: item.venue_id,
            userId: item.user_id,
            arrivalTime: item.arrival_time,
            likeTimeSlot: item.like_time_slot,
            likes: item.likes || 0,
            count: item.count || 0,
            date: item.date,
            dailyLikesUsed: item.daily_likes_used || 0
          }));

          set({ 
            interactions: mappedInteractions, 
            isLoading: false,
            lastSyncDate: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error loading from Supabase:', error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'venue-interactions',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        interactions: state.interactions,
        lastSyncDate: state.lastSyncDate,
      }),
    }
  )
);

// ==================================================
// 2. FIXED VENUE CARD COMPONENT - Real-time Updates
// components/VenueCard.tsx
// ==================================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Clock, Star, Flame, TrendingUp, MessageCircle, Heart } from 'lucide-react-native';
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
    likeVenue,
    canInteract,
    canLikeVenue,
    forceUpdate,
    getInteractionCount,
    getLikeCount,
    getHotTimeWithLikes,
    lastSyncDate // Subscribe to this for real-time updates
  } = useVenueInteractionStore();
  
  const { incrementNightsOut, incrementBarsHit, canIncrementNightsOut } = useUserProfileStore();
  
  // Real-time data that updates when store changes
  const interactionData = useMemo(() => ({
    interactionCount: getInteractionCount(venue.id),
    likeCount: getLikeCount(venue.id),
    hotTimeData: getHotTimeWithLikes(venue.id),
    canInteractWithVenue: canInteract(venue.id),
    canLikeThisVenue: canLikeVenue(venue.id),
  }), [venue.id, lastSyncDate, getInteractionCount, getLikeCount, getHotTimeWithLikes, canInteract, canLikeVenue]);

  // Modal states
  const [rsvpModalVisible, setRsvpModalVisible] = useState(false);
  const [likeModalVisible, setLikeModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLikeTime, setSelectedLikeTime] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Time slots for modals
  const timeSlots = [
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
    '21:00', '21:30', '22:00', '22:30', '23:00', '23:30',
    '00:00', '00:30', '01:00', '01:30', '02:00'
  ];

  const handleLikePress = useCallback((e: any) => {
    e.stopPropagation();
    if (!interactionData.canLikeThisVenue || isLiking) return;
    setIsLiking(true);
    setLikeModalVisible(true);
  }, [interactionData.canLikeThisVenue, isLiking]);

  const handleLikeSubmit = useCallback(async () => {
    if (!selectedLikeTime) return;
    
    try {
      // CRITICAL: Submit like immediately for real-time update
      likeVenue(venue.id, selectedLikeTime);
      
      // Close modal
      setLikeModalVisible(false);
      setSelectedLikeTime(null);
      setIsLiking(false);
    } catch (error) {
      console.error('Error submitting like:', error);
      setIsLiking(false);
    }
  }, [selectedLikeTime, venue.id, likeVenue]);

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

  const formatTo12Hour = (timeString: string): string => {
    try {
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const hour24 = parseInt(hours, 10);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  return (
    <>
      <Pressable
        style={[styles.card, { backgroundColor: themeColors.card }, compact && styles.compactCard]}
        onPress={() => router.push(`/venue/${venue.id}`)}
      >
        {/* Venue Image */}
        <View style={[styles.imageContainer, compact && styles.compactImageContainer]}>
          <Image 
            source={{ uri: venue.image_url || 'https://via.placeholder.com/300x200' }}
            style={[styles.image, compact && styles.compactImage]}
            resizeMode="cover"
          />
          
          {/* Hot Time Badge - FIXED: Real-time updates */}
          {interactionData.hotTimeData && (
            <View style={[styles.hotTimeBadge, { backgroundColor: themeColors.primary }]}>
              <Flame size={12} color="white" />
              <Text style={styles.hotTimeText}>
                {formatTo12Hour(interactionData.hotTimeData.time)} • {interactionData.hotTimeData.likes} 🔥
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={[styles.content, compact && styles.compactContent]}>
          <View style={styles.header}>
            <Text style={[styles.name, { color: themeColors.text }]} numberOfLines={1}>
              {venue.name}
            </Text>
            {venue.rating && (
              <View style={styles.rating}>
                <Star size={14} color="#FFD700" fill="#FFD700" />
                <Text style={[styles.ratingText, { color: themeColors.text }]}>
                  {venue.rating}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.location}>
            <MapPin size={12} color={themeColors.subtext} />
            <Text style={[styles.locationText, { color: themeColors.subtext }]} numberOfLines={1}>
              {venue.address}
            </Text>
          </View>

          {/* Action Buttons - FIXED: Real-time like count */}
          <View style={styles.actions}>
            <Pressable
              style={[
                styles.actionButton,
                { backgroundColor: interactionData.canLikeThisVenue ? themeColors.primary : themeColors.border }
              ]}
              onPress={handleLikePress}
              disabled={!interactionData.canLikeThisVenue || isLiking}
            >
              <Heart size={16} color="white" />
              <Text style={styles.actionText}>
                Like ({interactionData.likeCount})
              </Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: themeColors.secondary }]}
              onPress={(e) => {
                e.stopPropagation();
                setChatModalVisible(true);
              }}
            >
              <MessageCircle size={16} color="white" />
              <Text style={styles.actionText}>Chat</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>

      {/* Like Modal */}
      <Modal
        visible={likeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setLikeModalVisible(false);
          setIsLiking(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              When are you planning to visit?
            </Text>
            
            <View style={styles.timeGrid}>
              {timeSlots.map((time) => (
                <Pressable
                  key={time}
                  style={[
                    styles.timeSlot,
                    { 
                      backgroundColor: selectedLikeTime === time 
                        ? themeColors.primary 
                        : themeColors.background,
                      borderColor: themeColors.border
                    }
                  ]}
                  onPress={() => setSelectedLikeTime(time)}
                >
                  <Text style={[
                    styles.timeSlotText,
                    { 
                      color: selectedLikeTime === time 
                        ? 'white' 
                        : themeColors.text 
                    }
                  ]}>
                    {formatTo12Hour(time)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: themeColors.border }]}
                onPress={() => {
                  setLikeModalVisible(false);
                  setSelectedLikeTime(null);
                  setIsLiking(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: themeColors.text }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalButton,
                  { 
                    backgroundColor: selectedLikeTime ? themeColors.primary : themeColors.border,
                    opacity: selectedLikeTime ? 1 : 0.5
                  }
                ]}
                onPress={handleLikeSubmit}
                disabled={!selectedLikeTime}
              >
                <Text style={styles.modalButtonText}>Submit Like</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <ChatModal 
        visible={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
        venueId={venue.id}
        venueName={venue.name}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactCard: {
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  compactImageContainer: {
    height: 150,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  compactImage: {
    height: 150,
  },
  hotTimeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  hotTimeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  compactContent: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  timeSlot: {
    width: '30%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

// ==================================================
// 3. FIXED AUTHENTICATION STORE - Profile Loading
// stores/authStore.ts (Key fixes only)
// ==================================================

// Add this to your existing authStore.ts to fix profile loading issues:

// In the initialize method, add better error handling:
initialize: async () => {
  try {
    set({ isLoading: true, error: null });
    
    const isConfigured = get().checkConfiguration();
    set({ isConfigured });
    
    if (!isConfigured) {
      console.log('🟡 Supabase not configured, using demo mode');
      set({ 
        isLoading: false, 
        profile: DEMO_PROFILE, 
        isAuthenticated: true,
        sessionChecked: true
      });
      return;
    }

    if (supabase) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        set({ isLoading: false, error: sessionError.message, sessionChecked: true });
        return;
      }

      if (session?.user) {
        // FIXED: Better profile loading with fallback
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create one
            const newProfile = {
              id: session.user.id,
              phone: session.user.phone || session.user.email,
              username: `user_${session.user.id.slice(0, 8)}`,
              display_name: 'New User',
              xp: 0,
              level: 1,
              bars_hit: 0,
              nights_out: 0,
              has_completed_onboarding: false,
            };

            const { data: createdProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert([newProfile])
              .select()
              .single();

            if (!createError && createdProfile) {
              set({
                user: session.user,
                profile: createdProfile,
                isAuthenticated: true,
                isLoading: false,
                sessionChecked: true
              });
              return;
            }
          } else if (!profileError && profileData) {
            set({
              user: session.user,
              profile: profileData,
              isAuthenticated: true,
              isLoading: false,
              sessionChecked: true
            });
            return;
          }
        } catch (profileErr) {
          console.error('Profile loading error:', profileErr);
        }
        
        // Fallback: Create basic profile from user data
        const fallbackProfile = {
          id: session.user.id,
          phone: session.user.phone,
          username: session.user.email?.split('@')[0] || `user_${session.user.id.slice(0, 8)}`,
          display_name: session.user.email?.split('@')[0] || 'User',
          xp: 0,
          level: 1,
          bars_hit: 0,
          nights_out: 0,
          has_completed_onboarding: false,
        };

        set({
          user: session.user,
          profile: fallbackProfile,
          isAuthenticated: true,
          isLoading: false,
          sessionChecked: true
        });
      } else {
        set({ isLoading: false, isAuthenticated: false, sessionChecked: true });
      }
    }
  } catch (error) {
    console.error('❌ Auth initialization error:', error);
    set({ 
      isLoading: false, 
      error: 'Failed to initialize authentication',
