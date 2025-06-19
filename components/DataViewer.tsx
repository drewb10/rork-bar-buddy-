import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { Database, Eye, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useAuthStore } from '@/stores/authStore';

export default function DataViewer() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [modalVisible, setModalVisible] = useState(false);
  
  const { interactions } = useVenueInteractionStore();
  const { profile } = useUserProfileStore();
  const { favoriteVenues, favoriteSpecials } = useFavoritesStore();
  const { user } = useAuthStore();

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <>
      <Pressable 
        style={[styles.button, { backgroundColor: themeColors.card }]}
        onPress={() => setModalVisible(true)}
      >
        <Database size={20} color={themeColors.primary} />
        <Text style={[styles.buttonText, { color: themeColors.text }]}>
          View Stored Data
        </Text>
      </Pressable>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Stored Data Overview
              </Text>
              <Pressable 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <X size={24} color={themeColors.subtext} />
              </Pressable>
            </View>

            <ScrollView style={styles.scrollView}>
              {/* User Profile Data */}
              <View style={[styles.section, { backgroundColor: themeColors.card }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
                  User Profile (user-profile-storage)
                </Text>
                <Text style={[styles.dataText, { color: themeColors.text }]}>
                  Name: {profile.firstName} {profile.lastName}
                </Text>
                <Text style={[styles.dataText, { color: themeColors.text }]}>
                  Email: {profile.email}
                </Text>
                <Text style={[styles.dataText, { color: themeColors.text }]}>
                  Nights Out: {profile.nightsOut}
                </Text>
                <Text style={[styles.dataText, { color: themeColors.text }]}>
                  Bars Hit: {profile.barsHit}
                </Text>
                <Text style={[styles.dataText, { color: themeColors.text }]}>
                  Drunk Scale Ratings: [{profile.drunkScaleRatings.join(', ')}]
                </Text>
                <Text style={[styles.dataText, { color: themeColors.text }]}>
                  Join Date: {formatDate(profile.joinDate)}
                </Text>
                {profile.lastNightOutDate && (
                  <Text style={[styles.dataText, { color: themeColors.text }]}>
                    Last Night Out: {formatDate(profile.lastNightOutDate)}
                  </Text>
                )}
                {profile.lastDrunkScaleDate && (
                  <Text style={[styles.dataText, { color: themeColors.text }]}>
                    Last Drunk Scale: {formatDate(profile.lastDrunkScaleDate)}
                  </Text>
                )}
              </View>

              {/* Venue Interactions Data */}
              <View style={[styles.section, { backgroundColor: themeColors.card }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
                  Venue Interactions (venue-interactions-storage)
                </Text>
                {interactions.length === 0 ? (
                  <Text style={[styles.dataText, { color: themeColors.subtext }]}>
                    No interactions yet
                  </Text>
                ) : (
                  interactions.map((interaction, index) => (
                    <View key={index} style={styles.interactionItem}>
                      <Text style={[styles.dataText, { color: themeColors.text }]}>
                        Venue ID: {interaction.venueId}
                      </Text>
                      <Text style={[styles.dataText, { color: themeColors.text }]}>
                        Count: {interaction.count}
                      </Text>
                      <Text style={[styles.dataText, { color: themeColors.text }]}>
                        Last Reset: {formatDate(interaction.lastReset)}
                      </Text>
                      <Text style={[styles.dataText, { color: themeColors.text }]}>
                        Last Interaction: {formatDate(interaction.lastInteraction)}
                      </Text>
                      {interaction.arrivalTime && (
                        <Text style={[styles.dataText, { color: themeColors.text }]}>
                          Arrival Time: {interaction.arrivalTime}
                        </Text>
                      )}
                    </View>
                  ))
                )}
              </View>

              {/* Auth Data */}
              <View style={[styles.section, { backgroundColor: themeColors.card }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
                  Auth Data (auth-storage)
                </Text>
                <Text style={[styles.dataText, { color: themeColors.text }]}>
                  User ID: {user?.id || 'Not logged in'}
                </Text>
                <Text style={[styles.dataText, { color: themeColors.text }]}>
                  Email: {user?.email || 'N/A'}
                </Text>
                <Text style={[styles.dataText, { color: themeColors.text }]}>
                  Name: {user?.firstName} {user?.lastName}
                </Text>
              </View>

              {/* Favorites Data */}
              <View style={[styles.section, { backgroundColor: themeColors.card }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
                  Favorites (favorites-storage)
                </Text>
                <Text style={[styles.dataText, { color: themeColors.text }]}>
                  Favorite Venues: [{favoriteVenues.join(', ')}]
                </Text>
                <Text style={[styles.dataText, { color: themeColors.text }]}>
                  Favorite Specials: [{favoriteSpecials.join(', ')}]
                </Text>
              </View>

              {/* Storage Info */}
              <View style={[styles.section, { backgroundColor: themeColors.card }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
                  Storage Information
                </Text>
                <Text style={[styles.dataText, { color: themeColors.text }]}>
                  All data is stored locally using AsyncStorage
                </Text>
                <Text style={[styles.dataText, { color: themeColors.text }]}>
                  Data persists across app restarts
                </Text>
                <Text style={[styles.dataText, { color: themeColors.text }]}>
                  Venue interactions reset daily at 5:00 AM
                </Text>
                <Text style={[styles.dataText, { color: themeColors.text }]}>
                  User stats persist even after logout
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '95%',
    height: '90%',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  dataText: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  interactionItem: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
});