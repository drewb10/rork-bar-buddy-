import React from 'react';
import { StyleSheet, View, Text, Modal, Pressable } from 'react-native';
import { X, Plus, Minus, TrendingUp, Zap } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

interface DailyTrackerModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function DailyTrackerModal({ visible, onClose }: DailyTrackerModalProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: themeColors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              Daily Tracker
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={themeColors.text} />
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.description, { color: themeColors.subtext }]}>
              Track your drinks and activities for the night!
            </Text>
            
            <View style={styles.comingSoon}>
              <Text style={[styles.comingSoonText, { color: themeColors.primary }]}>
                Coming Soon! 🚀
              </Text>
            </View>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 20,
    paddingVertical: 24,
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
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  comingSoon: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 106, 0, 0.1)',
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});