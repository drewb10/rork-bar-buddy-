import { useEffect } from 'react';

export function useFrameworkReady() {
  useEffect(() => {
    try {
      // Wait for stores to be hydrated before calling methods
      const timer = setTimeout(() => {
        try {
          // Safely access chat store
          if (typeof window !== 'undefined' && (window as any).__chatStore) {
            const chatStore = (window as any).__chatStore;
            if (chatStore?.getState) {
              const { resetChatOnAppReopen, checkAndResetDaily } = chatStore.getState();
              
              // Initialize chat system when app opens
              if (resetChatOnAppReopen && typeof resetChatOnAppReopen === 'function') {
                resetChatOnAppReopen();
              }
              
              // Check for daily reset
              if (checkAndResetDaily && typeof checkAndResetDaily === 'function') {
                checkAndResetDaily();
              }
            }
          }
        } catch (error) {
          console.warn('Error initializing chat store:', error);
        }
      }, 100);

      return () => clearTimeout(timer);
    } catch (error) {
      console.warn('Error in useFrameworkReady:', error);
    }
  }, []);
}