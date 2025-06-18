import { Stack } from "expo-router";
import { View } from "react-native";
import { useThemeStore } from "@/stores/themeStore";
import { colors } from "@/constants/colors";

export default function RootLayout() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: themeColors.background,
          },
          headerTintColor: themeColors.text,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: themeColors.background,
          },
          // Hide header for tab screens
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Show header for venue screens with custom styling */}
        <Stack.Screen 
          name="venue/[id]" 
          options={{
            headerShown: true,
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </View>
  );
}