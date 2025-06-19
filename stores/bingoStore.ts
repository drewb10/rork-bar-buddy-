import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpcClient } from '@/lib/trpc';

export interface BingoTask {
  id: string;
  title: string;
  description: string;
  emoji: string;
  completed: boolean;
  completedAt?: string;
}

interface BingoState {
  tasks: BingoTask[];
  isCompleted: boolean;
  completedAt?: string;
  initializeTasks: () => void;
  completeTask: (taskId: string) => void;
  resetBingo: () => void;
  getCompletedCount: () => number;
}

const defaultTasks: Omit<BingoTask, 'completed' | 'completedAt'>[] = [
  {
    id: 'shots-late-nite',
    title: 'Took shots at Late Nite',
    description: 'Get lit at the hottest club',
    emoji: '🥃'
  },
  {
    id: 'dart-bird',
    title: 'Smoked a dart at The Bird',
    description: 'Step outside for a quick break',
    emoji: '🚬'
  },
  {
    id: 'pool-jba',
    title: 'Played pool at JBA',
    description: 'Show off your skills',
    emoji: '🎱'
  },
  {
    id: 'three-bars',
    title: 'Went to 3 bars in one night',
    description: 'Bar hop like a pro',
    emoji: '🍻'
  },
  {
    id: 'group-shot-cashmans',
    title: 'Took a group shot at Cashmans',
    description: 'Cheers with the crew',
    emoji: '📸'
  },
  {
    id: 'drink-grants',
    title: 'Got a drink at Grants',
    description: 'Visit the legendary venue',
    emoji: '🍺'
  },
  {
    id: 'bathroom-selfie',
    title: 'Took a selfie in a bathroom',
    description: 'Classic nightlife moment',
    emoji: '🤳'
  },
  {
    id: 'beer-library',
    title: 'Drank a beer at The Library',
    description: 'Study up on good times',
    emoji: '📚'
  },
  {
    id: 'surprise-drink',
    title: 'Asked bartender for surprise drink',
    description: 'Live dangerously',
    emoji: '🎲'
  }
];

export const useBingoStore = create<BingoState>()(
  persist(
    (set, get) => ({
      tasks: [],
      isCompleted: false,
      completedAt: undefined,

      initializeTasks: () => {
        const { tasks } = get();
        if (tasks.length === 0) {
          const initialTasks: BingoTask[] = defaultTasks.map(task => ({
            ...task,
            completed: false
          }));
          set({ tasks: initialTasks });
        }
      },

      completeTask: (taskId: string) => {
        const now = new Date().toISOString();
        
        set((state) => {
          const updatedTasks = state.tasks.map(task =>
            task.id === taskId && !task.completed
              ? { ...task, completed: true, completedAt: now }
              : task
          );

          const completedCount = updatedTasks.filter(t => t.completed).length;
          const isCompleted = completedCount === 9;

          // Sync to cloud
          trpcClient.bingo.completeTask.mutate({
            taskId,
            timestamp: now,
          }).catch(error => {
            console.warn('Failed to sync bingo task to cloud:', error);
          });

          if (isCompleted && !state.isCompleted) {
            // Sync bingo completion to cloud
            trpcClient.bingo.completeBingo.mutate({
              timestamp: now,
            }).catch(error => {
              console.warn('Failed to sync bingo completion to cloud:', error);
            });
          }

          return {
            tasks: updatedTasks,
            isCompleted,
            completedAt: isCompleted && !state.isCompleted ? now : state.completedAt
          };
        });
      },

      resetBingo: () => {
        const resetTasks: BingoTask[] = defaultTasks.map(task => ({
          ...task,
          completed: false
        }));
        
        set({
          tasks: resetTasks,
          isCompleted: false,
          completedAt: undefined
        });
      },

      getCompletedCount: () => {
        const { tasks } = get();
        return tasks.filter(task => task.completed).length;
      }
    }),
    {
      name: 'bingo-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);