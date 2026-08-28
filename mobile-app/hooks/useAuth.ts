/**
 * ATHLETIX — useAuth Hook
 * hooks/useAuth.ts
 *
 * ✅ CHANGED:
 * Local useState remove karke Zustand global auth store use kiya gaya hai.
 *
 * Ab logout/login/session change application ke sabhi screens me
 * immediately synchronize hoga.
 */

import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';

export interface AuthState {
  userId: string | null;
  name: string | null;
  email: string | null;
  role: 'athlete' | 'official' | 'admin' | null;
  isLoading: boolean;

  /**
   * Stored session aur global auth state clear karta hai.
   */
  logout: () => Promise<void>;

  /**
   * Successful signup/login ke baad global state refresh karta hai.
   */
  refresh: () => Promise<void>;
}

export function useAuth(): AuthState {
  // ✅ CHANGED: Shared Zustand state/actions
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initialize = useAuthStore((state) => state.initialize);
  const logout = useAuthStore((state) => state.logout);
  const refresh = useAuthStore((state) => state.refresh);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return {
    userId: user?.userId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    role: user?.role ?? null,
    isLoading,
    logout,
    refresh,
  };
}
