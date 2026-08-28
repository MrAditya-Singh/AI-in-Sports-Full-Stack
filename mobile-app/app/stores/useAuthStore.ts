/**
 * ATHLETIX — Global Authentication Store
 * stores/useAuthStore.ts
 *
 * ✅ NEW FILE:
 * Application ke sabhi screens ke liye single shared auth state.
 */

import { create } from 'zustand';

import {
  restoreSession,
  logout as logoutService,
  type AuthUser,
} from '../../services/authService';


interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;

  /**
   * App start par stored session ko ek baar restore karta hai.
   */
  initialize: () => Promise<void>;

  /**
   * Successful login/signup ke baad stored user dobara load karta hai.
   */
  refresh: () => Promise<void>;

  /**
   * Backend logout call, local storage clear aur global user reset karta hai.
   */
  logout: () => Promise<void>;
}

// ✅ NEW:
// Multiple components ek saath initialize call karein,
// tab bhi session restoration sirf ek baar execute hogi.
let initializationPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  isInitialized: false,

  initialize: async (): Promise<void> => {
    // ✅ NEW: Already initialized ho to dobara storage read nahi karna.
    if (get().isInitialized) {
      return;
    }

    // ✅ NEW: Existing initialization ko reuse karo.
    if (initializationPromise) {
      return initializationPromise;
    }

    initializationPromise = (async () => {
      set({ isLoading: true });

      try {
        const session = await restoreSession();

        set({
          user: session,
          isInitialized: true,
        });
      } catch {
        set({
          user: null,
          isInitialized: true,
        });
      } finally {
        set({ isLoading: false });
        initializationPromise = null;
      }
    })();

    return initializationPromise;
  },

  refresh: async (): Promise<void> => {
    set({ isLoading: true });

    try {
      const session = await restoreSession();

      set({
        user: session,
        isInitialized: true,
      });
    } catch {
      set({
        user: null,
        isInitialized: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async (): Promise<void> => {
    set({ isLoading: true });

    try {
      await logoutService();
    } finally {
      /**
       * ✅ IMPORTANT:
       * Backend logout fail ho tab bhi frontend user state clear hogi.
       */
      set({
        user: null,
        isLoading: false,
        isInitialized: true,
      });
    }
  },
}));