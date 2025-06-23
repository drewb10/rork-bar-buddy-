import { Stack } from "expo-router";
import { View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useAgeVerificationStore } from "@/stores/ageVerificationStore";
import { useUserProfileStore } from "@/stores/userProfileStore";
import { useVenueInteractionStore } from "@/stores/venueInteractionStore";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import OnboardingModal from "@/components/OnboardingModal";
import { LinearGradient } from "expo-linear-gradient";

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
  const { profile, completeOnboarding, loadFromSupabase } = useUserProfileStore();
  const { loadPopularTimesFromSupabase } = useVenueInteractionStore();
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Initialize stores and load data
    const initializeApp = async () => {
      try {
        if (profile.hasCompletedOnboarding && profile.userId !== 'default') {
          await loadFromSupabase();
          await loadPopularTimesFromSupabase();
        }
      } catch (error) {
        console.warn('Error initializing app:', error);
      }
    };

    if (!isVerified) {
      setShowAgeVerification(true);
    } else if (!profile.hasCompletedOnboarding) {
      setShowOnboarding(true);
    } else {
      initializeApp();
    }
  }, [isVerified, profile.hasCompletedOnboarding]);

  const handleAgeVerification = (verified: boolean) => {
    setVerified(verified);
    setShowAgeVerification(false);

    if (verified && !profile.hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = async (firstName: string, lastName: string) => {
    await completeOnboarding(firstName, lastName);
    setShowOnboarding(false);
  };

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        
        <LinearGradient
          colors={[
            '#1a0000', // Deep dark red/black at top
            '#2d0a00', // Dark brown-red
            '#4a1500', // Darker orange-red
            '#ff4500', // Bright orange-red center
            '#ff6b35', // Warm orange
            '#ff8c42', // Lighter orange
            '#2d0a00', // Back to dark
            '#1a0000', // Deep dark at bottom
          ]}
          locations={[0, 0.15, 0.3, 0.45, 0.55, 0.7, 0.85, 1]}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: 'transparent',
                },
                headerTintColor: '#FFFFFF',
                headerShadowVisible: false,
                contentStyle: {
                  backgroundColor: 'transparent',
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
                    backgroundColor: 'rgba(18, 18, 18, 0.9)',
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

            <OnboardingModal
              visible={showOnboarding}
              onComplete={handleOnboardingComplete}
            />
          </View>
        </LinearGradient>
      </QueryClientProvider>
    </trpc.Provider>
  );
}