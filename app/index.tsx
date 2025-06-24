import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useAgeVerificationStore } from '@/stores/ageVerificationStore';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  const { isVerified } = useAgeVerificationStore();

  // Redirect based on authentication and age verification status
  if (!isVerified) {
    return <Redirect href="/(tabs)" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/sign-in" />;
  }

  return <Redirect href="/(tabs)" />;
}