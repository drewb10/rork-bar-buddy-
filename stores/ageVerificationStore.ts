import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
      storage: createJSONStorage(() => localStorage),
    }
  )
);