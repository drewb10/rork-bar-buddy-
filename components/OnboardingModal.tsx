import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, TextInput, Alert, Animated } from 'react-native';
import { User } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: (firstName: string, lastName: string) => void;
}

export default function OnboardingModal({ visible, onComplete }: OnboardingModalProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [scaleAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      scaleAnimation.setValue(0);
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Fields', 'Please enter both your first and last name.');
      return;
    }

    Animated.spring(scaleAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      onComplete(firstName.trim(), lastName.trim());
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {Platform.OS !== 'web' ? (
        <BlurView intensity={30} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: themeColors.overlay }]} />
      )}
      
      <Animated.View 
        style={[
          styles.container, 
          { 
            backgroundColor: themeColors.cardElevated,
            transform: [{ scale: scaleAnimation }],
            shadowColor: themeColors.shadowSecondary,
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.4,
            shadowRadius: 30,
            elevation: 20,
          }
        ]}
      >
        <View style={styles.logoContainer}>
          <BarBuddyLogo size="medium" />
        </View>
        
        <Text style={[styles.title, { color: themeColors.text }]}>
          Welcome to Bar Buddy!
        </Text>
        
        <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
          Let's get you set up with your profile
        </Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: themeColors.text }]}>First Name</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: themeColors.background,
              color: themeColors.text,
              borderColor: themeColors.border,
              shadowColor: themeColors.shadowSecondary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter your first name"
            placeholderTextColor={themeColors.subtext}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: themeColors.text }]}>Last Name</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: themeColors.background,
              color: themeColors.text,
              borderColor: themeColors.border,
              shadowColor: themeColors.shadowSecondary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }]}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter your last name"
            placeholderTextColor={themeColors.subtext}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        <Text style={[styles.infoText, { color: themeColors.subtext }]}>
          We'll create a unique ID for you to connect with friends!
        </Text>
        
        <Pressable 
          style={[styles.submitButton, { 
            backgroundColor: themeColors.primary,
            shadowColor: themeColors.shadowPrimary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 6,
          }]} 
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Get Started</Text>
        </Pressable>
      </Animated.View>
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
    zIndex: 1000,
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  submitButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    width: '100%',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});