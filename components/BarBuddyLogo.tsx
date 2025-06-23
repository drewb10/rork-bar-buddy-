import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

interface BarBuddyLogoProps {
  size?: 'small' | 'medium' | 'large';
}

export default function BarBuddyLogo({ size = 'medium' }: BarBuddyLogoProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const dimensions = {
    small: {
      fontSize: 24,
      padding: 12,
    },
    medium: {
      fontSize: 32,
      padding: 16,
    },
    large: {
      fontSize: 48,
      padding: 24,
    },
  };

  const d = dimensions[size];

  return (
    <View style={[styles.container, { padding: d.padding }]}>
      <Text style={[styles.logo, { fontSize: d.fontSize, color: themeColors.primary }]}>
        🍻 Bar Buddy
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontWeight: '700',
    textAlign: 'center',
  },
});