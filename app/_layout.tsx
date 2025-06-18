import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar, View } from "react-native";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";
import { colors } from "@/constants/colors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded && !authLoading) {
      // Hide splash screen once everything is ready
      SplashScreen.hideAsync();
    }
  }, [loaded, authLoading]);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  if (!loaded || authLoading) {
    return null; // Return null instead of SplashScreen component
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function RootLayoutNav() {
  const { theme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const themeColors = colors[theme];

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: themeColors.background,
          },
          headerTintColor: themeColors.text,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: themeColors.background,
          },
          headerShown: false, // This ensures no headers show by default
        }}
      >
        {!isAuthenticated ? (
          // Auth screens
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        ) : (
          // App screens
          <>
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
          </>
        )}
      </Stack>
    </View>
  );
}