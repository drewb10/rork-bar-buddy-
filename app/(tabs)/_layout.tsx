import React from "react";
import { Tabs } from "expo-router";
import { Home, MapPin } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useThemeStore } from "@/stores/themeStore";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function TabLayout() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.subtext,
        tabBarStyle: {
          backgroundColor: themeColors.card,
          borderTopColor: themeColors.border,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false, // This completely removes all headers from tabs
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', '#000']}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabContainer : null}>
              <Home size={22} color={color} />
              {focused && <LinearGradient
                colors={['transparent', themeColors.primary + '40']}
                style={styles.activeTabGlow}
              />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabContainer : null}>
              <MapPin size={22} color={color} />
              {focused && <LinearGradient
                colors={['transparent', themeColors.primary + '40']}
                style={styles.activeTabGlow}
              />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeTabContainer: {
    position: 'relative',
  },
  activeTabGlow: {
    position: 'absolute',
    width: 40,
    height: 20,
    borderRadius: 20,
    top: -10,
    left: -9,
    opacity: 0.6,
  },
});