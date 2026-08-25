/**
 * ATHLETIX — Auth Service (Phase 1: FULLY IMPLEMENTED)
 * services/authService.ts
 *
 * Architecture decision:
 *   We call FastAPI (not Supabase directly from the client) for signup/login.
 *   FastAPI handles the Supabase Auth call + public.users insert atomically.
 *   The returned JWT is then stored via the Supabase client's session management.
 *
 * For all subsequent API calls, the JWT is injected by the Axios interceptor in api.ts.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Supabase JS client — anon key only; AsyncStorage for session persistence
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage:          AsyncStorage,
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: false,
  },
});

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

export interface AuthUser {
  userId:       string;
  email:        string;
  name:         string;
  role:         UserRole;
  accessToken:  string;
}

// ─── Token storage key ────────────────────────────────────────────────────────
const TOKEN_KEY = 'athletix_access_token';
const USER_KEY  = 'athletix_user';

// ─────────────────────────────────────────────────────────────────────────────
// SIGNUP
// ─────────────────────────────────────────────────────────────────────────────
export async function signup(payload: SignupPayload): Promise<AuthUser> {
  const response = await api.post('/auth/signup', payload);
  const { data } = response.data;
  const authUser: AuthUser = {
    userId:      data.user_id,
    email:       data.email,
    name:        data.name,
    role:        data.role,
    accessToken: data.access_token,
  };
  await _persistSession(authUser);
  return authUser;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
export async function login(payload: LoginPayload): Promise<AuthUser> {
  const response = await api.post('/auth/login', payload);
  const { data } = response.data;
  const authUser: AuthUser = {
    userId:      data.user_id,
    email:       data.email,
    name:        data.name,
    role:        data.role,
    accessToken: data.access_token,
  };
  await _persistSession(authUser);
  return authUser;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Non-critical — still clear local session regardless
  }
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

// ─────────────────────────────────────────────────────────────────────────────
// RESTORE SESSION (called on app start)
// ─────────────────────────────────────────────────────────────────────────────
export async function restoreSession(): Promise<AuthUser | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function _persistSession(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, user.accessToken);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}
