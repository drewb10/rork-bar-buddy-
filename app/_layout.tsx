import { Stack } from "expo-router";
import { View, ImageBackground } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useAgeVerificationStore } from "@/stores/ageVerificationStore";
import { useUserProfileStore } from "@/stores/userProfileStore";
import { useVenueInteractionStore } from "@/stores/venueInteractionStore";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import OnboardingModal from "@/components/OnboardingModal";

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
        // Load data if user has completed onboarding
        if (profile.hasCompletedOnboarding && profile.userId !== 'default') {
          await loadFromSupabase();
          await loadPopularTimesFromSupabase();
        }
      } catch (error) {
        console.warn('Error initializing app:', error);
      }
    };

    // Show age verification modal if not verified
    if (!isVerified) {
      setShowAgeVerification(true);
    } else if (!profile.hasCompletedOnboarding) {
      // Show onboarding after age verification
      setShowOnboarding(true);
    } else {
      // Initialize app if user is verified and onboarded
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
        {/* 
          TO USE YOUR CUSTOM BACKGROUND:
          1. Download your image
          2. Save it to assets/images/background.png (or .jpg)
          3. Uncomment the line below and comment out the current ImageBackground
        */}
        {/* <ImageBackground source={require('@/assets/images/background.png')} style={{ flex: 1 }} resizeMode="cover"> */}
        
        {/* Current fallback background - replace with your local asset */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&h=1920&q=80' }}
          style={{ flex: 1 }}
          resizeMode="cover"
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
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
        </ImageBackground>
      </QueryClientProvider>
    </trpc.Provider>
  );
}