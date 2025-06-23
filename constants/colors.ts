// Color palette for the app
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
    // Enhanced depth colors for premium feel
    cardElevated: '#1A1A1A', // Slightly lighter for elevated cards
    overlay: 'rgba(0, 0, 0, 0.85)', // For glassmorphism overlays
    shadowPrimary: 'rgba(255, 106, 0, 0.3)', // Primary color shadow
    shadowSecondary: 'rgba(0, 0, 0, 0.8)', // Deep shadow
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
    // Enhanced depth colors for premium feel
    cardElevated: '#FFFFFF', // Pure white for elevated cards
    overlay: 'rgba(255, 255, 255, 0.95)', // For glassmorphism overlays
    shadowPrimary: 'rgba(255, 106, 0, 0.2)', // Primary color shadow
    shadowSecondary: 'rgba(0, 0, 0, 0.15)', // Subtle shadow
  }
};

export default colors;