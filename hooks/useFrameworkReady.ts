import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export function useFrameworkReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simplified framework ready check with timeout
    const initFramework = async () => {
      try {
        // Set a timeout to prevent hanging
        const timeout = setTimeout(() => {
          console.warn('Framework ready timeout, continuing anyway');
          setIsReady(true);
        }, 5000); // 5 second timeout

        // Simple ready check
        if (Platform.OS === 'web') {
          // For web, just wait a tick
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          // For native, wait a bit longer
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        clearTimeout(timeout);
        setIsReady(true);
      } catch (error) {
        console.warn('Framework ready error:', error);
        setIsReady(true); // Continue anyway
      }
    };

    initFramework();
  }, []);

  return isReady;
}