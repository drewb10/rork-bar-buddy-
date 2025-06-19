import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, Alert, Image } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

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
        'You must be at least 21 years old to use this app.',
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
          <Image
            source={{ uri: 'https://i.postimg.cc/PJBBvg5t/Screenshot-2025-06-19-at-1-25-27-PM.png' }}
            style={styles.popupImage}
            resizeMode="contain"
          />
          
          <Text style={[styles.title, { color: themeColors.text }]}>
            Age Verification Required
          </Text>
          
          <Text style={[styles.question, { color: themeColors.text }]}>
            Are you 21 years of age or older?
          </Text>
          
          <View style={styles.buttonContainer}>
            <Pressable 
              style={[styles.button, styles.noButton, { borderColor: themeColors.error }]}
              onPress={() => handleVerification(false)}
            >
              <Text style={[styles.buttonText, { color: themeColors.error }]}>
                No, I'm under 21
              </Text>
            </Pressable>
            
            <Pressable 
              style={[styles.button, styles.yesButton, { backgroundColor: themeColors.primary }]}
              onPress={() => handleVerification(true)}
            >
              <Text style={[styles.buttonText, { color: 'white' }]}>
                Yes, I'm 21 or older
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
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  popupImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
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
    lineHeight: 18,
  },
});