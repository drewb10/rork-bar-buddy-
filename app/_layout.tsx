import { Stack } from "expo-router";
import { View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { useThemeStore } from "@/stores/themeStore";
import { colors } from "@/constants/colors";

const queryClient = new QueryClient();

export default function RootLayout() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <View style={{ flex: 1, backgroundColor: '#121212' }}>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#121212',
              },
              headerTintColor: '#FFFFFF',
              headerShadowVisible: false,
              contentStyle: {
                backgroundColor: '#121212',
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
                headerStyle: {
                  backgroundColor: '#121212',
                },
                headerTintColor: '#FFFFFF',
              }}
            />
          </Stack>
        </View>
      </QueryClientProvider>
    </trpc.Provider>
  );
}