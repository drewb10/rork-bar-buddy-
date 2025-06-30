import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Home, Award, Camera, Trophy, User } from 'lucide-react-native';
import { getThemeColors } from '@/constants/colors';
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
          backgroundColor: '#000000',
          borderTopColor: themeColors.glass?.border || 'rgba(255, 255, 255, 0.1)',
          paddingTop: Platform.OS === 'ios' ? 8 : 4,
          height: Platform.OS === 'ios' ? 88 : 64,
          // Enhanced shadow system for premium depth
          shadowColor: themeColors.shadow?.heavy || '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 20,
          // Subtle border for definition
          borderTopWidth: 0.5,
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