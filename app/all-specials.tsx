import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, StatusBar } from 'react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { venues } from '@/mocks/venues';
import SpecialCard from '@/components/SpecialCard';
import FilterBar from '@/components/FilterBar';

export default function AllSpecialsScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [filters, setFilters] = useState<string[]>([]);

  // Collect all specials from all venues
  const allSpecials = venues.flatMap(venue => 
    venue.specials.map(special => ({ venue, special }))
  );

  const filteredSpecials = filters.length > 0
    ? allSpecials.filter(({ special }) => filters.includes(special.type))
    : allSpecials;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        filterType="special"
      />
      
      <ScrollView 
        style={styles.specialsList}
        showsVerticalScrollIndicator={false}
      >
        {filteredSpecials.map(({ venue, special }) => (
          <SpecialCard 
            key={special.id} 
            special={special} 
            venue={venue} 
          />
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
  specialsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  footer: {
    height: 24,
  },
});