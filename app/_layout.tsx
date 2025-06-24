import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useAgeVerificationStore } from "@/stores/ageVerificationStore";
import { useUserProfileStore } from "@/stores/userProfileStore";
import { useVenueInteractionStore } from "@/stores/venueInteractionStore";
import { useAchievementStore } from "@/stores/achievementStore";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import OnboardingModal from "@/components/OnboardingModal";
import AchievementPopup from "@/components/AchievementPopup";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { supabase } from "@/lib/supabase";

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

  const { isVerified, setVerified } = useAgeVerificationStore();
  const { profile, completeOnboarding, loadFromSupabase } = useUserProfileStore();
  const { loadPopularTimesFromSupabase } = useVenueInteractionStore();
  const { shouldShow3AMPopup, mark3AMPopupShown } = useAchievementStore();
  const { resetChatOnAppReopen } = useChatStore();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [show3AMPopup, setShow3AMPopup] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check for existing Supabase session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get user profile from database
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('username, first_name, last_name, email')
            .eq('user_id', session.user.id)
            .single();
          
          if (profileData) {
            setUser({
              id: session.user.id,
              email: profileData.email || session.user.email || '',
              username: profileData.username,
              firstName: profileData.first_name,
              lastName: profileData.last_name,
            });
          }
        }
      } catch (error) {
        console.warn('Session check error:', error);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  useEffect(() => {
    // Reset chat messages on app start to ensure anonymous behavior
    resetChatOnAppReopen();
    
    // Simplified initialization with better error handling
    const initializeApp = async () => {
      try {
        // Prevent multiple initializations
        if (isInitialized) return;
        
        // Set timeout for initialization to prevent hanging
        const initTimeout = setTimeout(() => {
          console.warn('App initialization timeout, continuing anyway');
          setIsInitialized(true);
        }, 5000);

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
        setIsInitialized(true);
      }
    };

    // Show modals based on state
    if (!isAuthenticated) {
      // User needs to sign in/up - redirect to auth
      return;
    } else if (!isVerified) {
      setShowAgeVerification(true);
    } else if (!profile?.hasCompletedOnboarding) {
      setShowOnboarding(true);
    } else {
      // Only initialize if not already done
      if (!isInitialized) {
        setTimeout(() => {
          initializeApp();
        }, 100);
      }
    }
  }, [isAuthenticated, isVerified, profile?.hasCompletedOnboarding, profile?.userId, isInitialized, resetChatOnAppReopen]);

  // Simplified 3 AM popup check
  useEffect(() => {
    if (!isAuthenticated || !isVerified || !profile?.hasCompletedOnboarding) return;

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
  }, [shouldShow3AMPopup, isAuthenticated, isVerified, profile?.hasCompletedOnboarding]);

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
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
              <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
            </>
          ) : (
            <>
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
            </>
          )}
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