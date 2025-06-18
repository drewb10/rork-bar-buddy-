import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesState {
  favoriteVenues: string[];
  favoriteSpecials: string[];
  addFavoriteVenue: (venueId: string) => void;
  removeFavoriteVenue: (venueId: string) => void;
  toggleFavoriteVenue: (venueId: string) => void;
  addFavoriteSpecial: (specialId: string) => void;
  removeFavoriteSpecial: (specialId: string) => void;
  toggleFavoriteSpecial: (specialId: string) => void;
  isFavoriteVenue: (venueId: string) => boolean;
  isFavoriteSpecial: (specialId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteVenues: [],
      favoriteSpecials: [],
      
      addFavoriteVenue: (venueId) => 
        set((state) => ({
          favoriteVenues: [...state.favoriteVenues, venueId]
        })),
      
      removeFavoriteVenue: (venueId) => 
        set((state) => ({
          favoriteVenues: state.favoriteVenues.filter(id => id !== venueId)
        })),
      
      toggleFavoriteVenue: (venueId) => {
        const isFavorite = get().isFavoriteVenue(venueId);
        if (isFavorite) {
          get().removeFavoriteVenue(venueId);
        } else {
          get().addFavoriteVenue(venueId);
        }
      },
      
      addFavoriteSpecial: (specialId) => 
        set((state) => ({
          favoriteSpecials: [...state.favoriteSpecials, specialId]
        })),
      
      removeFavoriteSpecial: (specialId) => 
        set((state) => ({
          favoriteSpecials: state.favoriteSpecials.filter(id => id !== specialId)
        })),
      
      toggleFavoriteSpecial: (specialId) => {
        const isFavorite = get().isFavoriteSpecial(specialId);
        if (isFavorite) {
          get().removeFavoriteSpecial(specialId);
        } else {
          get().addFavoriteSpecial(specialId);
        }
      },
      
      isFavoriteVenue: (venueId) => 
        get().favoriteVenues.includes(venueId),
      
      isFavoriteSpecial: (specialId) => 
        get().favoriteSpecials.includes(specialId),
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);