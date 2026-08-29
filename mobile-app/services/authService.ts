/**
 * ATHLETIX — Authentication Service
 * services/authService.ts
 */

import AsyncStorage from
  '@react-native-async-storage/async-storage';

import api from './api';
import { supabase } from './supabase';
export { supabase };

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
  const cleanEmail = payload.email.trim().toLowerCase();

  // Hardcoded Admin Credential Check
  if (cleanEmail === 'hitsemotional@gmail.com' && payload.password === '!@#AJHG!QZ0qae6(Wui)') {
    const adminUser: AuthUser = {
      userId: 'admin-hitsemotional-id-001',
      email: 'hitsemotional@gmail.com',
      name: 'HitsEmotional Admin',
      role: 'admin',
      accessToken: 'admin-hardcoded-session-token-hitsemotional-001',
    };
    await persistSession(adminUser);
    return adminUser;
  }

  const response = await api.post(
    '/auth/login',
    payload
  );

  const { data } = response.data;

  const authUser: AuthUser = {
    userId: data.user_id,
    email: data.email,
    name: data.name,
    role: data.role === 'admin' || cleanEmail === 'hitsemotional@gmail.com' ? 'admin' : data.role,
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
    let currentToken: string | null = null;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      currentToken = sessionData?.session?.access_token ?? null;

      if (!currentToken) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        currentToken = refreshData?.session?.access_token ?? null;
      }
    } catch {
      // Supabase session refresh fallback
    }

    const rawUser = await AsyncStorage.getItem(
      USER_KEY
    );

    const token = await AsyncStorage.getItem(
      TOKEN_KEY
    );

    const activeToken = currentToken || token;

    if (!rawUser || !activeToken) {
      return null;
    }

    if (currentToken && currentToken !== token) {
      await AsyncStorage.setItem(TOKEN_KEY, currentToken);
    }

    const storedUser =
      JSON.parse(rawUser) as AuthUser;

    return {
      ...storedUser,
      accessToken: activeToken,
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
  const cleanEmail = email.trim().toLowerCase();

  // 1. Primary: Direct Supabase Auth email dispatch
  try {
    const redirectUrl =
      typeof window !== 'undefined' && window.location?.origin
        ? `${window.location.origin}/(auth)/login`
        : 'https://mobile-app-theta-gules.vercel.app/(auth)/login';

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    });

    if (!error) {
      return 'Password reset link has been dispatched to your email address.';
    }
  } catch {
    // Continue to API fallback
  }

  // 2. Secondary: Backend API fallback
  try {
    const response = await api.post('/auth/forgot-password', { email: cleanEmail });
    return (
      response.data?.data?.message ??
      'If an account with this email exists, a reset link has been sent.'
    );
  } catch (err: any) {
    const msg = err?.response?.data?.detail?.error?.message || err?.userMessage || err?.message;
    throw new Error(msg || 'Could not send password reset email. Please try again.');
  }
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