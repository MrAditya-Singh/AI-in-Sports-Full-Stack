/**
 * ATHLETIX — Login Screen
 * app/(auth)/login.tsx
 *
 * Features:
 *  - Dark glassmorphism card on gradient background
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

import { login } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';

export default function LoginScreen() {
  const router  = useRouter();
  const { refresh } = useAuth();

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
  }, []);

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
      colors={['#070B14', '#0A0E1A', '#0D1525']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* ── Header ── */}
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
              <Text style={styles.logoText}>ATHLETIX</Text>
              <Text style={styles.logoSub}>AI-Powered Sports Assessment</Text>
            </Animated.View>

            {/* ── Card ── */}
            <Animated.View
              style={[
                styles.card,
                {
                  transform: [
                    { translateY: cardAnim },
                    { translateX: shakeAnim },
                  ],
                  opacity: fadeAnim,
                },
              ]}
            >
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardSub}>Sign in to continue your journey</Text>

              {/* Email */}
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>EMAIL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="athlete@example.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Password */}
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {/* Error */}
              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠  {error}</Text>
                </View>
              ) : null}

              {/* CTA */}
              <Pressable
                style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
                onPress={handleLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#00D4FF', '#0099BB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  {loading
                    ? <ActivityIndicator color="#000" />
                    : <Text style={styles.btnText}>SIGN IN</Text>
                  }
                </LinearGradient>
              </Pressable>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Signup link */}
              <Pressable onPress={() => router.push('/(auth)/signup')} style={styles.linkRow}>
                <Text style={styles.linkText}>
                  New to ATHLETIX?{'  '}
                  <Text style={styles.linkHighlight}>Create account →</Text>
                </Text>
              </Pressable>
            </Animated.View>

            {/* Bottom tagline */}
            <Animated.Text style={[styles.bottomTagline, { opacity: fadeAnim }]}>
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
  scroll:    { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

  header:    { alignItems: 'center', marginBottom: 40 },
  logoText:  {
    fontSize: 38, fontWeight: '900', letterSpacing: 6,
    color: Colors.primary,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  logoSub:   { color: Colors.textSecondary, fontSize: 11, letterSpacing: 2.5, marginTop: 6, textTransform: 'uppercase' },

  card: {
    backgroundColor: 'rgba(19, 25, 41, 0.92)',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.15)',
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
  },
  cardTitle:  { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  cardSub:    { fontSize: 13, color: Colors.textSecondary, marginBottom: 28 },

  fieldWrap:  { marginBottom: 16 },
  label:      { fontSize: 10, letterSpacing: 2, color: Colors.textMuted, marginBottom: 6, fontWeight: '700' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  errorBanner: {
    backgroundColor: 'rgba(255, 68, 68, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: Colors.error, fontSize: 13 },

  btn:         { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  btnPressed:  { opacity: 0.85 },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  btnText:     { color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 3 },

  divider:     { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: 11, marginHorizontal: 12, letterSpacing: 1 },

  linkRow:        { alignItems: 'center' },
  linkText:       { color: Colors.textSecondary, fontSize: 14 },
  linkHighlight:  { color: Colors.primary, fontWeight: '700' },

  bottomTagline: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 36,
    fontStyle: 'italic',
  },
});
