import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { VenueType, SpecialType } from '@/types/venue';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

interface FilterBarProps {
  filters: string[];
  onFilterChange: (filters: string[]) => void;
  filterType: 'venue' | 'special';
}

export default function FilterBar({ filters, onFilterChange, filterType }: FilterBarProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const venueTypes: { value: VenueType; label: string }[] = [
    { value: 'dive-bar', label: 'Dive Bar' },
    { value: 'sports-bar', label: 'Sports Bar' },
    { value: 'club', label: 'Club' },
    { value: 'brewery', label: 'Brewery' },
  ];

  const specialTypes: { value: SpecialType; label: string }[] = [
    { value: 'happy-hour', label: 'Happy Hour' },
    { value: 'ladies-night', label: 'Ladies Night' },
    { value: 'trivia-night', label: 'Trivia Night' },
    { value: 'karaoke', label: 'Karaoke' },
    { value: 'live-music', label: 'Live Music' },
    { value: 'college-night', label: 'College Night' },
    { value: 'drink-special', label: 'Drink Special' },
    { value: 'food-special', label: 'Food Special' },
  ];

  const options = filterType === 'venue' ? venueTypes : specialTypes;

  const toggleFilter = (value: string) => {
    if (filters.includes(value)) {
      onFilterChange(filters.filter(f => f !== value));
    } else {
      onFilterChange([...filters, value]);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((option) => (
        <Pressable
          key={option.value}
          style={[
            styles.filterButton,
            {
              backgroundColor: filters.includes(option.value)
                ? themeColors.primary
                : 'transparent',
              borderColor: themeColors.primary,
            },
          ]}
          onPress={() => toggleFilter(option.value)}
        >
          <Text
            style={[
              styles.filterText,
              {
                color: filters.includes(option.value)
                  ? 'white'
                  : themeColors.primary,
              },
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
});