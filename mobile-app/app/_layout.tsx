/**
 * ATHLETIX — Root Layout (Expo Router)
 * app/_layout.tsx
 *
 * The single top-level layout that wraps the entire app.
 * Handles:
 *  - Auth state listening (via useAuth)
 *  - Role-based navigation guard (Phase 1 will make this strict)
 *  - Global loading splash while auth state resolves
 */

import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  const { userId, role, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // ── Navigation guard ───────────────────────────────────────────────────────
  // Phase 1: redirect to login if unauthenticated; route to correct dashboard
  // based on role if authenticated.
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!userId && !inAuthGroup) {
      // Not logged in — redirect to login
      router.replace('/(auth)/login');
    } else if (userId && inAuthGroup) {
      // Logged in but still on auth screen — route to role dashboard
      if (role === 'athlete')  router.replace('/(athlete)/dashboard');
      if (role === 'official') router.replace('/(official)/dashboard');
      if (role === 'admin')    router.replace('/(admin)/dashboard');
    }
  }, [userId, role, isLoading, segments]);

  // ── Auth loading splash ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <Slot />
    </SafeAreaProvider>
  );
}
