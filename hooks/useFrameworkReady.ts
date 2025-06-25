import { useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';

export function useFrameworkReady() {
  const { resetChatOnAppReopen, checkAndResetDaily } = useChatStore();

  useEffect(() => {
    // Initialize chat system when app opens
    if (resetChatOnAppReopen) {
      resetChatOnAppReopen();
    }
    
    // Check for daily reset
    if (checkAndResetDaily) {
      checkAndResetDaily();
    }
  }, [resetChatOnAppReopen, checkAndResetDaily]);
}