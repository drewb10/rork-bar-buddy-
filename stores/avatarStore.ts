import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Avatar {
  skinTone: string;
  hairType: string;
  hairColor: string;
  lastUpdated?: string;
}

interface AvatarState {
  avatar: Avatar;
  setSkinTone: (color: string) => void;
  setHairType: (type: string) => void;
  setHairColor: (color: string) => void;
  saveAvatar: () => void;
  resetAvatar: () => void;
}

const defaultAvatar: Avatar = {
  skinTone: '#FFE0BD', // Default light skin tone
  hairType: 'short', // Default short hair
  hairColor: '#000000', // Default black hair
};

export const useAvatarStore = create<AvatarState>()(
  persist(
    (set) => ({
      avatar: defaultAvatar,
      
      setSkinTone: (color: string) => {
        set((state) => ({
          avatar: {
            ...state.avatar,
            skinTone: color,
          }
        }));
      },
      
      setHairType: (type: string) => {
        set((state) => ({
          avatar: {
            ...state.avatar,
            hairType: type,
          }
        }));
      },
      
      setHairColor: (color: string) => {
        set((state) => ({
          avatar: {
            ...state.avatar,
            hairColor: color,
          }
        }));
      },
      
      saveAvatar: () => {
        set((state) => ({
          avatar: {
            ...state.avatar,
            lastUpdated: new Date().toISOString(),
          }
        }));
      },
      
      resetAvatar: () => {
        set({ avatar: defaultAvatar });
      },
    }),
    {
      name: 'avatar-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);