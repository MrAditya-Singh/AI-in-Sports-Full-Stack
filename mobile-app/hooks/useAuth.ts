/**
 * ATHLETIX — useAuth Hook (Phase 1: FULLY IMPLEMENTED)
 * hooks/useAuth.ts
 *
 * Global auth state. Uses AsyncStorage-backed session (no Supabase realtime needed).
 * Provides: userId, name, email, role, isLoading + actions (logout).
 */

import { useCallback, useEffect, useState } from 'react';
import { restoreSession, logout as _logout, AuthUser } from '../services/authService';

export interface AuthState {
  userId:    string | null;
  name:      string | null;
  email:     string | null;
  role:      'athlete' | 'official' | 'admin' | null;
  isLoading: boolean;
  /** Call this to log out and clear all stored session data. */
  logout:    () => Promise<void>;
  /** Call this after a successful signup/login to refresh state. */
  refresh:   () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const session = await restoreSession();
    setUser(session);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const logout = useCallback(async () => {
    await _logout();
    setUser(null);
  }, []);

  return {
    userId:    user?.userId  ?? null,
    name:      user?.name    ?? null,
    email:     user?.email   ?? null,
    role:      (user?.role   ?? null) as AuthState['role'],
    isLoading,
    logout,
    refresh: load,
  };
}
