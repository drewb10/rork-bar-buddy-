import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useAgeVerificationStore } from "@/stores/ageVerificationStore";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import AchievementPopup from "@/components/AchievementPopup";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      networkMode: 'offlineFirst',
    },
  },
});

export default function RootLayout() {
  useFrameworkReady();

  const [isInitialized, setIsInitialized] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);

  const ageVerificationStore = useAgeVerificationStore();
  const isVerified = ageVerificationStore?.isVerified || false;
  const setVerified = ageVerificationStore?.setVerified || (() => {});

  const authStore = useAuthStore();
  const isAuthenticated = authStore?.isAuthenticated || false;
  const initializeAuth = authStore?.initialize || (async () => {});

  const chatStore = useChatStore();
  const resetChatOnAppReopen = chatStore?.resetChatOnAppReopen || (() => {});

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (isInitialized) return;

        console.log('🚀 Starting app initialization...');

        // Reset chat messages on app start
        if (resetChatOnAppReopen) {
          resetChatOnAppReopen();
        }
        
        // Show age verification if not verified
        if (!isVerified) {
          console.log('🔞 Age not verified, showing verification modal');
          setShowAgeVerification(true);
          setIsInitialized(true);
          return;
        }

        console.log('✅ Age verified, continuing initialization...');

        // Initialize authentication
        if (initializeAuth) {
          await initializeAuth();
        }
        
        console.log('🎉 App initialization complete');
        setIsInitialized(true);
      } catch (error) {
        console.error('💥 Error during app initialization:', error);
        setIsInitialized(true); // Continue anyway
      }
    };

    const timer = setTimeout(() => {
      initializeApp();
    }, 100);

    return () => clearTimeout(timer);
  }, [isVerified, isAuthenticated, isInitialized]);

  const handleAgeVerification = (verified: boolean) => {
    if (setVerified) {
      setVerified(verified);
    }
    setShowAgeVerification(false);
  };

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#000000',
            },
            headerTintColor: '#FFFFFF',
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: '#000000',
            },
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen 
            name="venue/[id]" 
            options={{
              headerShown: true,
              presentation: 'card',
              headerBackTitle: 'Home',
              headerTitle: '',
              headerStyle: {
                backgroundColor: '#000000',
              },
              headerTintColor: '#FFFFFF',
            }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="camera-roll" options={{ 
            headerShown: true,
            presentation: 'card',
            headerBackTitle: 'Camera',
            headerTitle: 'Camera Roll',
            headerStyle: {
              backgroundColor: '#000000',
            },
            headerTintColor: '#FFFFFF',
          }} />
        </Stack>

        <AgeVerificationModal
          visible={showAgeVerification}
          onVerify={handleAgeVerification}
        />
      </QueryClientProvider>
    </trpc.Provider>
  );
}