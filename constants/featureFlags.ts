/**
 * BarBuddy Feature Flags - MVP Configuration
 * 
 * Set flags to true to enable features, false to disable.
 * All code is preserved - just toggled on/off with these flags.
 * 
 * For MVP Launch: All flags below are set to FALSE
 * For Full App: Change flags to TRUE as needed
 */

export const FEATURE_FLAGS = {
  // Achievement System
  ENABLE_ACHIEVEMENTS: false,           // Achievement tracking, task completion, badges
  ENABLE_TROPHIES: false,              // Trophy system and trophy displays
  
  // Experience & Progression  
  ENABLE_XP_SYSTEM: false,             // XP earning, level progression, XP displays
  ENABLE_STATS_TRACKING: false,        // Detailed user stats, analytics tracking
  
  // User Experience Features
  ENABLE_DAILY_TRACKER: false,        // Daily activity tracking and popups
  ENABLE_ONBOARDING: false,           // User onboarding flow and tutorials
  ENABLE_ADVANCED_PROFILE: false,     // Complex profile features, detailed stats
  
  // Notification Systems
  ENABLE_COMPLETION_POPUPS: false,    // Achievement/task completion notifications
  ENABLE_XP_NOTIFICATIONS: false,     // XP gain notifications and level up alerts
  
  // Social Features (Advanced)
  ENABLE_FRIEND_REQUESTS: false,      // Friend request system
  ENABLE_SOCIAL_STATS: false,         // Social comparison and leaderboards
  
  // Analytics & Tracking
  ENABLE_VENUE_ANALYTICS: false,      // Detailed venue visit tracking
  ENABLE_USER_JOURNEY: false,         // User journey tracking and insights
  
  // Always Enabled (Core MVP Features)
  ENABLE_HOME: true,                   // Home page with venue listing - ALWAYS ON
  ENABLE_LIKE_SYSTEM: true,           // Like buttons and global counters - ALWAYS ON  
  ENABLE_CHAT: true,                   // Chat system - ALWAYS ON
  ENABLE_BASIC_AUTH: true,             // Authentication - ALWAYS ON
  ENABLE_BASIC_PROFILE: true,         // Basic profile info - ALWAYS ON
  ENABLE_AGE_VERIFICATION: true,      // Age verification - ALWAYS ON
} as const;

/**
 * Helper function to check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature];
};

/**
 * Feature Groups for easier management
 */
export const FEATURE_GROUPS = {
  MVP_CORE: [
    'ENABLE_HOME',
    'ENABLE_LIKE_SYSTEM', 
    'ENABLE_CHAT',
    'ENABLE_BASIC_AUTH',
    'ENABLE_BASIC_PROFILE',
    'ENABLE_AGE_VERIFICATION'
  ] as Array<keyof typeof FEATURE_FLAGS>,
  
  GAMIFICATION: [
    'ENABLE_ACHIEVEMENTS',
    'ENABLE_TROPHIES', 
    'ENABLE_XP_SYSTEM',
    'ENABLE_XP_NOTIFICATIONS'
  ] as Array<keyof typeof FEATURE_FLAGS>,
  
  ADVANCED_UX: [
    'ENABLE_DAILY_TRACKER',
    'ENABLE_ONBOARDING',
    'ENABLE_ADVANCED_PROFILE',
    'ENABLE_COMPLETION_POPUPS'
  ] as Array<keyof typeof FEATURE_FLAGS>,
  
  SOCIAL_ADVANCED: [
    'ENABLE_FRIEND_REQUESTS',
    'ENABLE_SOCIAL_STATS'
  ] as Array<keyof typeof FEATURE_FLAGS>,
  
  ANALYTICS: [
    'ENABLE_STATS_TRACKING',
    'ENABLE_VENUE_ANALYTICS', 
    'ENABLE_USER_JOURNEY'
  ] as Array<keyof typeof FEATURE_FLAGS>
};

/**
 * Quick enable/disable entire feature groups
 */
export const enableFeatureGroup = (group: keyof typeof FEATURE_GROUPS): Partial<typeof FEATURE_FLAGS> => {
  const updates: Partial<typeof FEATURE_FLAGS> = {};
  FEATURE_GROUPS[group].forEach(feature => {
    // @ts-ignore - Dynamic property access
    updates[feature] = true;
  });
  return updates;
};

/**
 * Development helpers - uncomment for testing
 */
// export const DEV_ENABLE_ALL = false; // Set to true to enable all features for development
// export const DEV_DISABLE_ALL = false; // Set to true to test with everything disabled