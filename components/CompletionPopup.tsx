import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { Zap, Trophy } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

interface CompletionPopupProps {
  visible: boolean;
  title: string;
  xpReward: number;
  type: 'task' | 'trophy';
  onClose: () => void;
}

export default function CompletionPopup({ visible, title, xpReward, type, onClose }: CompletionPopupProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.popup,
            {
              backgroundColor: themeColors.card,
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.iconContainer}>
            {type === 'trophy' ? (
              <Trophy size={32} color="#FFD60A" />
            ) : (
              <Zap size={32} color="#FF6B35" />
            )}
          </View>
          
          <Text style={[styles.title, { color: themeColors.text }]}>
            {type === 'trophy' ? '🏆 Trophy Unlocked!' : '🎉 Task Complete!'}
          </Text>
          
          <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
            {title}
          </Text>
          
          <View style={styles.xpBadge}>
            <Zap size={16} color="#FFD60A" />
            <Text style={styles.xpText}>+{xpReward} XP</Text>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  popup: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 300,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 214, 10, 0.2)',
  },
  xpText: {
    color: '#FFD60A',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
});