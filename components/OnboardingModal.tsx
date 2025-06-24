import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, TextInput, Alert } from 'react-native';
import { User } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import TermsOfServiceModal from '@/components/TermsOfServiceModal';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: (firstName: string, lastName: string) => void;
}

export default function OnboardingModal({ visible, onComplete }: OnboardingModalProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const handleSubmit = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Fields', 'Please enter both your first and last name.');
      return;
    }

    if (!hasAcceptedTerms) {
      setShowTerms(true);
      return;
    }

    onComplete(firstName.trim(), lastName.trim());
  };

  const handleTermsAccept = () => {
    setHasAcceptedTerms(true);
    setShowTerms(false);
    
    // If we have the name info, complete onboarding
    if (firstName.trim() && lastName.trim()) {
      onComplete(firstName.trim(), lastName.trim());
    }
  };

  const handleTermsDecline = () => {
    setShowTerms(false);
    setHasAcceptedTerms(false);
    Alert.alert(
      'Terms Required',
      'You must accept the Terms of Service to use BarBuddy.',
      [{ text: 'OK' }]
    );
  };

  if (!visible) return null;

  return (
    <>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: themeColors.card }]}>
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
                borderColor: themeColors.border
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
                borderColor: themeColors.border
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

          {hasAcceptedTerms && (
            <View style={[styles.termsAcceptedContainer, { backgroundColor: themeColors.primary + '20' }]}>
              <Text style={[styles.termsAcceptedText, { color: themeColors.primary }]}>
                ✓ Terms of Service accepted
              </Text>
            </View>
          )}
          
          <Pressable 
            style={[styles.submitButton, { backgroundColor: themeColors.primary }]} 
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              {hasAcceptedTerms ? 'Get Started' : 'Continue'}
            </Text>
          </Pressable>

          {!hasAcceptedTerms && (
            <Pressable 
              style={styles.termsLink}
              onPress={() => setShowTerms(true)}
            >
              <Text style={[styles.termsLinkText, { color: themeColors.primary }]}>
                View Terms of Service
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <TermsOfServiceModal
        visible={showTerms}
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
      />
    </>
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
    borderRadius: 12,
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
  termsAcceptedContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  termsAcceptedText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  termsLink: {
    paddingVertical: 8,
  },
  termsLinkText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});