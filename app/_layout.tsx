import { Stack } from "expo-router";
import { View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useAgeVerificationStore } from "@/stores/ageVerificationStore";
import AgeVerificationModal from "@/components/AgeVerificationModal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const { isVerified, setVerified } = useAgeVerificationStore();
  const [showAgeVerification, setShowAgeVerification] = useState(false);

  useEffect(() => {
    // Show age verification modal if not verified
    if (!isVerified) {
      setShowAgeVerification(true);
    }
  }, [isVerified]);

  const handleAgeVerification = (verified: boolean) => {
    setVerified(verified);
    setShowAgeVerification(false);
    
    if (!verified) {
      // If user is under 18, you might want to close the app
      // For now, we'll just keep the modal closed but they can't use the app
    }
  };

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
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
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>

        <AgeVerificationModal
          visible={showAgeVerification}
          onVerify={handleAgeVerification}
        />
      </QueryClientProvider>
    </trpc.Provider>
  );
}