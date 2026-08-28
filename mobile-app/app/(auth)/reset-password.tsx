/**
 * ATHLETIX — Reset Password Screen
 * app/(auth)/reset-password.tsx
 *
 * Features:
 *  - Dynamic Light & Dark Theme support with ThemeToggle
 *  - Secure token verification from magic link
 *  - Password strength validation & confirmation check
 *  - High-contrast inputs & smooth gradient styling
 */

import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
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

import ThemeToggle from '../../components/ThemeToggle';
import { resetPassword } from '../../services/authService';
import { useTheme } from '../../hooks/useTheme';

interface UserFacingError {
  userMessage?: string;
  message?: string;
}

function extractRecoveryToken(incomingUrl: string): string | null {
  try {
    const fragment = incomingUrl.split('#')[1];
    if (!fragment) return null;

    const parameters = new URLSearchParams(fragment);
    const accessToken = parameters.get('access_token');
    const linkType = parameters.get('type');

    if (linkType && linkType !== 'recovery') {
      return null;
    }

    return accessToken;
  } catch {
    return null;
  }
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isReadingLink, setIsReadingLink] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const processUrl = useCallback((url: string | null): void => {
    if (!url) {
      setError('Password reset link is missing or invalid.');
      setIsReadingLink(false);
      return;
    }

    const token = extractRecoveryToken(url);
    if (!token) {
      setError('Password reset link is invalid or expired. Please request a new link.');
      setIsReadingLink(false);
      return;
    }

    setAccessToken(token);
    setError('');
    setIsReadingLink(false);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      processUrl(window.location.href);
      return;
    }

    void Linking.getInitialURL().then(processUrl);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      processUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [processUrl]);

  const handlePasswordUpdate = async (): Promise<void> => {
    setError('');
    setSuccess('');

    if (!accessToken) {
      setError('Password reset link is invalid or expired.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const message = await resetPassword(accessToken, password);
      setSuccess(message);
      setPassword('');
      setConfirmPassword('');

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, '/reset-password');
      }
    } catch (caughtError: unknown) {
      const authError = caughtError as UserFacingError;
      setError(
        authError.userMessage ??
        authError.message ??
        'Could not update password. Please request a new link.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isReadingLink) {
    return (
      <LinearGradient
        colors={colors.gradientMain}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Verifying password reset link...
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
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
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Bar with Back & ThemeToggle */}
            <View style={styles.topBar}>
              <Pressable
                onPress={() => router.replace('/(auth)/login' as never)}
                style={styles.backBtn}
              >
                <Text style={[styles.backText, { color: colors.primary }]}>
                  ← Back to Login
                </Text>
              </Pressable>

              <ThemeToggle compact />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View
                style={[
                  styles.logoCircle,
                  {
                    backgroundColor: `${colors.primary}20`,
                    borderColor: `${colors.primary}45`,
                  },
                ]}
              >
                <Text style={styles.logoIcon}>⚡</Text>
              </View>
              <Text style={[styles.appName, { color: colors.textPrimary }]}>
                ATHLETIX
              </Text>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Set New Password
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Enter your new secure password below to regain access to your athlete portal.
              </Text>
            </View>

            {/* Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.cardShadow,
                },
              ]}
            >
              {error ? (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: `${colors.error}18`,
                      borderColor: `${colors.error}40`,
                    },
                  ]}
                >
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    ⚠ {error}
                  </Text>
                </View>
              ) : null}

              {success ? (
                <View
                  style={[
                    styles.successBanner,
                    {
                      backgroundColor: `${colors.secondary}18`,
                      borderColor: `${colors.secondary}40`,
                    },
                  ]}
                >
                  <Text style={[styles.successText, { color: colors.secondary }]}>
                    ✓ {success}
                  </Text>
                  <Pressable
                    onPress={() => router.replace('/(auth)/login' as never)}
                    style={[
                      styles.successLoginBtn,
                      {
                        backgroundColor: `${colors.secondary}25`,
                        borderColor: `${colors.secondary}50`,
                      },
                    ]}
                  >
                    <Text style={[styles.successLoginText, { color: colors.secondary }]}>
                      Go to Sign In →
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {!success ? (
                <>
                  {/* New Password */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                      NEW PASSWORD
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                      value={password}
                      onChangeText={(val) => {
                        setPassword(val);
                        setError('');
                      }}
                      placeholder="At least 8 characters"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                    />
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                      CONFIRM PASSWORD
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                      value={confirmPassword}
                      onChangeText={(val) => {
                        setConfirmPassword(val);
                        setError('');
                      }}
                      placeholder="Repeat your password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                    />
                  </View>

                  {/* Show/Hide checkbox */}
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.showPasswordRow}
                  >
                    <Text style={[styles.showPasswordText, { color: colors.textSecondary }]}>
                      {showPassword ? '👁️ Hide password' : '👁️ Show password'}
                    </Text>
                  </Pressable>

                  {/* Update button */}
                  <Pressable
                    onPress={handlePasswordUpdate}
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.btn,
                      isSubmitting && styles.btnDisabled,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <LinearGradient
                      colors={
                        isDark
                          ? ['#00D4FF', '#0099BB']
                          : ['#0284C7', '#0369A1']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.btnGrad}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.btnText}>UPDATE PASSWORD 🔒</Text>
                      )}
                    </LinearGradient>
                  </Pressable>
                </>
              ) : null}

              <Pressable
                onPress={() => router.replace('/(auth)/login' as never)}
                style={styles.switchRow}
              >
                <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                  Remember password?{' '}
                  <Text style={[styles.switchLink, { color: colors.primary }]}>
                    Sign in
                  </Text>
                </Text>
              </Pressable>
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
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 13 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: { alignSelf: 'flex-start' },
  backText: { fontSize: 13, fontWeight: '700' },

  header: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
  },
  logoIcon: { fontSize: 28 },
  appName: { fontSize: 13, letterSpacing: 4, fontWeight: '900', marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: 0.5, marginBottom: 8 },
  subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 19, paddingHorizontal: 12 },

  card: {
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  errorBanner: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  errorText: { fontSize: 12, fontWeight: '700' },

  successBanner: {
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
    alignItems: 'center',
  },
  successText: { fontSize: 13, fontWeight: '700', lineHeight: 18, textAlign: 'center' },
  successLoginBtn: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  successLoginText: { fontSize: 12, fontWeight: '800' },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 10, letterSpacing: 1.5, fontWeight: '800', marginBottom: 8 },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    borderWidth: 1,
  },

  showPasswordRow: {
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  showPasswordText: { fontSize: 12, fontWeight: '600' },

  btn: { borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  btnDisabled: { opacity: 0.5 },
  btnGrad: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13, letterSpacing: 1.5 },

  switchRow: { alignItems: 'center', marginTop: 4 },
  switchText: { fontSize: 13 },
  switchLink: { fontWeight: '800' },
});