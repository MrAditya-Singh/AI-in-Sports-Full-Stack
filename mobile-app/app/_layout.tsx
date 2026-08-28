/**
 * ATHLETIX — Root Layout (Phase 1: Navigation Guard LIVE)
 * app/_layout.tsx
 *
 * Handles:
 *  - Session restoration on app start (AsyncStorage)
 *  - Role-based navigation guard: unauthenticated → login; authenticated → dashboard
 *  - Dynamic theme state and adaptive StatusBar
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
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useTheme } from '../hooks/useTheme';

export default function RootLayout() {
  const { userId, role, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const router   = useRouter();
  const segments = useSegments();

  // Initialize push notifications when user is logged in.
  usePushNotifications();

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
  }, [fadeAnim, pulseAnim]);

  // ── Navigation guard ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup     = segments[0] === '(auth)';
    const inAdminGroup    = segments[0] === '(admin)';
    const inOfficialGroup = segments[0] === '(official)';
    const inAthleteGroup  = segments[0] === '(athlete)';

    const redirectToHome = () => {
      switch (role) {
        case 'athlete':  router.replace('/(athlete)/dashboard');  break;
        case 'official': router.replace('/(official)/dashboard'); break;
        case 'admin':    router.replace('/(admin)/dashboard');    break;
        default:         router.replace('/(auth)/login');
      }
    };

    if (!userId && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (userId) {
      if (inAuthGroup) {
        redirectToHome();
      } else if (inAdminGroup && role !== 'admin') {
        redirectToHome();
      } else if (inOfficialGroup && role !== 'official') {
        redirectToHome();
      } else if (inAthleteGroup && role !== 'athlete') {
        redirectToHome();
      }
    }
  }, [userId, role, isLoading, segments, router]);

  // ── Animated splash ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <Animated.View style={[styles.logoWrap, { opacity: fadeAnim }]}>
          <Animated.Text
            style={[
              styles.logoText,
              {
                color: colors.primary,
                textShadowColor: isDark ? colors.primary : 'rgba(2, 132, 199, 0.3)',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            ATHLETIX
          </Animated.Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            AI-Powered Sports Assessment
          </Text>
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 40 }}
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Slot />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
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
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 13,
    letterSpacing: 2,
    marginTop: 8,
    textTransform: 'uppercase',
  },
});
