import { useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';

export function useFrameworkReady() {
  const chatStore = useChatStore();

  useEffect(() => {
    try {
      // Initialize chat system when app opens
      if (chatStore?.resetChatOnAppReopen && typeof chatStore.resetChatOnAppReopen === 'function') {
        chatStore.resetChatOnAppReopen();
      }
      
      // Check for daily reset
      if (chatStore?.checkAndResetDaily && typeof chatStore.checkAndResetDaily === 'function') {
        chatStore.checkAndResetDaily();
      }
    } catch (error) {
      console.warn('Error in useFrameworkReady:', error);
    }
  }, [chatStore]);
}