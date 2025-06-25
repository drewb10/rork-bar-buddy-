import { useEffect } from 'react';

export function useFrameworkReady() {
  useEffect(() => {
    // Simple initialization without complex store access
    const timer = setTimeout(() => {
      try {
        console.log('🚀 Framework ready');
      } catch (error) {
        console.warn('Error in framework ready:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);
}