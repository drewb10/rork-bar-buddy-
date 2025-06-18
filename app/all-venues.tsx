import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, StatusBar } from 'react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { venues } from '@/mocks/venues';
import VenueCard from '@/components/VenueCard';
import FilterBar from '@/components/FilterBar';

export default function AllVenuesScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [filters, setFilters] = useState<string[]>([]);

  const filteredVenues = filters.length > 0
    ? venues.filter(venue => venue.types.some(type => filters.includes(type)))
    : venues;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        filterType="venue"
      />
      
      <ScrollView 
        style={styles.venueList}
        showsVerticalScrollIndicator={false}
      >
        {filteredVenues.map(venue => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  venueList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  footer: {
    height: 24,
  },
});