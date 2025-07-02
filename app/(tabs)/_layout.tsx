import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, Text } from 'react-native';
import { Home, Award, Camera, Trophy, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

export default function TabLayout() {
  const { theme } = useThemeStore();
  const themeColors = getThemeColors(theme);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: 'rgba(0,0,0,0.95)',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          paddingTop: Platform.OS === 'ios' ? 8 : 4,
          height: Platform.OS === 'ios' ? 88 : 64,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 20,
          borderTopWidth: 1,
          backdropFilter: 'blur(20px)',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 4 : 8,
          letterSpacing: 0.2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerShown: false,
        tabBarBackground: () => (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
          }} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: focused ? 'rgba(255,107,53,0.15)' : 'transparent',
            }}>
              <Home 
                size={size} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: focused ? 'rgba(255,107,53,0.15)' : 'transparent',
            }}>
              <Award 
                size={size} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: focused ? 'rgba(255,107,53,0.15)' : 'transparent',
            }}>
              <Camera 
                size={size} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="trophies"
        options={{
          title: 'Trophies',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: focused ? 'rgba(255,107,53,0.15)' : 'transparent',
            }}>
              <Trophy 
                size={size} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: focused ? 'rgba(255,107,53,0.15)' : 'transparent',
            }}>
              <User 
                size={size} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}