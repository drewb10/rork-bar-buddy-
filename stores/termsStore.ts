import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TermsAcceptance {
  version: string;
  timestamp: string;
  userAgent: string;
  accepted: boolean;
}

interface TermsState {
  hasAcceptedTerms: boolean;
  termsAcceptance: TermsAcceptance | null;
  acceptTerms: (version?: string) => void;
  checkTermsStatus: () => boolean;
  getAcceptanceRecord: () => TermsAcceptance | null;
}

export const useTermsStore = create<TermsState>()(
  persist(
    (set, get) => ({
      hasAcceptedTerms: false,
      termsAcceptance: null,
      
      acceptTerms: (version = '1.0') => {
        const acceptanceRecord: TermsAcceptance = {
          version,
          timestamp: new Date().toISOString(),
          userAgent: 'BarBuddy Mobile App',
          accepted: true,
        };
        
        set({
          hasAcceptedTerms: true,
          termsAcceptance: acceptanceRecord,
        });
        
        console.log('Terms of Service Accepted:', acceptanceRecord);
      },
      
      checkTermsStatus: () => {
        return get().hasAcceptedTerms;
      },
      
      getAcceptanceRecord: () => {
        return get().termsAcceptance;
      },
    }),
    {
      name: 'terms-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);