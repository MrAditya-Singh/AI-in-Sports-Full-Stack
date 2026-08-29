/**
 * ATHLETIX — Reset Password Screen
 * app/(auth)/reset-password.tsx
 *
 * Designed with Neomorphism, minimal stream style, vector icons & full Supabase database password update integration.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import MinimalCard from '../../components/MinimalCard';
import InnovativeIcon from '../../components/InnovativeIcon';
import NeomorphicButton from '../../components/NeomorphicButton';
import ThemeToggle from '../../components/ThemeToggle';
import { resetPassword, supabase } from '../../services/authService';
import { useTheme } from '../../hooks/useTheme';

function extractToken(url: string | null): string | null {
  if (!url) return null;
  try {
    // Check hash fragment (#access_token=...)
    const fragment = url.split('#')[1];
    if (fragment) {
      const params = new URLSearchParams(fragment);
      const token = params.get('access_token');
      if (token) return token;
    }
    // Check query parameters (?access_token=... or ?token=... or ?code=...)
    const query = url.split('?')[1];
    if (query) {
      const params = new URLSearchParams(query);
      const token = params.get('access_token') || params.get('token') || params.get('code');
      if (token) return token;
    }
  } catch {
    // Ignore parse error
  }
  return null;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleIncomingUrl = useCallback((url: string | null) => {
    const token = extractToken(url);
    if (token) {
      setAccessToken(token);
    }
    setIsVerifying(false);
  }, []);

  useEffect(() => {
    // Listen to Supabase auth events for PASSWORD_RECOVERY
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setIsVerifying(false);
      }
    });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      handleIncomingUrl(window.location.href);
    } else {
      void Linking.getInitialURL().then(handleIncomingUrl);
      const sub = Linking.addEventListener('url', ({ url }) => handleIncomingUrl(url));
      return () => {
        authListener.subscription.unsubscribe();
        sub.remove();
      };
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [handleIncomingUrl]);

  const handlePasswordUpdate = async (): Promise<void> => {
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your passwords.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Direct Supabase Auth password update (updates user password in Supabase Auth & DB)
      const { error: sbErr } = await supabase.auth.updateUser({ password });
      if (!sbErr) {
        setSuccess('Password updated successfully! Redirecting to login...');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          router.replace('/(auth)/login' as never);
        }, 1600);
        return;
      }

      // 2. Secondary token-based reset via API
      if (accessToken) {
        const msg = await resetPassword(accessToken, password);
        setSuccess(msg + ' Redirecting to login...');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          router.replace('/(auth)/login' as never);
        }, 1600);
        return;
      }

      setError(sbErr.message || 'Could not update password. Link may be expired.');
    } catch (err: any) {
      setError(err?.userMessage || err?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return (
      <LinearGradient colors={colors.gradientMain} style={styles.gradient}>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Verifying recovery session...
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.gradientMain} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Top Row Nav */}
            <View style={styles.topBar}>
              <Pressable
                onPress={() => router.replace('/(auth)/login' as never)}
                style={[
                  styles.backBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                    borderColor: colors.border,
                  },
                ]}
              >
                <InnovativeIcon name="arrow-left" size={14} color={colors.textPrimary} />
                <Text style={[styles.backText, { color: colors.textPrimary }]}>Back to Login</Text>
              </Pressable>

              <ThemeToggle compact />
            </View>

            {/* Header Logo */}
            <View style={styles.header}>
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
              <Text style={[styles.logoText, { color: colors.textPrimary }]}>ATHLETIX</Text>
              <Text style={[styles.logoSub, { color: colors.textSecondary }]}>
                AI-Powered Biomechanics Account Security
              </Text>
            </View>

            {/* Main Form Card */}
            <View style={{ width: '100%', maxWidth: 420 }}>
              <MinimalCard contentStyle={{ padding: 22 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Set New Password</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  Enter and confirm your new secure account password below
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

                {success ? (
                  <View
                    style={[
                      styles.successBox,
                      { backgroundColor: isDark ? 'rgba(57, 255, 20, 0.12)' : '#EFECE4', borderColor: colors.border },
                    ]}
                  >
                    <InnovativeIcon name="shield-check" size={16} color={isDark ? colors.secondary : colors.textPrimary} />
                    <Text style={[styles.successText, { color: colors.textPrimary }]}>{success}</Text>
                  </View>
                ) : null}

                {!success && (
                  <>
                    {/* New Password Input */}
                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>NEW PASSWORD</Text>
                    <TextInput
                      value={password}
                      onChangeText={(v) => { setPassword(v); setError(''); }}
                      placeholder="At least 8 characters"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : '#FFFFFF',
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                    />

                    {/* Confirm Password Input */}
                    <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 14 }]}>
                      CONFIRM PASSWORD
                    </Text>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={(v) => { setConfirmPassword(v); setError(''); }}
                      placeholder="Re-enter your password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : '#FFFFFF',
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                    />

                    {/* Toggle Show Password */}
                    <Pressable
                      onPress={() => setShowPassword((p) => !p)}
                      style={styles.showPasswordRow}
                    >
                      <InnovativeIcon name={showPassword ? "shield-check" : "shield"} size={14} color={colors.textMuted} />
                      <Text style={[styles.showPasswordText, { color: colors.textSecondary }]}>
                        {showPassword ? 'Hide password characters' : 'Show password characters'}
                      </Text>
                    </Pressable>

                    {/* Submit CTA */}
                    <NeomorphicButton
                      title={isSubmitting ? 'UPDATING PASSWORD...' : 'UPDATE PASSWORD'}
                      icon={<InnovativeIcon name="check-circle" size={16} color={isDark ? '#FFFFFF' : '#F7F4EE'} />}
                      onPress={handlePasswordUpdate}
                      loading={isSubmitting}
                      variant="primary"
                      size="lg"
                      style={{ marginTop: 22 }}
                    />
                  </>
                )}
              </MinimalCard>
            </View>
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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, fontWeight: '600' },
  topBar: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  backText: { fontSize: 12, fontWeight: '700' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: 24 },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoText: { fontSize: 24, fontWeight: '900', letterSpacing: 2 },
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
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  successText: { fontSize: 13, fontWeight: '700', flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginBottom: 6 },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  showPasswordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  showPasswordText: { fontSize: 12, fontWeight: '600' },
});