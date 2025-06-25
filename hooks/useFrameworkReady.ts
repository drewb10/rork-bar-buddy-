import { useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';

export function useFrameworkReady() {
  const chatStore = useChatStore();

  useEffect(() => {
    try {
      // Wait for store to be hydrated before calling methods
      const timer = setTimeout(() => {
        // Initialize chat system when app opens
        if (chatStore?.resetChatOnAppReopen && typeof chatStore.resetChatOnAppReopen === 'function') {
          chatStore.resetChatOnAppReopen();
        }
        
        // Check for daily reset
        if (chatStore?.checkAndResetDaily && typeof chatStore.checkAndResetDaily === 'function') {
          chatStore.checkAndResetDaily();
        }
      }, 100);

      return () => clearTimeout(timer);
    } catch (error) {
      console.warn('Error in useFrameworkReady:', error);
    }
  }, [chatStore]);
}