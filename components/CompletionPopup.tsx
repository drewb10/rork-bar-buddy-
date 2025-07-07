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
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayTouchable} onPress={handleClose} />
        <Animated.View
          style={[
            styles.popup,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: type === 'trophy' ? '#FFD60A20' : '#FF6B3520' }]}>
            {type === 'trophy' ? (
              <Trophy size={32} color="#FFD60A" />
            ) : (
              <Zap size={32} color="#FF6B35" />
            )}
          </View>
          
          <Text style={[styles.emoji, { color: themeColors.text }]}>
            {type === 'trophy' ? '🏆' : '🎉'}
          </Text>
          
          <Text style={[styles.title, { color: themeColors.text }]}>
            {type === 'trophy' ? 'Trophy Unlocked!' : 'Task Complete!'}
          </Text>
          
          <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
            {title}
          </Text>
          
          <View style={[styles.xpBadge, { backgroundColor: '#FFD60A20' }]}>
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
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  popup: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 300,
    margin: 20,
    borderWidth: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  xpText: {
    color: '#FFD60A',
    fontSize: 14,
    fontWeight: '700' as const,
    marginLeft: 6,
  },
});