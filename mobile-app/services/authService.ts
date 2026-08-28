/**
 * ATHLETIX — Authentication Service
 * services/authService.ts
 */

import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js';

import AsyncStorage from
  '@react-native-async-storage/async-storage';

import api from './api';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!SUPABASE_URL) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL is missing. Check mobile-app/.env'
  );
}

if (!SUPABASE_ANON_KEY) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. Check mobile-app/.env'
  );
}

export const supabase: SupabaseClient =
  createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );

export type UserRole =
  | 'athlete'
  | 'official'
  | 'admin';

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  accessToken: string;
}

const TOKEN_KEY = 'athletix_access_token';
const USER_KEY = 'athletix_user';

// ─── Signup ───────────────────────────────────────────────────────────────────

export async function signup(
  payload: SignupPayload
): Promise<AuthUser> {
  const response = await api.post(
    '/auth/signup',
    payload
  );

  const { data } = response.data;

  const authUser: AuthUser = {
    userId: data.user_id,
    email: data.email,
    name: data.name,
    role: data.role,
    accessToken: data.access_token,
  };

  await persistSession(authUser);

  return authUser;
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(
  payload: LoginPayload
): Promise<AuthUser> {
  const response = await api.post(
    '/auth/login',
    payload
  );

  const { data } = response.data;

  const authUser: AuthUser = {
    userId: data.user_id,
    email: data.email,
    name: data.name,
    role: data.role,
    accessToken: data.access_token,
  };

  await persistSession(authUser);

  return authUser;
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Local logout must continue.
  }

  try {
    const { unregisterPushToken } = require('./notificationService');
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      await unregisterPushToken(token);
    }
  } catch {
    // Non-critical push token cleanup failure
  }

  await AsyncStorage.multiRemove([
    TOKEN_KEY,
    USER_KEY,
  ]);
}

// ─── Restore Session ──────────────────────────────────────────────────────────

export async function restoreSession():
  Promise<AuthUser | null> {
  try {
    const rawUser = await AsyncStorage.getItem(
      USER_KEY
    );

    const token = await AsyncStorage.getItem(
      TOKEN_KEY
    );

    if (!rawUser || !token) {
      return null;
    }

    const storedUser =
      JSON.parse(rawUser) as AuthUser;

    return {
      ...storedUser,
      accessToken: token,
    };
  } catch {
    await AsyncStorage.multiRemove([
      TOKEN_KEY,
      USER_KEY,
    ]);

    return null;
  }
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPassword(
  email: string
): Promise<string> {
  const response = await api.post(
    '/auth/forgot-password',
    { email }
  );

  return (
    response.data?.data?.message ??
    'If an account exists, a reset link has been sent.'
  );
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPassword(
  accessToken: string,
  newPassword: string
): Promise<string> {
  const response = await api.post(
    '/auth/reset-password',
    {
      access_token: accessToken,
      new_password: newPassword,
    }
  );

  return (
    response.data?.data?.message ??
    'Password updated successfully.'
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function getAuthToken():
  Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function persistSession(
  user: AuthUser
): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, user.accessToken],
    [USER_KEY, JSON.stringify(user)],
  ]);
}