import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

export default function AuthLayout() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: themeColors.background,
        },
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}