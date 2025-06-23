// Color palette for the app - Updated to match the warm gradient background
export const colors = {
  dark: {
    background: '#1a0000', // Deep dark red/black to match gradient
    gradient: ['#1a0000', '#ff4500', '#1a0000'], // Matches the app background
    card: '#2d1a1a', // Warm dark card background
    text: '#FFFFFF', // Pure white for contrast
    subtext: '#E0B4B4', // Warm light gray with red tint
    primary: '#ff4500', // Bright orange-red from gradient
    secondary: '#ff6b35', // Warm orange
    accent: '#ff8c42', // Lighter orange accent
    border: '#4a2626', // Warm dark border
    success: '#4CAF50',
    error: '#FF6B6B', // Softer red error
  },
  light: {
    background: '#FFF8F5', // Warm white background
    gradient: ['#FFF8F5', '#FFE8D6'], // Warm light gradient
    card: '#FFFFFF',
    text: '#2d0a00', // Dark brown text
    subtext: '#8B4513', // Warm brown subtext
    primary: '#ff4500', // Bright orange-red
    secondary: '#ff6b35', // Warm orange
    accent: '#ff8c42', // Lighter orange accent
    border: '#FFE8D6', // Warm light border
    success: '#4CAF50',
    error: '#DC3545',
  }
};

export default colors;