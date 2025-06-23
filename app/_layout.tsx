import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAgeVerificationStore } from '@/stores/ageVerificationStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import AgeVerificationModal from '@/components/AgeVerificationModal';
import OnboardingModal from '@/components/OnboardingModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  useFrameworkReady();
  
  const { isVerified, setVerified } = useAgeVerificationStore();
  const { profile, completeOnboarding, loadFromSupabase } = useUserProfileStore();
  const { loadPopularTimesFromSupabase } = useVenueInteractionStore();
  const [showAgeVerification, setShowAgeVerification] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

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
        <Stack.Screen name="+not-found" />
      </Stack>

      <AgeVerificationModal
        visible={showAgeVerification}
        onVerify={handleAgeVerification}
      />

      <OnboardingModal
        visible={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </QueryClientProvider>
  );
}