// Color palette for the app with enhanced shadows and glassmorphism
export const colors = {
  dark: {
    background: '#000000', // Pure black background
    gradient: ['#000000', '#000000'], // Pure black gradient
    card: '#111111', // Very dark gray for cards to maintain some contrast
    text: '#FFFFFF', // Pure white for better contrast
    subtext: '#B3B3B3', // Lighter gray for better visibility
    primary: '#FF6A00', // flame orange
    secondary: '#FF944D',
    accent: '#FF6A00',
    border: '#222222', // Darker border
    success: '#4CAF50',
    error: '#F44336',
    // Enhanced shadow system for depth
    shadow: {
      light: 'rgba(255, 255, 255, 0.05)',
      medium: 'rgba(0, 0, 0, 0.3)',
      heavy: 'rgba(0, 0, 0, 0.6)',
      colored: 'rgba(255, 106, 0, 0.2)',
    },
    // Glassmorphism colors
    glass: {
      background: 'rgba(17, 17, 17, 0.8)',
      border: 'rgba(255, 255, 255, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.4)',
    }
  },
  light: {
    background: '#F8F8F8',
    gradient: ['#F8F8F8', '#EEEEEE'],
    card: '#FFFFFF',
    text: '#121212',
    subtext: '#666666',
    primary: '#FF6A00', // flame orange
    secondary: '#FF944D',
    accent: '#FF6A00',
    border: '#EEEEEE',
    success: '#4CAF50',
    error: '#F44336',
    // Enhanced shadow system for depth
    shadow: {
      light: 'rgba(0, 0, 0, 0.05)',
      medium: 'rgba(0, 0, 0, 0.15)',
      heavy: 'rgba(0, 0, 0, 0.25)',
      colored: 'rgba(255, 106, 0, 0.15)',
    },
    // Glassmorphism colors
    glass: {
      background: 'rgba(255, 255, 255, 0.9)',
      border: 'rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.3)',
    }
  }
} as const;

export type Theme = 'dark' | 'light';
export type ThemeColors = typeof colors[Theme];

export default colors;