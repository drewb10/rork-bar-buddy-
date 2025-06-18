import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<boolean>;
  signOut: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false, // Set this to false by default
  isLoading: false,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      const mockUser: User = {
        id: '1',
        email,
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date().toISOString()
      };
      
      set({ 
        user: mockUser, 
        isAuthenticated: true, 
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      set({ isLoading: false });
      return false;
    }
  },

  signUp: async (email: string, password: string, firstName: string, lastName: string) => {
    set({ isLoading: true });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful signup
      const newUser: User = {
        id: Date.now().toString(),
        email,
        firstName,
        lastName,
        createdAt: new Date().toISOString()
      };
      
      set({ 
        user: newUser, 
        isAuthenticated: true, 
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      set({ isLoading: false });
      return false;
    }
  },

  signOut: () => {
    set({ 
      user: null, 
      isAuthenticated: false, 
      isLoading: false 
    });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  }
}));