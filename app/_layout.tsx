import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useRef } from "react";
import { useAgeVerificationStore } from "@/stores/ageVerificationStore";
import { useAuthStore } from "@/stores/authStore";
import { useVenueInteractionStore } from "@/stores/venueInteractionStore";
import { useAchievementStoreSafe } from "@/stores/achievementStore";
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

  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [show3AMPopup, setShow3AMPopup] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef(false);

  // Safe store access with fallbacks
  const ageVerificationStore = useAgeVerificationStore();
  const authStore = useAuthStore();
  const venueInteractionStore = useVenueInteractionStore();
  const achievementStore = useAchievementStoreSafe();
  const chatStore = useChatStore();

  const isVerified = ageVerificationStore?.isVerified || false;
  const setVerified = ageVerificationStore?.setVerified || (() => {});
  const isAuthenticated = authStore?.isAuthenticated || false;
  const isConfigured = authStore?.isConfigured || false;
  const initializeAuth = authStore?.initialize || (() => Promise.resolve());
  const refreshSession = authStore?.refreshSession || (() => Promise.resolve());
  const checkConfiguration = authStore?.checkConfiguration || (() => {});
  const loadPopularTimesFromSupabase = venueInteractionStore?.loadPopularTimesFromSupabase || (() => Promise.resolve());
  const shouldShow3AMPopup = achievementStore?.shouldShow3AMPopup || (() => false);
  const mark3AMPopupShown = achievementStore?.mark3AMPopupShown || (() => {});
  const resetChatOnAppReopen = chatStore?.resetChatOnAppReopen || (() => {});

  useEffect(() => {
    if (initializationRef.current) return; // Prevent multiple initializations
    
    try {
      // Reset chat messages on app start to ensure anonymous behavior
      if (resetChatOnAppReopen && typeof resetChatOnAppReopen === 'function') {
        resetChatOnAppReopen();
      }
      
      // Check Supabase configuration
      if (checkConfiguration && typeof checkConfiguration === 'function') {
        checkConfiguration();
      }
      
      // Initialize authentication
      const initializeApp = async () => {
        try {
          if (initializationRef.current) return;
          initializationRef.current = true;
          
          const initTimeout = setTimeout(() => {
            console.warn('App initialization timeout, continuing anyway');
            setIsInitialized(true);
          }, 10000); // Increased timeout to 10 seconds

          // Initialize auth (will handle unconfigured state gracefully)
          if (initializeAuth && typeof initializeAuth === 'function') {
            await initializeAuth();
          }

          // Refresh session to ensure we have the latest auth state
          if (isConfigured && refreshSession && typeof refreshSession === 'function') {
            await refreshSession();
          }
          
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
          
          clearTimeout(initTimeout);
          setIsInitialized(true);
        } catch (error) {
          console.warn('Error initializing app:', error);
          setIsInitialized(true);
        }
      };

      // Show age verification if not verified
      if (!isVerified) {
        setShowAgeVerification(true);
      } else {
        // Initialize app if verified
        if (!isInitialized && !initializationRef.current) {
          setTimeout(() => {
            initializeApp();
          }, 100);
        }
      }
    } catch (error) {
      console.warn('Error in main useEffect:', error);
      setIsInitialized(true);
    }
  }, [isVerified]); // Only depend on isVerified

  // 3 AM popup check - separate effect to avoid loops
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

    const timeoutId = setTimeout(() => {
      checkFor3AMPopup();
    }, 1000);

    const interval = setInterval(() => {
      try {
        checkFor3AMPopup();
      } catch (error) {
        console.warn('Error in 3AM popup interval:', error);
      }
    }, 60000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
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