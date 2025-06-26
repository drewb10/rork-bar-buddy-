export const colors = {
  light: {
    text: '#000000',
    subtext: '#666666',
    background: '#FFFFFF',
    card: '#F8F9FA',
    border: '#E1E5E9',
    primary: '#FF6A00',
    secondary: '#007AFF',
    accent: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    success: '#34C759',
    glass: {
      border: 'rgba(0, 0, 0, 0.1)',
      background: 'rgba(255, 255, 255, 0.8)',
    },
    shadow: {
      light: '#000000',
      heavy: '#000000',
    },
  },
  dark: {
    text: '#FFFFFF',
    subtext: '#A0A0A0',
    background: '#1C1C1E',
    card: '#2C2C2E',
    border: '#3A3A3C',
    primary: '#FF6A00',
    secondary: '#007AFF',
    accent: '#34C759',
    warning: '#FF9500',
    error: '#FF453A',
    success: '#32D74B',
    glass: {
      border: 'rgba(255, 255, 255, 0.1)',
      background: 'rgba(0, 0, 0, 0.8)',
    },
    shadow: {
      light: '#000000',
      heavy: '#000000',
    },
  },
};

export type Theme = 'light' | 'dark';

export function getThemeColorsSafe(theme: Theme) {
  try {
    return colors[theme] || colors.dark;
  } catch (error) {
    console.warn('Error getting theme colors:', error);
    return colors.dark;
  }
}