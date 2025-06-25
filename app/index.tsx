import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useAgeVerificationStore } from '@/stores/ageVerificationStore';

export default function Index() {
  const { isAuthenticated, isConfigured } = useAuthStore();
  const { isVerified } = useAgeVerificationStore();

  // If not age verified, go to tabs to show age verification modal
  if (!isVerified) {
    return <Redirect href="/(tabs)" />;
  }

  // If Supabase is not configured, go to tabs (app will work in demo mode)
  if (!isConfigured) {
    return <Redirect href="/(tabs)" />;
  }

  // If age verified but not authenticated, go to sign in
  if (!isAuthenticated) {
    return <Redirect href="/auth/sign-in" />;
  }

  // If both verified and authenticated, go to tabs
  return <Redirect href="/(tabs)" />;
}