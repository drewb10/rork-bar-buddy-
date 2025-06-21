import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Modal } from 'react-native';
import { X, Zap, Check, Sparkles } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface DrunkScaleSliderProps {
  onSubmit: (rating: number) => void;
  onCancel: () => void;
}

export default function DrunkScaleSlider({ onSubmit, onCancel }: DrunkScaleSliderProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [rating, setRating] = useState(5);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  const getRatingEmoji = (value: number) => {
    if (value <= 2) return '😊';
    if (value <= 4) return '🙂';
    if (value <= 6) return '😵‍💫';
    if (value <= 8) return '🤢';
    return '💀';
  };

  const handleSubmit = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setShowSuccessModal(true);
    
    // Auto-submit after showing success animation
    setTimeout(() => {
      setShowSuccessModal(false);
      onSubmit(rating);
    }, 2000);
  };

  const handleSliderChange = (value: number) => {
    setRating(value);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  if (showSuccessModal) {
    return (
      <View style={styles.overlay}>
        <View style={[styles.successContainer, { backgroundColor: themeColors.card }]}>
          <View style={[styles.successIcon, { backgroundColor: getRatingColor(rating) }]}>
            <Check size={40} color="white" />
          </View>
          
          <Text style={[styles.successTitle, { color: themeColors.text }]}>
            Rating Submitted! {getRatingEmoji(rating)}
          </Text>
          
          <Text style={[styles.successSubtitle, { color: themeColors.subtext }]}>
            You rated last night as {rating}/10
          </Text>
          
          <Text style={[styles.successLabel, { color: getRatingColor(rating) }]}>
            "{getRatingLabel(rating)}"
          </Text>
          
          <View style={[styles.xpBadge, { backgroundColor: themeColors.primary + '20' }]}>
            <Sparkles size={16} color={themeColors.primary} />
            <Text style={[styles.xpText, { color: themeColors.primary }]}>
              Thanks for sharing!
            </Text>
          </View>
        </View>
      </View>
    );
  }

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
            <Text style={styles.ratingEmoji}>{getRatingEmoji(rating)}</Text>
            <View style={styles.ratingInfo}>
              <Text style={[styles.ratingNumber, { color: getRatingColor(rating) }]}>
                {rating}/10
              </Text>
              <Text style={[styles.ratingLabel, { color: themeColors.text }]}>
                {getRatingLabel(rating)}
              </Text>
            </View>
          </View>

          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={rating}
              onValueChange={handleSliderChange}
              minimumTrackTintColor={getRatingColor(rating)}
              maximumTrackTintColor={themeColors.border}
              thumbTintColor={getRatingColor(rating)}
            />
            <View style={styles.sliderLabels}>
              <View style={styles.sliderLabelContainer}>
                <Text style={[styles.sliderLabel, { color: themeColors.subtext }]}>1</Text>
                <Text style={[styles.sliderSubLabel, { color: themeColors.subtext }]}>Sober</Text>
              </View>
              <View style={styles.sliderLabelContainer}>
                <Text style={[styles.sliderLabel, { color: themeColors.subtext }]}>10</Text>
                <Text style={[styles.sliderSubLabel, { color: themeColors.subtext }]}>Legendary</Text>
              </View>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: themeColors.background }]}>
            <Zap size={16} color={themeColors.primary} />
            <Text style={[styles.description, { color: themeColors.subtext }]}>
              Rate your level of intoxication from last night. This helps track your party patterns and builds your Bar Buddy profile!
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.submitButton, { backgroundColor: getRatingColor(rating) }]} 
            onPress={handleSubmit}
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
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,106,0,0.1)',
  },
  ratingEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  ratingInfo: {
    flex: 1,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
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
  sliderLabelContainer: {
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  sliderSubLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
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
  // Success modal styles
  successContainer: {
    width: '90%',
    maxWidth: 350,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  successLabel: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
  },
});