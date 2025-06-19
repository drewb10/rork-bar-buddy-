import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

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
  syncToSupabase: () => Promise<void>;
  loadFromSupabase: () => Promise<void>;
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
        // Load from Supabase on init
        get().loadFromSupabase();
      },

      completeTask: async (taskId: string) => {
        const now = new Date().toISOString();
        
        set((state) => {
          const updatedTasks = state.tasks.map(task =>
            task.id === taskId && !task.completed
              ? { ...task, completed: true, completedAt: now }
              : task
          );

          const completedCount = updatedTasks.filter(t => t.completed).length;
          const isCompleted = completedCount === 9;

          return {
            tasks: updatedTasks,
            isCompleted,
            completedAt: isCompleted && !state.isCompleted ? now : state.completedAt
          };
        });

        // Sync to Supabase
        await get().syncToSupabase();
      },

      resetBingo: async () => {
        const resetTasks: BingoTask[] = defaultTasks.map(task => ({
          ...task,
          completed: false
        }));
        
        set({
          tasks: resetTasks,
          isCompleted: false,
          completedAt: undefined
        });

        // Clear from Supabase
        try {
          const userProfileStore = (window as any).__userProfileStore;
          const userId = userProfileStore?.getState?.()?.profile?.userId;
          
          if (userId && userId !== 'default') {
            await supabase
              .from('bingo_completions')
              .delete()
              .eq('user_id', userId);

            await supabase
              .from('bingo_card_completions')
              .delete()
              .eq('user_id', userId);
          }
        } catch (error) {
          console.warn('Error clearing bingo from Supabase:', error);
        }
      },

      getCompletedCount: () => {
        const { tasks } = get();
        return tasks.filter(task => task.completed).length;
      },

      syncToSupabase: async () => {
        try {
          const userProfileStore = (window as any).__userProfileStore;
          const userId = userProfileStore?.getState?.()?.profile?.userId;
          
          if (!userId || userId === 'default') return;

          const { tasks, isCompleted, completedAt } = get();
          
          // Sync completed tasks
          const completedTasks = tasks.filter(task => task.completed);
          
          for (const task of completedTasks) {
            const { error } = await supabase
              .from('bingo_completions')
              .upsert({
                user_id: userId,
                task_id: task.id,
                completed_at: task.completedAt || new Date().toISOString(),
              });

            if (error) {
              console.warn('Failed to sync bingo task to Supabase:', error);
            }
          }

          // Sync bingo card completion
          if (isCompleted && completedAt) {
            const { error } = await supabase
              .from('bingo_card_completions')
              .upsert({
                user_id: userId,
                completed_at: completedAt,
              });

            if (error) {
              console.warn('Failed to sync bingo completion to Supabase:', error);
            }
          }
        } catch (error) {
          console.warn('Error syncing bingo to Supabase:', error);
        }
      },

      loadFromSupabase: async () => {
        try {
          const userProfileStore = (window as any).__userProfileStore;
          const userId = userProfileStore?.getState?.()?.profile?.userId;
          
          if (!userId || userId === 'default') return;

          // Load completed tasks
          const { data: completedTasks, error: tasksError } = await supabase
            .from('bingo_completions')
            .select('*')
            .eq('user_id', userId);

          if (tasksError) {
            console.warn('Failed to load bingo tasks from Supabase:', tasksError);
            return;
          }

          // Load bingo card completion
          const { data: cardCompletion, error: cardError } = await supabase
            .from('bingo_card_completions')
            .select('*')
            .eq('user_id', userId)
            .order('completed_at', { ascending: false })
            .limit(1);

          if (cardError) {
            console.warn('Failed to load bingo card completion from Supabase:', cardError);
          }

          // Update local state
          set((state) => {
            const updatedTasks = state.tasks.map(task => {
              const completed = completedTasks?.find(ct => ct.task_id === task.id);
              return completed 
                ? { ...task, completed: true, completedAt: completed.completed_at }
                : task;
            });

            const isCompleted = cardCompletion && cardCompletion.length > 0;
            const completedAt = isCompleted ? cardCompletion[0].completed_at : undefined;

            return {
              tasks: updatedTasks,
              isCompleted: !!isCompleted,
              completedAt
            };
          });
        } catch (error) {
          console.warn('Error loading bingo from Supabase:', error);
        }
      }
    }),
    {
      name: 'bingo-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Store reference for cross-store access
if (typeof window !== 'undefined') {
  (window as any).__bingoStore = useBingoStore;
}