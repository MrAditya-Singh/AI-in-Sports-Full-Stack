/**
 * ATHLETIX — useAuth Hook
 * hooks/useAuth.ts
 *
 * Provides auth state (user, role, loading) to any screen.
 * Listens to Supabase onAuthStateChange so UI reacts to login/logout.
 *
 * Phase 1 will wire this into the navigation guard system.
 */

import { useEffect, useState } from 'react';
import { supabase, UserRole } from '../services/authService';

export interface AuthState {
  userId:   string | null;
  email:    string | null;
  role:     UserRole | null;
  isLoading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    userId:    null,
    email:     null,
    role:      null,
    isLoading: true,
  });

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      setState({
        userId:    user?.id ?? null,
        email:     user?.email ?? null,
        role:      (user?.user_metadata?.role as UserRole) ?? null,
        isLoading: false,
      });
    });

    // Subscribe to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setState({
        userId:    user?.id ?? null,
        email:     user?.email ?? null,
        role:      (user?.user_metadata?.role as UserRole) ?? null,
        isLoading: false,
      });
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}
