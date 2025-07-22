import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useAgeVerificationStore } from "@/stores/ageVerificationStore";
import { useAuthStore } from "@/stores/authStore";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FEATURE_FLAGS } from "@/constants/featureFlags";

// FEATURE: COMPLETION_POPUPS - Conditional import based on feature flags
let CompletionPopup: React.ComponentType<any> | null = null;

if (FEATURE_FLAGS.ENABLE_COMPLETION_POPUPS) {
  try {
    CompletionPopup = require('@/components/CompletionPopup').default;
  } catch (error) {
    console.warn('CompletionPopup component not found');
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      networkMode: 'offlineFirst',
    },
  },
});

// FEATURE: COMPLETION_POPUPS - Simplified for MVP (disabled)
function useCompletionPopups() {
  const [currentPopup, setCurrentPopup] = useState<{
    title: string;
    xpReward: number;
    type: 'task' | 'trophy';
  } | null>(null);
  const [isReady, setIsReady] = useState(true); // Always ready in MVP

  // MVP: No completion popups, feature disabled
  if (!FEATURE_FLAGS.ENABLE_COMPLETION_POPUPS) {
    return {
      currentPopup: null,
      closePopup: () => {},
      isReady: true
    };
  }

  /* FEATURE: COMPLETION_POPUPS - Full popup logic preserved but disabled
  useEffect(() => {
    // Complex popup checking logic would be here
    // When ENABLE_COMPLETION_POPUPS is true, restore from backup file
  }, [isReady]);
  */

  return {
    currentPopup,
    closePopup: () => setCurrentPopup(null),
    isReady
  };
}

export default function RootLayout() {
  const { isVerified, checkAgeVerification } = useAgeVerificationStore();
  const { initializeAuth } = useAuthStore();
  const { currentPopup, closePopup, isReady } = useCompletionPopups();
  const [isFrameworkReady, setIsFrameworkReady] = useState(false);

  // Initialize app - simplified for MVP
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Always initialize age verification (required for bars)
        await checkAgeVerification();
        
        // Always initialize authentication
        await initializeAuth();
        
        // Framework is ready
        setIsFrameworkReady(true);
        
        console.log('🎉 BarBuddy MVP initialized successfully');
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsFrameworkReady(true); // Still continue even with errors
      }
    };

    initializeApp();
  }, [checkAgeVerification, initializeAuth]);

  // Show loading state while framework initializes
  if (!isFrameworkReady || !isReady) {
    return (
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          {/* Simple loading screen for MVP */}
        </QueryClientProvider>
      </trpc.Provider>
    );
  }

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#000000' },
              animation: 'slide_from_right',
            }}
          >
            {/* Main app screens */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            
            {/* Auth screens */}
            <Stack.Screen name="auth/sign-in" options={{ 
              headerShown: true,
              headerTitle: 'Sign In',
              headerStyle: { backgroundColor: '#000000' },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: { fontWeight: 'bold' },
            }} />
            <Stack.Screen name="auth/sign-up" options={{ 
              headerShown: true,
              headerTitle: 'Sign Up',
              headerStyle: { backgroundColor: '#000000' },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: { fontWeight: 'bold' },
            }} />
            
            {/* Modal screens */}
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>

          {/* Age Verification Modal - ALWAYS ENABLED (required for bars) */}
          {!isVerified && (
            <AgeVerificationModal visible={!isVerified} />
          )}

          {/* FEATURE: COMPLETION_POPUPS - Conditional completion popup (disabled in MVP) */}
          {CompletionPopup && FEATURE_FLAGS.ENABLE_COMPLETION_POPUPS && currentPopup && (
            <CompletionPopup
              visible={!!currentPopup}
              title={currentPopup.title}
              xpReward={currentPopup.xpReward}
              type={currentPopup.type}
              onClose={closePopup}
            />
          )}
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

/* 
FEATURE: COMPLEX_APP_INITIALIZATION - PRESERVED CODE

The full complex app initialization with achievement stores, daily tracker integration,
onboarding checks, and completion popup system is preserved in the backup file: _layout.tsx.backup

To restore complex app initialization:
1. Set feature flags to true in constants/featureFlags.ts:
   - ENABLE_ACHIEVEMENTS: true (for achievement store initialization)
   - ENABLE_DAILY_TRACKER: true (for daily tracker integration) 
   - ENABLE_ONBOARDING: true (for onboarding checks)
   - ENABLE_COMPLETION_POPUPS: true (for completion notifications)

2. Copy complex initialization logic from backup file
3. Test all complex functionality
4. Verify all stores initialize correctly

Preserved functionality:
- Achievement store initialization and state management
- Daily tracker integration and popup triggers
- Complex onboarding flow and user journey
- Completion popup system for achievements and trophies
- Advanced error handling and recovery
- Performance optimization for complex features

All preserved in the backup file: _layout.tsx.backup
*/