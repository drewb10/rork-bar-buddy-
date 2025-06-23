import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAgeVerificationStore } from '@/stores/ageVerificationStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import AgeVerificationModal from '@/components/AgeVerificationModal';
import OnboardingModal from '@/components/OnboardingModal';

export default function RootLayout() {
  useFrameworkReady();
  
  const { isVerified, setVerified } = useAgeVerificationStore();
  const { profile, completeOnboarding } = useUserProfileStore();
  const [showAgeVerification, setShowAgeVerification] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  useEffect(() => {
    // Show age verification modal if not verified
    if (!isVerified) {
      setShowAgeVerification(true);
    } else if (!profile.hasCompletedOnboarding) {
      // Show onboarding after age verification
      setShowOnboarding(true);
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
    <>
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
    </>
  );
}