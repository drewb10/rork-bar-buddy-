import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Alert } from 'react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import { useRouter } from 'expo-router';

interface OnboardingModalProps {
  visible: boolean;
  onComplete?: () => void;
}

export default function OnboardingModal({ visible, onComplete }: OnboardingModalProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      router.push('/auth/sign-up');
    } else if (onComplete) {
      onComplete();
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={[styles.container, { backgroundColor: themeColors.card }]}>
        <View style={styles.logoContainer}>
          <BarBuddyLogo size="medium" />
        </View>
        
        <Text style={[styles.title, { color: themeColors.text }]}>
          Welcome to Bar Buddy!
        </Text>
        
        <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
          Your ultimate nightlife companion for discovering bars, tracking your adventures, and connecting with fellow bar enthusiasts.
        </Text>

        <View style={styles.featureList}>
          <Text style={[styles.feature, { color: themeColors.text }]}>
            🍻 Discover the best bars in your area
          </Text>
          <Text style={[styles.feature, { color: themeColors.text }]}>
            📊 Track your nightlife stats and achievements
          </Text>
          <Text style={[styles.feature, { color: themeColors.text }]}>
            💬 Chat anonymously with other bar-goers
          </Text>
          <Text style={[styles.feature, { color: themeColors.text }]}>
            🏆 Earn XP and unlock new ranks
          </Text>
        </View>
        
        <Pressable 
          style={[styles.getStartedButton, { backgroundColor: themeColors.primary }]} 
          onPress={handleGetStarted}
        >
          <Text style={styles.getStartedButtonText}>
            Get Started
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  feature: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  getStartedButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  getStartedButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});