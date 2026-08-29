/**
 * ATHLETIX — Login & Password Recovery Screen
 * app/(auth)/login.tsx
 */

import React, { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import MinimalCard from '../../components/MinimalCard';
import InnovativeIcon from '../../components/InnovativeIcon';
import NeomorphicButton from '../../components/NeomorphicButton';
import ThemeToggle from '../../components/ThemeToggle';
import { login, forgotPassword } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export default function LoginScreen() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const cardAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(cardAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [cardAnim, fadeAnim]);

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function handleLogin() {
    setError('');
    setResetSuccess('');
    if (!email.trim()) { setError('Please enter your email address.'); shake(); return; }
    if (!password.trim()) { setError('Please enter your password.'); shake(); return; }

    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      await refresh();
    } catch (err: any) {
      const msg = err?.userMessage ?? 'Login failed. Please check your credentials.';
      setError(msg);
      shake();
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError('');
    setResetSuccess('');
    if (!email.trim()) { setError('Please enter your email address to receive reset link.'); shake(); return; }

    setLoading(true);
    try {
      const msg = await forgotPassword(email.trim().toLowerCase());
      setResetSuccess(msg);
    } catch (err: any) {
      const msg = err?.message || err?.userMessage || 'Could not dispatch password reset email. Please try again.';
      setError(msg);
      shake();
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={colors.gradientMain} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <View style={styles.topRightToggle}>
            <ThemeToggle compact />
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Logo */}
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
              <View
                style={[
                  styles.logoBadge,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#111111',
                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#111111',
                  },
                ]}
              >
                <InnovativeIcon name="zap" size={24} color={isDark ? colors.primary : '#F7F4EE'} />
              </View>
              <Text style={[styles.logoText, { color: colors.textPrimary }]}>
                ATHLETIX
              </Text>
              <Text style={[styles.logoSub, { color: colors.textSecondary }]}>
                AI-Powered Sports Biomechanics & Scouting
              </Text>
            </Animated.View>

            {/* Minimalist Card */}
            <Animated.View
              style={{
                transform: [{ translateY: cardAnim }, { translateX: shakeAnim }],
                opacity: fadeAnim,
                width: '100%',
                maxWidth: 420,
              }}
            >
              <MinimalCard contentStyle={{ padding: 22 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  {isForgotPassword ? 'Reset Password' : 'Welcome Back'}
                </Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  {isForgotPassword
                    ? 'Enter your account email to receive reset instructions'
                    : 'Sign in to your athlete account'}
                </Text>

                {error ? (
                  <View
                    style={[
                      styles.errorBox,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFECE4', borderColor: colors.border },
                    ]}
                  >
                    <InnovativeIcon name="alert-circle" size={14} color={colors.textPrimary} />
                    <Text style={[styles.errorText, { color: colors.textPrimary }]}>{error}</Text>
                  </View>
                ) : null}

                {resetSuccess ? (
                  <View
                    style={[
                      styles.successBox,
                      { backgroundColor: isDark ? 'rgba(57, 255, 20, 0.12)' : '#EFECE4', borderColor: colors.border },
                    ]}
                  >
                    <InnovativeIcon name="shield-check" size={14} color={isDark ? colors.secondary : colors.textPrimary} />
                    <Text style={[styles.successText, { color: colors.textPrimary }]}>{resetSuccess}</Text>
                  </View>
                ) : null}

                {/* Email Field */}
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                  EMAIL ADDRESS
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="athlete@example.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : '#FFFFFF',
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                />

                {!isForgotPassword ? (
                  <>
                    {/* Password Field Header with Forgot Password Link */}
                    <View style={styles.passwordRow}>
                      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                        PASSWORD
                      </Text>
                      <Pressable
                        onPress={() => {
                          setError('');
                          setResetSuccess('');
                          setIsForgotPassword(true);
                        }}
                      >
                        <Text style={[styles.forgotLink, { color: colors.textPrimary }]}>
                          Forgot Password?
                        </Text>
                      </Pressable>
                    </View>

                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : '#FFFFFF',
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                    />

                    {/* Submit CTA */}
                    <NeomorphicButton
                      title={loading ? 'SIGNING IN...' : 'SIGN IN'}
                      icon={<InnovativeIcon name="arrow-right" size={16} color={isDark ? '#FFFFFF' : '#F7F4EE'} />}
                      onPress={handleLogin}
                      loading={loading}
                      variant="primary"
                      size="lg"
                      style={{ marginTop: 22 }}
                    />
                  </>
                ) : (
                  <>
                    {/* Send Reset Link CTA */}
                    <NeomorphicButton
                      title={loading ? 'SENDING LINK...' : 'SEND RESET LINK'}
                      icon={<InnovativeIcon name="send" size={16} color={isDark ? '#FFFFFF' : '#F7F4EE'} />}
                      onPress={handleForgotPassword}
                      loading={loading}
                      variant="primary"
                      size="lg"
                      style={{ marginTop: 22 }}
                    />

                    <Pressable
                      onPress={() => {
                        setError('');
                        setResetSuccess('');
                        setIsForgotPassword(false);
                      }}
                      style={{ marginTop: 16, alignItems: 'center' }}
                    >
                      <Text style={[styles.linkText, { color: colors.textPrimary }]}>
                        ← Back to Sign In
                      </Text>
                    </Pressable>
                  </>
                )}

                {/* Footer Switcher */}
                {!isForgotPassword && (
                  <View style={styles.footerRow}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                      New to Athletix?{' '}
                    </Text>
                    <Pressable onPress={() => router.push('/(auth)/signup' as any)}>
                      <Text style={[styles.linkText, { color: colors.textPrimary }]}>
                        Create Account
                      </Text>
                    </Pressable>
                  </View>
                )}
              </MinimalCard>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
  topRightToggle: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: 28 },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { fontSize: 26, fontWeight: '900', letterSpacing: 2 },
  logoSub: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  cardTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  cardSub: { fontSize: 13, fontWeight: '500', marginTop: 4, marginBottom: 18 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  errorText: { fontSize: 12, fontWeight: '600', flex: 1 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  successText: { fontSize: 12, fontWeight: '600', flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginBottom: 6 },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  forgotLink: { fontSize: 11, fontWeight: '800', textDecorationLine: 'underline' },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: { fontSize: 13, fontWeight: '500' },
  linkText: { fontSize: 13, fontWeight: '800', textDecorationLine: 'underline' },
});
