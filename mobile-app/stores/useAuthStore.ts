/**
 * ATHLETIX — Auth Zustand Store
 * stores/useAuthStore.ts
 */

import { create } from 'zustand';
import {
  type AuthUser,
  restoreSession,
  logout as authLogout,
} from '../services/authService';

export interface AuthStoreState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: AuthUser | null) => void;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  user: null,
  isLoading: true,
  isInitialized: false,

  setUser: (user: AuthUser | null) => {
    set({ user });
  },

  initialize: async () => {
    if (get().isInitialized) {
      return;
    }
    try {
      set({ isLoading: true });
      const user = await restoreSession();
      set({ user, isLoading: false, isInitialized: true });
    } catch {
      set({ user: null, isLoading: false, isInitialized: true });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authLogout();
    } finally {
      set({ user: null, isLoading: false });
    }
  },

  refresh: async () => {
    try {
      set({ isLoading: true });
      const user = await restoreSession();
      set({ user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
