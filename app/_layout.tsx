import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useRef } from "react";
import { useAgeVerificationStore } from "@/stores/ageVerificationStore";
import { useAuthStore } from "@/stores/authStore";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { isSupabaseConfigured } from "@/lib/supabase";
import AgeVerificationModal from "@/components/AgeVerificationModal";

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
  const isFrameworkReady = useFrameworkReady();

  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef(false);

  // Safe store access with fallbacks
  const ageVerificationStore = useAgeVerificationStore();
  const authStore = useAuthStore();

  const isVerified = ageVerificationStore?.isVerified || false;
  const setVerified = ageVerificationStore?.setVerified || (() => {});
  const isAuthenticated = authStore?.isAuthenticated || false;
  const isConfigured = authStore?.isConfigured || false;
  const initializeAuth = authStore?.initialize || (() => Promise.resolve());
  const checkConfiguration = authStore?.checkConfiguration || (() => {});

  useEffect(() => {
    if (!isFrameworkReady || initializationRef.current) return;
    
    try {
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
          }, 10000);

          // Initialize auth (will handle unconfigured state gracefully)
          if (initializeAuth && typeof initializeAuth === 'function') {
            await initializeAuth();
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
        setIsInitialized(true); // Don't wait for auth if not age verified
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
  }, [isFrameworkReady, isVerified]);

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

  // Don't render anything until framework is ready
  if (!isFrameworkReady) {
    return null;
  }

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
      </QueryClientProvider>
    </trpc.Provider>
  );
}