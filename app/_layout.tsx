import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useAgeVerificationStore } from "@/stores/ageVerificationStore";
import { useAuthStore } from "@/stores/authStore";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import CompletionPopup from "@/components/CompletionPopup";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LoadingScreen from "@/components/LoadingScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      networkMode: 'offlineFirst',
    },
  },
});

function useCompletionPopups() {
  const [currentPopup, setCurrentPopup] = useState<{
    title: string;
    xpReward: number;
    type: 'task' | 'trophy';
  } | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait a bit before starting to check for popups to avoid timing issues
    const readyTimer = setTimeout(() => {
      setIsReady(true);
    }, 1000);

    return () => clearTimeout(readyTimer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const checkForPopups = () => {
      if (typeof window !== 'undefined') {
        if ((window as any).__showTrophyCompletionPopup) {
          const popup = (window as any).__showTrophyCompletionPopup;
          setCurrentPopup({
            title: popup.title,
            xpReward: popup.xpReward,
            type: 'trophy'
          });
          delete (window as any).__showTrophyCompletionPopup;
        }
        
        if ((window as any).__showTaskCompletionPopup) {
          const popup = (window as any).__showTaskCompletionPopup;
          setCurrentPopup({
            title: popup.title,
            xpReward: popup.xpReward,
            type: 'task'
          });
          delete (window as any).__showTaskCompletionPopup;
        }
      }
    };

    const interval = setInterval(checkForPopups, 500);
    return () => clearInterval(interval);
  }, [isReady]);

  const closeCurrentPopup = () => {
    setCurrentPopup(null);
  };

  return {
    currentPopup: isReady ? currentPopup : null,
    closeCurrentPopup
  };
}

export default function RootLayout() {
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { currentPopup, closeCurrentPopup } = useCompletionPopups();

  const ageVerificationStore = useAgeVerificationStore();
  const authStore = useAuthStore();

  const isVerified = ageVerificationStore?.isVerified || false;
  const setVerified = ageVerificationStore?.setVerified || (() => {});
  const initializeAuth = authStore?.initialize || (() => Promise.resolve());

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        
        // Initialize auth
        if (initializeAuth && typeof initializeAuth === 'function') {
          await initializeAuth();
        }
        
        // Show age verification if not verified
        if (!isVerified) {
          setShowAgeVerification(true);
        }
        
        setIsInitialized(true);
        console.log('✅ App initialization complete');
      } catch (error) {
        console.warn('⚠️ Error during initialization:', error);
        setIsInitialized(true);
        if (!isVerified) {
          setShowAgeVerification(true);
        }
      }
    };

    initializeApp();
  }, []);

  const handleAgeVerification = (verified: boolean) => {
    try {
      if (setVerified && typeof setVerified === 'function') {
        setVerified(verified);
      }
      setShowAgeVerification(false);
    } catch (error) {
      console.warn('Error handling age verification:', error);
      setShowAgeVerification(false);
    }
  };

  if (!isInitialized) {
    return (
      <ErrorBoundary>
        <LoadingScreen message="Starting BarBuddy..." />
      </ErrorBoundary>
    );
  }

  // Render the main app structure after initialization
  return (
    <ErrorBoundary>
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
          </Stack>

          <AgeVerificationModal
            visible={showAgeVerification}
            onVerify={handleAgeVerification}
          />

          {/* Render CompletionPopup only when ready and popup exists */}
          {currentPopup && (
            <CompletionPopup
              visible={!!currentPopup}
              title={currentPopup.title}
              xpReward={currentPopup.xpReward}
              type={currentPopup.type}
              onClose={closeCurrentPopup}
            />
          )}
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}