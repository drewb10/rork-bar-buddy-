import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Home, Award, Trophy, User, MessageCircle } from 'lucide-react-native';
import { FEATURE_FLAGS } from '@/constants/featureFlags';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B35', // Orange highlight for active tabs
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
      }}
    >
      {/* Home Tab - ALWAYS ENABLED (MVP Core) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Home 
              size={size} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      {/* Chat Tab - ALWAYS ENABLED (MVP Core) */}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size, focused }) => (
            <MessageCircle 
              size={size} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      
      {/* Tasks Tab - FEATURE: Achievements (Hidden in MVP) */}
      {FEATURE_FLAGS.ENABLE_ACHIEVEMENTS && (
        <Tabs.Screen
          name="achievements"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ color, size, focused }) => (
              <Award 
                size={size} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />
      )}
      
      {/* Trophies Tab - FEATURE: Trophies (Hidden in MVP) */}
      {FEATURE_FLAGS.ENABLE_TROPHIES && (
        <Tabs.Screen
          name="trophies"
          options={{
            title: 'Trophies',
            tabBarIcon: ({ color, size, focused }) => (
              <Trophy 
                size={size} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />
      )}
      
      {/* Profile Tab - ALWAYS ENABLED (MVP Core) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <User 
              size={size} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      

    </Tabs>
  );
}