import { Stack } from "expo-router";
import { View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { useThemeStore } from "@/stores/themeStore";
import { colors } from "@/constants/colors";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

export default function RootLayout() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simple initialization
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
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
              headerShown: false,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen 
              name="venue/[id]" 
              options={{
                headerShown: true,
                presentation: 'card',
                headerBackTitle: '',
                headerTitle: '',
              }}
            />
          </Stack>
        </View>
      </QueryClientProvider>
    </trpc.Provider>
  );
}