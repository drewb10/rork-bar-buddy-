import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

interface GradientBackgroundProps {
  children: React.ReactNode;
}

export default function GradientBackground({ children }: GradientBackgroundProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  return (
    <LinearGradient
      colors={[themeColors.gradient[0], themeColors.gradient[1]] as const}
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
});