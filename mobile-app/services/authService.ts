/**
 * ATHLETIX — Auth Service
 * services/authService.ts
 *
 * Wraps Supabase Auth for signup, login, logout, and token retrieval.
 * Phase 1 will fully implement these.
 *
 * Token storage: Supabase JS SDK handles token persistence internally
 * using AsyncStorage (React Native). Never manually store the JWT.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Supabase JS client — anon key only (safe for client; RLS enforces access)
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON);

export type UserRole = 'athlete' | 'official' | 'admin';

export interface SignupPayload {
  name:     string;
  email:    string;
  password: string;
  role:     UserRole;
}

export interface LoginPayload {
  email:    string;
  password: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1 TODOs — implement these against the FastAPI /auth endpoints
// ─────────────────────────────────────────────────────────────────────────────

export async function signup(payload: SignupPayload): Promise<void> {
  // TODO (Phase 1): POST /auth/signup via api.ts (which calls FastAPI → Supabase)
  throw new Error('signup — Phase 1 TODO');
}

export async function login(payload: LoginPayload): Promise<void> {
  // TODO (Phase 1): POST /auth/login, store returned JWT
  throw new Error('login — Phase 1 TODO');
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/** Returns the current session JWT, or null if not logged in. */
export async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Returns the current user's role from JWT metadata. */
export async function getCurrentRole(): Promise<UserRole | null> {
  const { data } = await supabase.auth.getUser();
  return (data.user?.user_metadata?.role as UserRole) ?? null;
}
