import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, AlertCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { venues } from '@/mocks/venues';
import FilterBar from '@/components/FilterBar';
import EmptyState from '@/components/EmptyState';
import { LinearGradient } from 'expo-linear-gradient';

// This is a placeholder for the map component
// In a real app, you would use react-native-maps
const MapPlaceholder = ({ onPressMarker }: { onPressMarker: (id: string) => void }) => {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  
  return (
    <View style={[styles.mapContainer, { backgroundColor: themeColors.card }]}>
      <LinearGradient
        colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)']}
        style={StyleSheet.absoluteFill}
      />
      <Text style={[styles.mapPlaceholderText, { color: themeColors.text }]}>
        Map View
      </Text>
      <Text style={[styles.mapSubtext, { color: themeColors.subtext }]}>
        In a real app, this would be an interactive map showing all venues
      </Text>
      
      <View style={styles.markersContainer}>
        {venues.map((venue) => (
          <View 
            key={venue.id}
            style={[
              styles.markerPlaceholder,
              { 
                left: `${30 + Math.random() * 40}%`, 
                top: `${20 + Math.random() * 50}%`,
                backgroundColor: themeColors.primary
              }
            ]}
            onTouchEnd={() => onPressMarker(venue.id)}
          >
            <MapPin size={16} color="white" />
          </View>
        ))}
      </View>
    </View>
  );
};

export default function MapScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [filters, setFilters] = useState<string[]>([]);
  const [hasLocationPermission, setHasLocationPermission] = useState(true);

  // In a real app, you would request location permissions here
  useEffect(() => {
    // Simulating permission check
    setHasLocationPermission(true);
  }, []);

  const handleMarkerPress = (venueId: string) => {
    router.push(`/venue/${venueId}`);
  };

  if (!hasLocationPermission) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <EmptyState
          title="Location Access Required"
          message="Please enable location services to view nearby venues on the map."
          icon={<AlertCircle size={48} color={themeColors.primary} />}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        filterType="venue"
      />
      
      {Platform.OS !== 'web' ? (
        // On native platforms, we would use react-native-maps
        <MapPlaceholder onPressMarker={handleMarkerPress} />
      ) : (
        // On web, we show a placeholder
        <MapPlaceholder onPressMarker={handleMarkerPress} />
      )}
      
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: themeColors.subtext }]}>
          {filters.length > 0 
            ? `Showing ${filters.length} filtered venue types` 
            : 'Showing all venues'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    margin: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  mapPlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mapSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  markersContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  markerPlaceholder: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});