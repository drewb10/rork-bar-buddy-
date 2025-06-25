import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useAgeVerificationStore } from "@/stores/ageVerificationStore";
import { useAuthStore } from "@/stores/authStore";
import { useVenueInteractionStore } from "@/stores/venueInteractionStore";
import { useAchievementStore } from "@/stores/achievementStore";
import { useChatStore } from "@/stores/chatStore";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import AchievementPopup from "@/components/AchievementPopup";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { isSupabaseConfigured } from "@/lib/supabase";

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
  // CRITICAL: This hook must be called first and never removed
  useFrameworkReady();

  const [isInitialized, setIsInitialized] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [show3AMPopup, setShow3AMPopup] = useState(false);

  // Safe store access with error handling
  const ageVerificationStore = useAgeVerificationStore();
  const isVerified = ageVerificationStore?.isVerified || false;
  const setVerified = ageVerificationStore?.setVerified || (() => {});

  const authStore = useAuthStore();
  const isAuthenticated = authStore?.isAuthenticated || false;
  const isConfigured = authStore?.isConfigured || false;
  const initializeAuth = authStore?.initialize || (async () => {});
  const checkConfiguration = authStore?.checkConfiguration || (() => {});

  const venueStore = useVenueInteractionStore();
  const loadPopularTimesFromSupabase = venueStore?.loadPopularTimesFromSupabase || (async () => {});

  const achievementStore = useAchievementStore();
  const shouldShow3AMPopup = achievementStore?.shouldShow3AMPopup || (() => false);
  const mark3AMPopupShown = achievementStore?.mark3AMPopupShown || (() => {});

  const chatStore = useChatStore();
  const resetChatOnAppReopen = chatStore?.resetChatOnAppReopen || (() => {});

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Prevent multiple initializations
        if (isInitialized) return;

        console.log('🚀 Starting app initialization...');

        // Reset chat messages on app start to ensure anonymous behavior
        try {
          if (resetChatOnAppReopen && typeof resetChatOnAppReopen === 'function') {
            resetChatOnAppReopen();
          }
        } catch (error) {
          console.warn('Error resetting chat:', error);
        }
        
        // Check Supabase configuration
        try {
          if (checkConfiguration && typeof checkConfiguration === 'function') {
            checkConfiguration();
          }
        } catch (error) {
          console.warn('Error checking configuration:', error);
        }

        // Show age verification if not verified
        if (!isVerified) {
          console.log('🔞 Age not verified, showing verification modal');
          setShowAgeVerification(true);
          setIsInitialized(true);
          return;
        }

        console.log('✅ Age verified, continuing initialization...');

        // Initialize authentication with timeout
        const initTimeout = setTimeout(() => {
          console.warn('⚠️ Auth initialization timeout, continuing anyway');
          setIsInitialized(true);
        }, 10000); // 10 second timeout

        try {
          if (initializeAuth && typeof initializeAuth === 'function') {
            await initializeAuth();
          }
        } catch (error) {
          console.warn('Error initializing auth:', error);
        }

        clearTimeout(initTimeout);
        
        // Load venue data if authenticated and configured
        if (isAuthenticated && isSupabaseConfigured()) {
          try {
            if (loadPopularTimesFromSupabase && typeof loadPopularTimesFromSupabase === 'function') {
              await loadPopularTimesFromSupabase();
            }
          } catch (error) {
            console.warn('Failed to load venue data:', error);
          }
        }
        
        console.log('🎉 App initialization complete');
        setIsInitialized(true);
      } catch (error) {
        console.error('💥 Error during app initialization:', error);
        setIsInitialized(true); // Continue anyway
      }
    };

    // Small delay to ensure stores are ready
    const timer = setTimeout(() => {
      initializeApp();
    }, 100);

    return () => clearTimeout(timer);
  }, [isVerified, isAuthenticated, isInitialized]);

  // 3 AM popup check
  useEffect(() => {
    if (!isVerified || !isInitialized) return;

    const checkFor3AMPopup = () => {
      try {
        if (shouldShow3AMPopup && typeof shouldShow3AMPopup === 'function' && shouldShow3AMPopup()) {
          setShow3AMPopup(true);
        }
      } catch (error) {
        console.warn('Error checking 3AM popup:', error);
      }
    };

    // Check immediately
    setTimeout(() => {
      checkFor3AMPopup();
    }, 1000);

    // Check every minute
    const interval = setInterval(() => {
      try {
        checkFor3AMPopup();
      } catch (error) {
        console.warn('Error in 3AM popup interval:', error);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [shouldShow3AMPopup, isVerified, isInitialized]);

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

  const handle3AMPopupClose = () => {
    try {
      if (mark3AMPopupShown && typeof mark3AMPopupShown === 'function') {
        mark3AMPopupShown();
      }
      setShow3AMPopup(false);
    } catch (error) {
      console.warn('Error closing 3AM popup:', error);
      setShow3AMPopup(false);
    }
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

        <AchievementPopup
          visible={show3AMPopup}
          onClose={handle3AMPopupClose}
          is3AMPopup={true}
        />
      </QueryClientProvider>
    </trpc.Provider>
  );
}