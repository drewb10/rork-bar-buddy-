export const colors = {
  light: {
    background: '#FFFFFF',
    card: '#F8F9FA',
    text: '#1A1A1A',
    subtext: '#6B7280',
    primary: '#FF6A00',
    secondary: '#4F46E5',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    accent: '#8B5CF6',
  },
  dark: {
    background: '#0A0A0A',
    card: '#1A1A1A',
    text: '#FFFFFF',
    subtext: '#9CA3AF',
    primary: '#FF6A00',
    secondary: '#6366F1',
    border: '#374151',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    accent: '#A855F7',
  },
};

export type Theme = 'light' | 'dark';
export type ThemeColors = typeof colors.light;

// Safe getter for theme colors
export const getThemeColorsSafe = (theme: Theme): ThemeColors => {
  try {
    return colors[theme] || colors.dark;
  } catch (error) {
    console.warn('Error getting theme colors:', error);
    return colors.dark;
  }
};