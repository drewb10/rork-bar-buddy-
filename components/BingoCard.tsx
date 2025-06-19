import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Pressable, Alert, Dimensions } from 'react-native';
import { CheckCircle, Circle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useBingoStore, BingoTask } from '@/stores/bingoStore';
import ConfettiAnimation from '@/components/ConfettiAnimation';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export default function BingoCard() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { tasks, isCompleted, initializeTasks, completeTask, getCompletedCount, resetBingo } = useBingoStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const [previousCompleted, setPreviousCompleted] = useState(false);

  useEffect(() => {
    initializeTasks();
  }, []);

  useEffect(() => {
    if (isCompleted && !previousCompleted) {
      setShowConfetti(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setTimeout(() => setShowConfetti(false), 3000);
    }
    setPreviousCompleted(isCompleted);
  }, [isCompleted]);

  const handleTaskPress = (task: BingoTask) => {
    if (task.completed) return;

    Alert.alert(
      'Complete Task',
      `Mark "${task.title}" as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete', 
          onPress: () => {
            completeTask(task.id);
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        }
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Bingo Card',
      'Are you sure you want to reset your bingo card? This will clear all completed tasks.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: resetBingo
        }
      ]
    );
  };

  const completedCount = getCompletedCount();
  const screenWidth = Dimensions.get('window').width;
  const cardSize = (screenWidth - 64) / 3; // 3 cards per row with padding

  return (
    <View style={styles.container}>
      {showConfetti && <ConfettiAnimation />}
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          Bar Bingo
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
          Complete all 9 tasks for the ultimate nightlife experience!
        </Text>
        <Text style={[styles.progress, { color: themeColors.primary }]}>
          {completedCount}/9 Completed
        </Text>
      </View>

      <View style={styles.grid}>
        {tasks.map((task, index) => (
          <Pressable
            key={task.id}
            style={[
              styles.taskCard,
              { 
                backgroundColor: task.completed ? themeColors.primary + '20' : themeColors.card,
                borderColor: task.completed ? themeColors.primary : themeColors.border,
                width: cardSize,
                height: cardSize,
              }
            ]}
            onPress={() => handleTaskPress(task)}
            disabled={task.completed}
          >
            <View style={styles.taskHeader}>
              <Text style={styles.emoji}>{task.emoji}</Text>
              {task.completed ? (
                <CheckCircle size={20} color={themeColors.primary} />
              ) : (
                <Circle size={20} color={themeColors.subtext} />
              )}
            </View>
            
            <Text 
              style={[
                styles.taskTitle, 
                { 
                  color: task.completed ? themeColors.primary : themeColors.text,
                  opacity: task.completed ? 0.8 : 1
                }
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
          </Pressable>
        ))}
      </View>

      {isCompleted && (
        <View style={[styles.completionBanner, { backgroundColor: themeColors.primary }]}>
          <Text style={styles.completionText}>
            🎉 Bingo Complete! You're a true Bar Buddy! 🎉
          </Text>
        </View>
      )}

      <Pressable 
        style={[styles.resetButton, { backgroundColor: themeColors.card }]}
        onPress={handleReset}
      >
        <Text style={[styles.resetButtonText, { color: themeColors.subtext }]}>
          Reset Bingo Card
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  progress: {
    fontSize: 18,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  taskCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 24,
  },
  taskTitle: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },
  completionBanner: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  completionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  resetButton: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});