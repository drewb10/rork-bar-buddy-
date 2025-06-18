import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  
  // Redirect to the appropriate screen based on auth state
  return <Redirect href={isAuthenticated ? "/(tabs)" : "/auth/sign-in"} />;
}