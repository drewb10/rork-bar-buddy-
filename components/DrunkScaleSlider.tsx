import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { X, Zap } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import Slider from '@react-native-community/slider';

interface DrunkScaleSliderProps {
  onSubmit: (rating: number) => void;
  onCancel: () => void;
}

export default function DrunkScaleSlider({ onSubmit, onCancel }: DrunkScaleSliderProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [rating, setRating] = useState(5);

  const getRatingLabel = (value: number) => {
    if (value <= 1) return 'Stone Cold Sober';
    if (value <= 2) return 'Barely Buzzed';
    if (value <= 3) return 'Feeling Good';
    if (value <= 4) return 'Getting Tipsy';
    if (value <= 5) return 'Pretty Drunk';
    if (value <= 6) return 'Very Drunk';
    if (value <= 7) return 'Wasted';
    if (value <= 8) return 'Blackout Drunk';
    if (value <= 9) return 'Absolutely Hammered';
    return 'Legendary Status';
  };

  const getRatingColor = (value: number) => {
    if (value <= 2) return '#4CAF50'; // Green
    if (value <= 4) return '#FFC107'; // Yellow
    if (value <= 6) return '#FF9800'; // Orange
    if (value <= 8) return '#F44336'; // Red
    return '#9C27B0'; // Purple
  };

  return (
    <View style={styles.overlay}>
      <View style={[styles.container, { backgroundColor: themeColors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>
            How lit did you get last night?
          </Text>
          <Pressable style={styles.closeButton} onPress={onCancel}>
            <X size={24} color={themeColors.subtext} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.ratingDisplay}>
            <Zap size={40} color={getRatingColor(rating)} />
            <Text style={[styles.ratingNumber, { color: getRatingColor(rating) }]}>
              {rating}/10
            </Text>
          </View>

          <Text style={[styles.ratingLabel, { color: themeColors.text }]}>
            {getRatingLabel(rating)}
          </Text>

          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={rating}
              onValueChange={setRating}
              minimumTrackTintColor={getRatingColor(rating)}
              maximumTrackTintColor={themeColors.border}
              thumbTintColor={getRatingColor(rating)}
            />
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { color: themeColors.subtext }]}>1</Text>
              <Text style={[styles.sliderLabel, { color: themeColors.subtext }]}>10</Text>
            </View>
          </View>

          <Text style={[styles.description, { color: themeColors.subtext }]}>
            Rate your level of intoxication from last night. This helps track your party patterns!
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.submitButton, { backgroundColor: getRatingColor(rating) }]} 
            onPress={() => onSubmit(rating)}
          >
            <Text style={styles.submitButtonText}>Submit Rating</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingNumber: {
    fontSize: 36,
    fontWeight: '800',
    marginLeft: 12,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  sliderContainer: {
    width: '100%',
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#999',
    fontWeight: '500',
    fontSize: 16,
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});