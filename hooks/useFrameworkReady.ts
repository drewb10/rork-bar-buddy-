import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export function useFrameworkReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simple ready check - just ensure we're mounted
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return isReady;
}