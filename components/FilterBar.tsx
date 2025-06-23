import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Animated } from 'react-native';
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
  const [pressAnimations] = useState<Record<string, Animated.Value>>({});

  const venueTypes: { value: VenueType; label: string }[] = [
    { value: 'sports-bar', label: 'Sports Bar' },
    { value: 'club', label: 'Club' },
    { value: 'hangout', label: 'Hangout' },
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

  const getOrCreateAnimation = (value: string) => {
    if (!pressAnimations[value]) {
      pressAnimations[value] = new Animated.Value(1);
    }
    return pressAnimations[value];
  };

  const handlePressIn = (value: string) => {
    const animation = getOrCreateAnimation(value);
    Animated.spring(animation, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = (value: string) => {
    const animation = getOrCreateAnimation(value);
    Animated.spring(animation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const toggleFilter = (value: string) => {
    if (filters.includes(value)) {
      onFilterChange(filters.filter(f => f !== value));
    } else {
      onFilterChange([...filters, value]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.centeredContent}>
        {options.map((option) => {
          const isSelected = filters.includes(option.value);
          const animation = getOrCreateAnimation(option.value);
          
          return (
            <Animated.View 
              key={option.value}
              style={{ transform: [{ scale: animation }] }}
            >
              <Pressable
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: isSelected
                      ? themeColors.primary
                      : 'transparent',
                    borderColor: themeColors.primary,
                    shadowColor: isSelected ? themeColors.shadowPrimary : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isSelected ? 0.3 : 0,
                    shadowRadius: 8,
                    elevation: isSelected ? 4 : 0,
                  },
                ]}
                onPress={() => toggleFilter(option.value)}
                onPressIn={() => handlePressIn(option.value)}
                onPressOut={() => handlePressOut(option.value)}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: isSelected
                        ? 'white'
                        : themeColors.primary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  centeredContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
});