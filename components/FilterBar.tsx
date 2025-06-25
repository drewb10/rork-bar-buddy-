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
    { value: 'club', label: 'Clubs' },
    { value: 'sports-bar', label: 'Sports Bars' },
    { value: 'hangout', label: 'Hangouts' },
    { value: 'pool', label: 'Pool' },
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
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});