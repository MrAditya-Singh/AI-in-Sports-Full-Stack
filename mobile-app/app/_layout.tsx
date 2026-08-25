/**
 * ATHLETIX — Root Layout (Phase 1: Navigation Guard LIVE)
 * app/_layout.tsx
 *
 * Handles:
 *  - Session restoration on app start (AsyncStorage)
 *  - Role-based navigation guard: unauthenticated → login; authenticated → dashboard
 *  - Animated splash screen while auth state resolves
 */

import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  const { userId, role, isLoading } = useAuth();
  const router   = useRouter();
  const segments = useSegments();

  // Animated fade-in for the loading splash
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Navigation guard ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!userId && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (userId && inAuthGroup) {
      switch (role) {
        case 'athlete':  router.replace('/(athlete)/dashboard');  break;
        case 'official': router.replace('/(official)/dashboard'); break;
        case 'admin':    router.replace('/(admin)/dashboard');    break;
        default:         router.replace('/(auth)/login');
      }
    }
  }, [userId, role, isLoading, segments]);

  // ── Animated splash ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.splash}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <Animated.View style={[styles.logoWrap, { opacity: fadeAnim }]}>
          <Animated.Text style={[styles.logoText, { transform: [{ scale: pulseAnim }] }]}>
            ATHLETIX
          </Animated.Text>
          <Text style={styles.tagline}>AI-Powered Sports Assessment</Text>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={{ marginTop: 40 }}
          />
        </Animated.View>
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

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrap: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 6,
    color: Colors.primary,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginTop: 8,
    textTransform: 'uppercase',
  },
});
