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
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
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
    // Initialize stores and load data with error handling
    const initializeApp = async () => {
      try {
        // Prevent infinite loops by checking initialization state
        if (isInitialized) return;
        
        // Load data if user has completed onboarding
        if (profile?.hasCompletedOnboarding && profile?.userId !== 'default') {
          await Promise.all([
            loadFromSupabase().catch(err => console.warn('Failed to load from Supabase:', err)),
            loadPopularTimesFromSupabase().catch(err => console.warn('Failed to load popular times:', err))
          ]);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.warn('Error initializing app:', error);
        setIsInitialized(true); // Still mark as initialized to prevent loops
      }
    };

    // Show age verification modal if not verified
    if (!isVerified) {
      setShowAgeVerification(true);
    } else if (!profile?.hasCompletedOnboarding) {
      // Show onboarding after age verification
      setShowOnboarding(true);
    } else {
      // Initialize app if user is verified and onboarded
      initializeApp();
    }
  }, [isVerified, profile?.hasCompletedOnboarding, profile?.userId, isInitialized]);

  // Check for 3 AM popup every minute
  useEffect(() => {
    const checkFor3AMPopup = () => {
      if (shouldShow3AMPopup() && isVerified && profile?.hasCompletedOnboarding) {
        setShow3AMPopup(true);
      }
    };

    // Check immediately
    checkFor3AMPopup();

    // Set up interval to check every minute
    const interval = setInterval(checkFor3AMPopup, 60000);

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
    }
  };

  const handleOnboardingComplete = async (firstName: string, lastName: string) => {
    try {
      await completeOnboarding(firstName, lastName);
      setShowOnboarding(false);
    } catch (error) {
      console.warn('Error completing onboarding:', error);
      setShowOnboarding(false); // Still close modal to prevent hanging
    }
  };

  const handle3AMPopupClose = () => {
    setShow3AMPopup(false);
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