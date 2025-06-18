import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Stack } from "expo-router";
import { View } from "react-native";
import { useThemeStore } from "@/stores/themeStore";
import { colors } from "@/constants/colors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";

const queryClient = new QueryClient();

export default function RootLayout() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

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
                title: "",
                headerTransparent: true,
                headerShown: true,
              }} 
            />
            <Stack.Screen 
              name="all-venues" 
              options={{ 
                title: "All Venues",
                headerShown: true,
              }} 
            />
            <Stack.Screen 
              name="all-specials" 
              options={{ 
                title: "All Specials",
                headerShown: true,
              }} 
            />
          </Stack>
        </View>
      </QueryClientProvider>
    </trpc.Provider>
  );
}