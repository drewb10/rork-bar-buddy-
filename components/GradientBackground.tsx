import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'glass';
}

export default function GradientBackground({ children, variant = 'default' }: GradientBackgroundProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const getGradientColors = () => {
    switch (variant) {
      case 'subtle':
        return [
          themeColors.background,
          themeColors.background + 'F0',
          themeColors.background + 'E0'
        ];
      case 'glass':
        return [
          themeColors.glass.background,
          themeColors.glass.background + 'CC',
          themeColors.glass.background + 'AA'
        ];
      default:
        return [themeColors.gradient[0], themeColors.gradient[1]];
    }
  };

  if (variant === 'glass') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={getGradientColors() as [string, string, ...string[]]}
          style={styles.container}
        >
          <View style={[styles.glassOverlay, { borderColor: themeColors.glass.border }]}>
            {children}
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={getGradientColors() as [string, string, ...string[]]}
      style={styles.container}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glassOverlay: {
    flex: 1,
    borderWidth: 0.5,
    borderRadius: 0,
    // Subtle backdrop blur effect simulation
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
});