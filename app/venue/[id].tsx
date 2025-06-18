import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, Pressable, Linking, Platform, Dimensions, StatusBar } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Phone, Globe, Clock, Heart, Instagram, Share2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { getVenueById } from '@/mocks/venues';
import SpecialCard from '@/components/SpecialCard';
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

  // Add Stack.Screen options to customize header
  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: venue?.name || 'Venue',
          headerBackTitle: '', // iOS: Remove back button text
          headerTitleStyle: {
            fontSize: 16, // Make title smaller to prevent overflow
          },
        }} 
      />
      
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Rest of your existing component code... */}
      </View>
    </>
  );
}

// Rest of your existing styles and code...