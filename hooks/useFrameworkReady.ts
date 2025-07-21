import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors if splash screen is already hidden
});

export function useFrameworkReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        console.log('🔄 Framework preparing...');
        
        // Simple delay to ensure React Native is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Mark as ready
        setIsReady(true);
        console.log('✅ Framework ready');
        
        // Hide splash screen
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn('⚠️ Framework preparation error:', error);
        // Still mark as ready to prevent app from being stuck
        setIsReady(true);
        
        // Try to hide splash screen anyway
        try {
          await SplashScreen.hideAsync();
        } catch (splashError) {
          console.warn('⚠️ Could not hide splash screen:', splashError);
        }
      }
    };

    prepareApp();
  }, []);

  return isReady;
}