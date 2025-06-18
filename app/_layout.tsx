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
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}