import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Home, Award, Camera, Trophy, User } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

export default function TabLayout() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.subtext,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: 'transparent',
          paddingTop: Platform.OS === 'ios' ? 8 : 4,
          height: Platform.OS === 'ios' ? 88 : 64,
          // Enhanced shadow system for premium depth
          shadowColor: themeColors.shadow.heavy,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 20,
          // Subtle border for definition
          borderTopWidth: 0.5,
          borderTopColor: themeColors.glass.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600', // Slightly bolder for better readability
          marginBottom: Platform.OS === 'ios' ? 4 : 8,
          letterSpacing: 0.3, // Subtle letter spacing for premium feel
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        headerShown: false,
        // Smooth animation for tab transitions
        animation: 'shift',
        animationDuration: 200,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <Award size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color, size }) => <Camera size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trophies"
        options={{
          title: 'Trophies',
          tabBarIcon: ({ color, size }) => <Trophy size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}