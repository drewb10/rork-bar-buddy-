import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useAgeVerificationStore } from "@/stores/ageVerificationStore";
import { useUserProfileStore } from "@/stores/userProfileStore";
import { useVenueInteractionStore } from "@/stores/venueInteractionStore";
import { useAchievementStore } from "@/stores/achievementStore";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import OnboardingModal from "@/components/OnboardingModal";
import AchievementPopup from "@/components/AchievementPopup";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Reduced retries to prevent hanging
      staleTime: 1000 * 60 * 5, // 5 minutes
      networkMode: 'offlineFirst', // Prevent network hangs
    },
  },
});

export default function RootLayout() {
  // CRITICAL: This hook must be called first and never removed
  useFrameworkReady();

  const { isVerified, setVerified } = useAgeVerificationStore();
  const { profile, completeOnboarding, loadFromSupabase } = useUserProfileStore();
  const { loadPopularTimesFromSupabase } = useVenueInteractionStore();
  const { shouldShow3AMPopup, mark3AMPopupShown } = useAchievementStore();
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [show3AMPopup, setShow3AMPopup] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Simplified initialization with better error handling
    const initializeApp = async () => {
      try {
        // Prevent multiple initializations
        if (isInitialized) return;
        
        // Set timeout for initialization to prevent hanging
        const initTimeout = setTimeout(() => {
          console.warn('App initialization timeout, continuing anyway');
          setIsInitialized(true);
        }, 5000); // Reduced to 5 second timeout

        // Only load data if user has completed onboarding
        if (profile?.hasCompletedOnboarding && profile?.userId !== 'default') {
          // Use Promise.allSettled to prevent one failure from blocking others
          const results = await Promise.allSettled([
            loadFromSupabase(),
            loadPopularTimesFromSupabase()
          ]);
          
          // Log any failures but don't block initialization
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              const operation = index === 0 ? 'loadFromSupabase' : 'loadPopularTimesFromSupabase';
              console.warn(`${operation} failed:`, result.reason);
            }
          });
        }
        
        clearTimeout(initTimeout);
        setIsInitialized(true);
      } catch (error) {
        console.warn('Error initializing app:', error);
        setIsInitialized(true); // Still mark as initialized to prevent loops
      }
    };

    // Show modals based on state
    if (!isVerified) {
      setShowAgeVerification(true);
    } else if (!profile?.hasCompletedOnboarding) {
      setShowOnboarding(true);
    } else {
      // Only initialize if not already done
      if (!isInitialized) {
        // Use setTimeout to prevent blocking render
        setTimeout(() => {
          initializeApp();
        }, 100);
      }
    }
  }, [isVerified, profile?.hasCompletedOnboarding, profile?.userId, isInitialized]);

  // Simplified 3 AM popup check
  useEffect(() => {
    if (!isVerified || !profile?.hasCompletedOnboarding) return;

    const checkFor3AMPopup = () => {
      try {
        if (shouldShow3AMPopup()) {
          setShow3AMPopup(true);
        }
      } catch (error) {
        console.warn('Error checking 3AM popup:', error);
      }
    };

    // Check immediately with delay
    setTimeout(() => {
      checkFor3AMPopup();
    }, 1000);

    // Set up interval with error handling
    const interval = setInterval(() => {
      try {
        checkFor3AMPopup();
      } catch (error) {
        console.warn('Error in 3AM popup interval:', error);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [shouldShow3AMPopup, isVerified, profile?.hasCompletedOnboarding]);

  const handleAgeVerification = (verified: boolean) => {
    try {
      setVerified(verified);
      setShowAgeVerification(false);
      
      if (verified && !profile?.hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.warn('Error handling age verification:', error);
      setShowAgeVerification(false);
    }
  };

  const handleOnboardingComplete = async (firstName: string, lastName: string) => {
    try {
      await completeOnboarding(firstName, lastName);
      setShowOnboarding(false);
    } catch (error) {
      console.warn('Error completing onboarding:', error);
      setShowOnboarding(false);
    }
  };

  const handle3AMPopupClose = () => {
    try {
      mark3AMPopupShown();
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

        <OnboardingModal
          visible={showOnboarding}
          onComplete={handleOnboardingComplete}
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