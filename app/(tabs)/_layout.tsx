import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Home, Award, Camera, Trophy, User } from 'lucide-react-native';
import { getThemeColors, spacing, borderRadius, shadows } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

export default function TabLayout() {
  const { theme } = useThemeStore();
  const themeColors = getThemeColors(theme);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.subtext,
        tabBarStyle: {
          backgroundColor: themeColors.card,
          borderTopColor: themeColors.border,
          borderTopWidth: 1,
          paddingTop: spacing.sm,
          paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
          paddingHorizontal: spacing.md,
          height: Platform.OS === 'ios' ? 88 : 72,
          ...shadows.lg,
          borderTopLeftRadius: borderRadius.xl,
          borderTopRightRadius: borderRadius.xl,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? spacing.xs : spacing.sm,
          letterSpacing: 0.1,
        },
        tabBarIconStyle: {
          marginTop: spacing.xs,
        },
        headerShown: false,
        tabBarItemStyle: {
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.md,
          marginHorizontal: spacing.xs,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <Award size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color, size }) => <Camera size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trophies"
        options={{
          title: 'Trophies',
          tabBarIcon: ({ color, size }) => <Trophy size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}