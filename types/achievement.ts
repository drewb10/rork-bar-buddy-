export interface Achievement {
  id: string;
  title: string;
  description: string;
  detailedDescription?: string;
  category: 'bars' | 'activities' | 'social' | 'milestones';
  icon?: string;
  maxProgress?: number;
  progress?: number;
  completed: boolean;
  xpReward: number; // ✅ FIX: Add missing xpReward property
  level?: number;
  unlockedAt?: string;
}

export interface CompletedAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'bars' | 'activities' | 'social' | 'milestones';
  completedAt: string;
  level: number;
  baseId: string;
  xpReward: number;
}