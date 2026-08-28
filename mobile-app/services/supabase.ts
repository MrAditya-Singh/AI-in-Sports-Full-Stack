/**
 * ATHLETIX — Shared Supabase Client
 * services/supabase.ts
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!SUPABASE_URL) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL is missing. Check mobile-app/.env');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. Check mobile-app/.env');
}

export const supabase: SupabaseClient = createClient(
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
