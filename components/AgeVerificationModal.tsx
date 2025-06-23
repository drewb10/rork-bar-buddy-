import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, Alert, Animated } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';

interface AgeVerificationModalProps {
  visible: boolean;
  onVerify: (isOfAge: boolean) => void;
}

export default function AgeVerificationModal({ visible, onVerify }: AgeVerificationModalProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
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

  const handleVerification = (isOfAge: boolean) => {
    if (!isOfAge) {
      Alert.alert(
        'Age Restriction',
        'You must be at least 21 years old to use this app.',
        [{ text: 'OK', onPress: () => onVerify(false) }]
      );
    } else {
      Animated.spring(scaleAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start(() => {
        onVerify(true);
      });
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
            Age Verification Required
          </Text>
          
          <Text style={[styles.question, { color: themeColors.text }]}>
            Are you 21 years of age or older?
          </Text>
          
          <View style={styles.buttonContainer}>
            <Pressable 
              style={[styles.button, styles.noButton, { 
                borderColor: themeColors.error,
                shadowColor: themeColors.error,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 2,
              }]}
              onPress={() => handleVerification(false)}
            >
              <Text style={[styles.buttonText, { color: themeColors.error }]}>
                No, I'm under 21
              </Text>
            </Pressable>
            
            <Pressable 
              style={[styles.button, styles.yesButton, { 
                backgroundColor: themeColors.primary,
                shadowColor: themeColors.shadowPrimary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 6,
              }]}
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
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 16,
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