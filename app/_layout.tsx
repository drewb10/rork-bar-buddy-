import { Stack } from "expo-router";
import { View, ImageBackground } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
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
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    // Load background image from Supabase
    const loadBackground = () => {
      try {
        console.log('Loading background image from Supabase...');
        
        const { data } = supabase
          .storage
          .from('background-barbuddy')
          .getPublicUrl('barbuddy-bg.png');

        console.log('BG URL:', data.publicUrl);
        
        if (data.publicUrl) {
          setBackgroundUrl(data.publicUrl);
          setImageLoadError(false);
        } else {
          console.warn('Background URL is empty or invalid');
          setImageLoadError(true);
        }
      } catch (error) {
        console.error('Error loading background image:', error);
        setImageLoadError(true);
        setBackgroundUrl(null);
      }
    };

    loadBackground();
  }, []);

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

  const handleImageError = () => {
    console.warn('Background image failed to load, using fallback');
    setImageLoadError(true);
  };

  const renderBackground = () => {
    if (backgroundUrl && !imageLoadError) {
      return (
        <ImageBackground
          source={{ uri: backgroundUrl }}
          style={{ flex: 1 }}
          resizeMode="cover"
          onError={handleImageError}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
            {renderContent()}
          </View>
        </ImageBackground>
      );
    }

    return (
      <LinearGradient
        colors={['#FF6B35', '#F7931E', '#FFD23F']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
          {renderContent()}
        </View>
      </LinearGradient>
    );
  };

  const renderContent = () => (
    <>
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
    </>
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        {renderBackground()}
      </QueryClientProvider>
    </trpc.Provider>
  );
}