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
  xpReward?: number; // Add this missing property
  level?: number;
  unlockedAt?: string;
}

// Example usage in your stores or components:
// The xpReward property should typically be set to values like:
// - Basic achievements: 100 XP
// - Medium achievements: 250 XP  
// - Hard achievements: 500 XP
// - Milestone achievements: 1000+ XP