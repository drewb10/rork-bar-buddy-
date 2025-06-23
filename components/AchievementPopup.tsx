import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Modal, Alert } from 'react-native';
import { X, CheckCircle, Circle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAchievementStore, Achievement } from '@/stores/achievementStore';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface AchievementPopupProps {
  visible: boolean;
  onClose: () => void;
  is3AMPopup?: boolean;
}

export default function AchievementPopup({ visible, onClose, is3AMPopup = false }: AchievementPopupProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { achievements, completeAchievement, markPopupShown, mark3AMPopupShown } = useAchievementStore();
  const [selectedAchievements, setSelectedAchievements] = useState<string[]>([]);

  const availableAchievements = achievements.filter(a => !a.completed);

  const toggleAchievement = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setSelectedAchievements(prev => 
      prev.includes(id) 
        ? prev.filter(achievementId => achievementId !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (selectedAchievements.length === 0) {
      Alert.alert('No Achievements Selected', 'Please select at least one achievement to complete.');
      return;
    }

    selectedAchievements.forEach(id => {
      completeAchievement(id);
    });

    if (is3AMPopup) {
      mark3AMPopupShown();
    } else {
      markPopupShown();
    }
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Alert.alert(
      'Achievements Unlocked!',
      `You completed ${selectedAchievements.length} achievement${selectedAchievements.length > 1 ? 's' : ''}! 🎉`,
      [{ text: 'Awesome!', onPress: onClose }]
    );
  };

  const handleClose = () => {
    if (is3AMPopup) {
      mark3AMPopupShown();
    } else {
      markPopupShown();
    }
    onClose();
  };

  const getCategoryTitle = (category: Achievement['category']) => {
    switch (category) {
      case 'bars': return 'Bar Hopping';
      case 'activities': return 'Activities';
      case 'social': return 'Social';
      case 'milestones': return 'Milestones';
      default: return 'Other';
    }
  };

  // Group achievements by category
  const achievementsByCategory = availableAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<Achievement['category'], Achievement[]>);

  // Sort achievements within each category by order
  Object.keys(achievementsByCategory).forEach(category => {
    achievementsByCategory[category as Achievement['category']].sort((a, b) => a.order - b.order);
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={is3AMPopup ? undefined : handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: themeColors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              {is3AMPopup ? 'How was your night? 🌙' : 'Log Tonight\'s Activities 🌙'}
            </Text>
            {!is3AMPopup && (
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <X size={24} color={themeColors.subtext} />
              </Pressable>
            )}
          </View>

          <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
            {is3AMPopup 
              ? 'Time to log your achievements from tonight!' 
              : 'Check off what you accomplished tonight!'
            }
          </Text>

          {/* Achievement List by Category */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={[styles.categoryTitle, { color: themeColors.primary }]}>
                  {getCategoryTitle(category as Achievement['category'])}
                </Text>
                
                {categoryAchievements.map((achievement) => (
                  <Pressable
                    key={achievement.id}
                    style={[
                      styles.achievementItem,
                      {
                        backgroundColor: selectedAchievements.includes(achievement.id) 
                          ? themeColors.primary + '20' 
                          : themeColors.background,
                        borderColor: selectedAchievements.includes(achievement.id)
                          ? themeColors.primary
                          : themeColors.border,
                      }
                    ]}
                    onPress={() => toggleAchievement(achievement.id)}
                  >
                    <View style={styles.achievementContent}>
                      <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                      <View style={styles.achievementText}>
                        <Text style={[
                          styles.achievementTitle, 
                          { 
                            color: selectedAchievements.includes(achievement.id) 
                              ? themeColors.primary 
                              : themeColors.text 
                          }
                        ]}>
                          {achievement.title}
                        </Text>
                        <Text style={[styles.achievementDescription, { color: themeColors.subtext }]}>
                          {achievement.description}
                        </Text>
                      </View>
                      {selectedAchievements.includes(achievement.id) ? (
                        <CheckCircle size={24} color={themeColors.primary} />
                      ) : (
                        <Circle size={24} color={themeColors.subtext} />
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {!is3AMPopup && (
              <Pressable 
                style={[styles.button, styles.skipButton]} 
                onPress={handleClose}
              >
                <Text style={[styles.skipButtonText, { color: themeColors.subtext }]}>
                  Skip for now
                </Text>
              </Pressable>
            )}
            
            <Pressable 
              style={[
                styles.button, 
                styles.submitButton, 
                { 
                  backgroundColor: themeColors.primary,
                  flex: is3AMPopup ? 1 : undefined
                }
              ]} 
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>
                Complete ({selectedAchievements.length})
              </Text>
            </Pressable>

            {is3AMPopup && (
              <Pressable 
                style={[styles.button, styles.skipButton]} 
                onPress={handleClose}
              >
                <X size={20} color={themeColors.subtext} />
              </Pressable>
            )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  scrollView: {
    maxHeight: 300,
    marginBottom: 20,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  achievementItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: 'transparent',
    flex: 0,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#FF6A00',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});