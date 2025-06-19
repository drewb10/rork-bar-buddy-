import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, Alert } from 'react-native';
import { Calendar, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import BarBuddyLogo from './BarBuddyLogo';

interface AgeVerificationModalProps {
  visible: boolean;
  onVerify: (isOfAge: boolean) => void;
}

export default function AgeVerificationModal({ visible, onVerify }: AgeVerificationModalProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const handleVerification = (isOfAge: boolean) => {
    if (!isOfAge) {
      Alert.alert(
        'Age Restriction',
        'You must be at least 18 years old to use this app.',
        [{ text: 'OK', onPress: () => onVerify(false) }]
      );
    } else {
      onVerify(true);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={() => {}} // Prevent closing without verification
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: themeColors.card }]}>
          <BarBuddyLogo size="medium" />
          
          <Text style={[styles.title, { color: themeColors.text }]}>
            Age Verification Required
          </Text>
          
          <View style={styles.iconContainer}>
            <Calendar size={48} color={themeColors.primary} />
          </View>
          
          <Text style={[styles.message, { color: themeColors.text }]}>
            You must be at least 18 years old to use Bar Buddy.
          </Text>
          
          <Text style={[styles.question, { color: themeColors.text }]}>
            Are you 18 years of age or older?
          </Text>
          
          <View style={styles.buttonContainer}>
            <Pressable 
              style={[styles.button, styles.noButton, { borderColor: themeColors.error }]}
              onPress={() => handleVerification(false)}
            >
              <Text style={[styles.buttonText, { color: themeColors.error }]}>
                No, I'm under 18
              </Text>
            </Pressable>
            
            <Pressable 
              style={[styles.button, styles.yesButton, { backgroundColor: themeColors.primary }]}
              onPress={() => handleVerification(true)}
            >
              <Text style={[styles.buttonText, { color: 'white' }]}>
                Yes, I'm 18 or older
              </Text>
            </Pressable>
          </View>
          
          <Text style={[styles.disclaimer, { color: themeColors.subtext }]}>
            By continuing, you confirm that you are of legal drinking age in your jurisdiction.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  noButton: {
    backgroundColor: 'transparent',
  },
  yesButton: {
    borderColor: 'transparent',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});