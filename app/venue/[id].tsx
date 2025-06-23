import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, Pressable, Linking, Platform, Dimensions, StatusBar } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Phone, Globe, Clock, Heart, Instagram, Share2, BarChart3, TrendingUp } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { getVenueById } from '@/mocks/venues';
import SpecialCard from '@/components/SpecialCard';
import PopularTimesChart from '@/components/PopularTimesChart';
import * as Haptics from 'expo-haptics';
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

  if (!venue) return null;

  const handlePopularTimesToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowPopularTimes(!showPopularTimes);
  };

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
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});