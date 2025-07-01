export const colors = {
  light: {
    text: '#000000',
    subtext: '#6B7280',
    background: '#F9FAFB',
    card: '#FFFFFF',
    border: '#E5E7EB',
    primary: '#FF6A00',
    secondary: '#007AFF',
    accent: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    success: '#34C759',
    glass: {
      border: 'rgba(0, 0, 0, 0.08)',
      background: 'rgba(255, 255, 255, 0.95)',
    },
    shadow: {
      light: '#000000',
      heavy: '#000000',
    },
  },
  dark: {
    text: '#FFFFFF',
    subtext: '#9CA3AF',
    background: '#000000',
    card: '#111827',
    border: '#374151',
    primary: '#FF6A00',
    secondary: '#007AFF',
    accent: '#34C759',
    warning: '#FF9500',
    error: '#FF453A',
    success: '#32D74B',
    glass: {
      border: 'rgba(255, 255, 255, 0.08)',
      background: 'rgba(17, 24, 39, 0.95)',
    },
    shadow: {
      light: '#000000',
      heavy: '#000000',
    },
  },
};

export type Theme = 'light' | 'dark';

export function getThemeColors(theme: Theme) {
  return colors[theme] || colors.dark;
}

export function getThemeColorsSafe(theme: Theme) {
  try {
    return colors[theme] || colors.dark;
  } catch (error) {
    console.warn('Error getting theme colors:', error);
    return colors.dark;
  }
}

// Modern spacing system
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Modern typography scale
export const typography = {
  heading1: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  captionMedium: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  small: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  smallMedium: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.2,
  },
};

// Modern border radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Modern shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
};