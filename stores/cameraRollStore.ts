import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CameraPhoto {
  id: string;
  uri: string;
  timestamp: string;
  filename: string;
}

interface CameraRollState {
  photos: CameraPhoto[];
  addPhoto: (uri: string) => void;
  removePhoto: (id: string) => void;
  clearAllPhotos: () => void;
  getPhotoCount: () => number;
}

export const useCameraRollStore = create<CameraRollState>()(
  persist(
    (set, get) => ({
      photos: [],
      
      addPhoto: (uri: string) => {
        const photo: CameraPhoto = {
          id: Math.random().toString(36).substr(2, 9),
          uri,
          timestamp: new Date().toISOString(),
          filename: `barbuddy_${Date.now()}.jpg`,
        };
        
        set((state) => ({
          photos: [photo, ...state.photos] // Add new photos to the beginning
        }));
      },
      
      removePhoto: (id: string) => {
        set((state) => ({
          photos: state.photos.filter(photo => photo.id !== id)
        }));
      },
      
      clearAllPhotos: () => {
        set({ photos: [] });
      },
      
      getPhotoCount: () => {
        return get().photos.length;
      },
    }),
    {
      name: 'camera-roll-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);