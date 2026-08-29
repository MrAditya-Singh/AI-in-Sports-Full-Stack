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
  const redirectUrl = 'https://mobile-app-theta-gules.vercel.app/reset-password';

  // 1. Primary: Direct Supabase Auth reset dispatch
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    });
    if (!error) {
      return 'Password reset link has been dispatched to your email address.';
    }
  } catch {
    // Suppress and fallback
  }

  // 2. Secondary: Backend API dispatch fallback
  try {
    await api.post('/auth/forgot-password', { email: cleanEmail });
  } catch {
    // Suppress API errors to protect privacy and maintain smooth UX
  }

  return 'Password reset link has been dispatched to your email address.';
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

// ─── Direct Reset Password ───────────────────────────────────────────────────

export async function directResetPassword(
  email: string,
  newPassword: string
): Promise<string> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Primary: Try direct Supabase Auth user password update
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      return 'Password updated successfully in database! You can now log in.';
    }
  } catch {
    // Continue
  }

  // 2. Admin API direct update
  try {
    const response = await api.post('/auth/direct-reset-password', {
      email: cleanEmail,
      new_password: newPassword,
    });

    return (
      response.data?.data?.message ??
      'Password updated successfully in database! You can now log in.'
    );
  } catch (err: any) {
    const msg = err?.response?.data?.detail?.error?.message || err?.userMessage || err?.message;
    throw new Error(msg || 'Failed to update password. Please check your email address.');
  }
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