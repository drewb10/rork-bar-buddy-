/**
 * MVP Configuration
 * 
 * This file controls which features are enabled in the MVP version of BarBuddy.
 * Set features to `true` to enable them, `false` to disable.
 * 
 * Disabled features are preserved in the codebase for future activation.
 */

export const MVP_CONFIG = {
  // Core MVP Features (Always enabled)
  ENABLE_HOME: true,
  ENABLE_PROFILE: true,
  ENABLE_VENUE_LIKES: true,
  ENABLE_CHAT: true,
  
  // Features disabled in MVP
  ENABLE_TASKS: false,
  ENABLE_TROPHIES: false,
  ENABLE_ACHIEVEMENTS: false,
  ENABLE_DAILY_TRACKER: false,
  ENABLE_STATS_TRACKING: false,
  ENABLE_XP_SYSTEM: false,
  
  // Future features (planned but not implemented)
  ENABLE_FRIENDS: false,
  ENABLE_LEADERBOARDS: false,
  ENABLE_NOTIFICATIONS: false,
} as const;

export type MVPFeature = keyof typeof MVP_CONFIG;

/**
 * Check if a feature is enabled in the current MVP configuration
 */
export function isFeatureEnabled(feature: MVPFeature): boolean {
  return MVP_CONFIG[feature];
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): MVPFeature[] {
  return Object.entries(MVP_CONFIG)
    .filter(([_, enabled]) => enabled)
    .map(([feature, _]) => feature as MVPFeature);
}

/**
 * Get all disabled features
 */
export function getDisabledFeatures(): MVPFeature[] {
  return Object.entries(MVP_CONFIG)
    .filter(([_, enabled]) => !enabled)
    .map(([feature, _]) => feature as MVPFeature);
}