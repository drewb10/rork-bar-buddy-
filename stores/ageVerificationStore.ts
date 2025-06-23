import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AgeVerificationState {
  isVerified: boolean;
  verificationDate: string | null;
  setVerified: (verified: boolean) => void;
}

export const useAgeVerificationStore = create<AgeVerificationState>()(
  persist(
    (set) => ({
      isVerified: false,
      verificationDate: null,
      
      setVerified: (verified: boolean) => {
        set({
          isVerified: verified,
          verificationDate: verified ? new Date().toISOString() : null,
        });
      },
    }),
    {
      name: 'age-verification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Ensure verification status persists across all sessions
      partialize: (state) => ({
        isVerified: state.isVerified,
        verificationDate: state.verificationDate,
      }),
    }
  )
);