import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, Animated } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAchievementStore } from '@/stores/achievementStore';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface AchievementPopupProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  is3AMPopup?: boolean;
}

export default function AchievementPopup({ 
  visible, 
  onClose, 
  title = "Log Tonight's Activities",
  message = "Don't forget to track your night out activities!",
  is3AMPopup = false
}: AchievementPopupProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { mark3AMPopupShown } = useAchievementStore();
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    if (is3AMPopup) {
      mark3AMPopupShown();
    }
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container, 
            { 
              backgroundColor: themeColors.card,
              opacity: fadeAnim,
              transform: [{
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              }]
            }
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              {title}
            </Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={themeColors.text} />
            </Pressable>
          </View>
          
          <Text style={[styles.message, { color: themeColors.subtext }]}>
            {message}
          </Text>

          {is3AMPopup && (
            <View style={styles.timeInfo}>
              <Text style={[styles.timeText, { color: themeColors.primary }]}>
                🌙 3:00 AM Reminder
              </Text>
              <Text style={[styles.subtimeText, { color: themeColors.subtext }]}>
                Time to wrap up and log your activities!
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.button, { backgroundColor: themeColors.primary }]}
            onPress={handleClose}
          >
            <Text style={styles.buttonText}>Got it!</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  timeInfo: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtimeText: {
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});