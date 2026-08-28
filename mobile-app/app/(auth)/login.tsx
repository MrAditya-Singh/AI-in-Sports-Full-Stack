/**
 * ATHLETIX — Login Screen
 * app/(auth)/login.tsx
 *
 * Features:
 *  - Dynamic Light & Dark Theme support
 *  - Glassmorphism card on adaptive gradient background
 *  - Top corner ThemeToggle for instant preview
 *  - Animated entrance (slide up + fade)
 *  - Inline field validation with animated error shake
 *  - Loading state with spinner on the button
 *  - Link to signup screen
 */

import React, { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import ThemeToggle from '../../components/ThemeToggle';
import { login } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export default function LoginScreen() {
  const router  = useRouter();
  const { refresh } = useAuth();
  const { colors, isDark } = useTheme();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // Animation refs
  const cardAnim  = useRef(new Animated.Value(60)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(cardAnim, { toValue: 0,  useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(fadeAnim, { toValue: 1,  duration: 600, useNativeDriver: true }),
    ]).start();
  }, [cardAnim, fadeAnim]);

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0,  duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function handleLogin() {
    setError('');
    if (!email.trim())    { setError('Please enter your email.');    shake(); return; }
    if (!password.trim()) { setError('Please enter your password.'); shake(); return; }

    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      await refresh();            // re-read AsyncStorage → triggers nav guard
      // Navigation guard in _layout.tsx handles routing to role dashboard
    } catch (err: any) {
      const msg = err?.userMessage ?? 'Login failed. Please try again.';
      setError(msg);
      shake();
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={colors.gradientMain}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          {/* Top corner theme toggle */}
          <View style={styles.topRightToggle}>
            <ThemeToggle compact />
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* ── Header ── */}
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
              <Text
                style={[
                  styles.logoText,
                  {
                    color: colors.primary,
                    textShadowColor: isDark ? colors.primary : 'rgba(2, 132, 199, 0.3)',
                  },
                ]}
              >
                ATHLETIX
              </Text>
              <Text style={[styles.logoSub, { color: colors.textSecondary }]}>
                AI-Powered Sports Assessment
              </Text>
            </Animated.View>

            {/* ── Card ── */}
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark ? 'rgba(0, 212, 255, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                  shadowColor: colors.cardShadow,
                  transform: [
                    { translateY: cardAnim },
                    { translateX: shakeAnim },
                  ],
                  opacity: fadeAnim,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Welcome back
              </Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                Sign in to continue your athletic journey
              </Text>

              {/* Email */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textMuted }]}>EMAIL</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.surfaceElevated,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="athlete@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Password */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textMuted }]}>PASSWORD</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.surfaceElevated,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {/* Forgot Password */}
              <Pressable onPress={() => router.push('/(auth)/forgot-password' as any)} style={styles.forgotRow}>
                <Text style={[styles.forgotText, { color: colors.warning }]}>
                  Forgot password?
                </Text>
              </Pressable>

              {/* Error */}
              {error ? (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: `${colors.error}15`,
                      borderColor: `${colors.error}35`,
                    },
                  ]}
                >
                  <Text style={[styles.errorText, { color: colors.error }]}>⚠  {error}</Text>
                </View>
              ) : null}

              {/* CTA */}
              <Pressable
                style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
                onPress={handleLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={
                    isDark
                      ? ['#00D4FF', '#0099BB']
                      : ['#0284C7', '#0369A1']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  {loading
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={styles.btnText}>SIGN IN</Text>
                  }
                </LinearGradient>
              </Pressable>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Signup link */}
              <Pressable onPress={() => router.push('/(auth)/signup')} style={styles.linkRow}>
                <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                  New to ATHLETIX?{'  '}
                  <Text style={[styles.linkHighlight, { color: colors.primary }]}>Create account →</Text>
                </Text>
              </Pressable>
            </Animated.View>

            {/* Bottom tagline */}
            <Animated.Text style={[styles.bottomTagline, { opacity: fadeAnim, color: colors.textMuted }]}>
              Talent is everywhere. Assessment is not.
            </Animated.Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient:  { flex: 1 },
  safe:      { flex: 1 },
  kav:       { flex: 1 },
  scroll:    { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },

  topRightToggle: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
  },

  header:    { alignItems: 'center', marginBottom: 32 },
  logoText:  {
    fontSize: 38, fontWeight: '900', letterSpacing: 6,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  logoSub:   { fontSize: 11, letterSpacing: 2.5, marginTop: 6, textTransform: 'uppercase' },

  card: {
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle:  { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  cardSub:    { fontSize: 13, marginBottom: 24 },

  fieldWrap:  { marginBottom: 16 },
  label:      { fontSize: 10, letterSpacing: 2, marginBottom: 6, fontWeight: '700' },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  errorBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontSize: 13 },

  btn:         { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  btnPressed:  { opacity: 0.85 },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  btnText:     { color: '#FFFFFF', fontWeight: '900', fontSize: 15, letterSpacing: 3 },

  forgotRow:   { alignSelf: 'flex-end', marginBottom: 8 },
  forgotText:  { fontSize: 12, fontWeight: '600' },

  divider:     { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, marginHorizontal: 12, letterSpacing: 1 },

  linkRow:        { alignItems: 'center' },
  linkText:       { fontSize: 14 },
  linkHighlight:  { fontWeight: '700' },

  bottomTagline: {
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 32,
    fontStyle: 'italic',
  },
});
