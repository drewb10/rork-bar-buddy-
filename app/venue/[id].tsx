import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, Pressable, Linking, Platform, Dimensions, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Phone, Globe, Clock, Heart, Instagram, Share2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { getVenueById } from '@/mocks/venues';
import SpecialCard from '@/components/SpecialCard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import GradientBackground from '@/components/GradientBackground';

export default function VenueDetailScreen() {
  const { id, specialId } = useLocalSearchParams<{ id: string; specialId?: string }>();
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [venue, setVenue] = useState(getVenueById(id));
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (specialId && venue) {
      // Scroll to the special if specialId is provided
      // This would be implemented in a real app
    }
  }, [specialId, venue]);

  if (!venue) {
    return (
      <GradientBackground>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Text style={[styles.errorText, { color: themeColors.text }]}>Venue not found</Text>
      </GradientBackground>
    );
  }

  const handleFavoritePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsFavorite(!isFavorite);
  };

  const handleSharePress = () => {
    // In a real app, this would use the Share API
    console.log('Share venue:', venue.name);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${venue.phone}`);
  };

  const handleWebsite = () => {
    if (venue.website) {
      Linking.openURL(venue.website);
    }
  };

  const handleInstagram = () => {
    if (venue.instagram) {
      Linking.openURL(`https://instagram.com/${venue.instagram}`);
    }
  };

  const handleDirections = () => {
    const { latitude, longitude } = venue.location;
    const url = Platform.select({
      ios: `maps:0,0?q=${venue.name}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${venue.name})`,
      web: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    });
    
    if (url) {
      Linking.openURL(url);
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

  return (
    <GradientBackground>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView style={styles.container}>
        <View style={styles.imageGallery}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const contentOffset = e.nativeEvent.contentOffset;
              const viewSize = e.nativeEvent.layoutMeasurement;
              const pageNum = Math.floor(contentOffset.x / viewSize.width);
              setActiveImageIndex(pageNum);
            }}
          >
            {venue.images.map((image, index) => (
              <View key={index} style={{ width: Dimensions.get('window').width }}>
                <Image
                  source={{ uri: image }}
                  style={styles.venueImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.imageGradient}
                />
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.imagePagination}>
            {venue.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor: index === activeImageIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  },
                ]}
              />
            ))}
          </View>
          
          <View style={styles.imageActions}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: themeColors.card }]}
              onPress={handleFavoritePress}
            >
              <Heart
                size={20}
                color={themeColors.primary}
                fill={isFavorite ? themeColors.primary : 'transparent'}
              />
            </Pressable>
            
            <Pressable
              style={[styles.actionButton, { backgroundColor: themeColors.card }]}
              onPress={handleSharePress}
            >
              <Share2 size={20} color={themeColors.primary} />
            </Pressable>
          </View>
        </View>
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.venueName, { color: themeColors.text }]}>{venue.name}</Text>
            <Text style={[styles.priceLevel, { color: themeColors.subtext }]}>{renderPriceLevel()}</Text>
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
          </View>
          
          <Text style={[styles.description, { color: themeColors.text }]}>
            {venue.description}
          </Text>
          
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
          
          <View style={styles.contactSection}>
            <Pressable style={styles.contactRow} onPress={handleDirections}>
              <MapPin size={20} color={themeColors.primary} />
              <Text style={[styles.contactText, { color: themeColors.text }]}>
                {venue.address}
              </Text>
            </Pressable>
            
            <Pressable style={styles.contactRow} onPress={handleCall}>
              <Phone size={20} color={themeColors.primary} />
              <Text style={[styles.contactText, { color: themeColors.text }]}>
                {venue.phone}
              </Text>
            </Pressable>
            
            {venue.website && (
              <Pressable style={styles.contactRow} onPress={handleWebsite}>
                <Globe size={20} color={themeColors.primary} />
                <Text style={[styles.contactText, { color: themeColors.text }]}>
                  {venue.website.replace('https://', '')}
                </Text>
              </Pressable>
            )}
            
            {venue.instagram && (
              <Pressable style={styles.contactRow} onPress={handleInstagram}>
                <Instagram size={20} color={themeColors.primary} />
                <Text style={[styles.contactText, { color: themeColors.text }]}>
                  @{venue.instagram}
                </Text>
              </Pressable>
            )}
          </View>
          
          <View style={styles.hoursSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Hours</Text>
            {venue.openHours.map((hours, index) => (
              <View key={index} style={styles.hoursRow}>
                <Text
                  style={[
                    styles.dayText,
                    { 
                      color: hours.day === getCurrentDay() ? themeColors.primary : themeColors.text,
                      fontWeight: hours.day === getCurrentDay() ? '600' : '400',
                    },
                  ]}
                >
                  {hours.day}
                </Text>
                <Text
                  style={[
                    styles.hoursText,
                    { 
                      color: hours.day === getCurrentDay() ? themeColors.primary : themeColors.subtext,
                      fontWeight: hours.day === getCurrentDay() ? '600' : '400',
                    },
                  ]}
                >
                  {hours.closed ? 'Closed' : `${formatTime(hours.open)} - ${formatTime(hours.close)}`}
                </Text>
              </View>
            ))}
          </View>
          
          {venue.specials.length > 0 && venue.specials.some(special => special.day !== getCurrentDay()) && (
            <View style={styles.specialsSection}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Other Specials & Events</Text>
              {venue.specials
                .filter(special => special.day !== getCurrentDay())
                .map((special) => (
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
    </GradientBackground>
  );
}

function getCurrentDay(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  return `${hour % 12 || 12}${minutes !== '00' ? ':' + minutes : ''} ${hour >= 12 ? 'PM' : 'AM'}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  imageGallery: {
    position: 'relative',
    height: 300,
  },
  venueImage: {
    height: 300,
    width: '100%',
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  imagePagination: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  imageActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  venueName: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  priceLevel: {
    fontSize: 18,
    fontWeight: '500',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    marginBottom: 16,
  },
  specialsContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  specialsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  specialText: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  contactSection: {
    marginBottom: 24,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 12,
  },
  hoursSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayText: {
    fontSize: 16,
    width: 100,
  },
  hoursText: {
    fontSize: 16,
  },
  specialsSection: {
    marginBottom: 24,
  },
});