/**
 * ATHLETIX — Forgot Password Screen
 * app/(auth)/forgot-password.tsx
 *
 * Features:
 *  - Dynamic Light & Dark Theme support with ThemeToggle
 *  - Email input to request password reset
 *  - Animated entrance matching login screen style
 *  - Success state with confirmation message
 *  - Error shake animation on validation failure
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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import ThemeToggle from '../../components/ThemeToggle';
import { forgotPassword } from '../../services/authService';
import { useTheme } from '../../hooks/useTheme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Animations
  const cardAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(cardAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function handleReset() {
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      shake();
      return;
    }

    setLoading(true);
    try {
      const msg = await forgotPassword(email.trim().toLowerCase());
      setSuccess(msg);
    } catch (caughtError: unknown) {
      const authError = caughtError as {
        userMessage?: string;
        message?: string;
      };

      const message =
        authError.userMessage ??
        authError.message ??
        'Could not send reset email. Please try again.';

      setError(message);
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {/* Top Bar with Back & ThemeToggle */}
            <View style={styles.topBar}>
              <Pressable onPress={() => router.replace('/(auth)/login' as never)} style={styles.backBtn}>
                <Text style={[styles.backText, { color: colors.primary }]}>← Back to Login</Text>
              </Pressable>

              <ThemeToggle compact />
            </View>

            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
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
              <Text style={[styles.appName, { color: colors.textPrimary }]}>ATHLETIX</Text>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Forgot Password?</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Enter your registered email and we will send you a secure link to reset your account password.
              </Text>
            </Animated.View>

            {/* Card */}
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.cardShadow,
                  transform: [{ translateY: cardAnim }, { translateX: shakeAnim }],
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
                  <Text style={[styles.errorText, { color: colors.error }]}>⚠ {error}</Text>
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
                  <Text style={[styles.successText, { color: colors.secondary }]}>✓ {success}</Text>
                </View>
              ) : null}

              {/* Email field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>EMAIL ADDRESS</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setError('');
                  }}
                  placeholder="athlete@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              {/* Submit button */}
              <Pressable
                onPress={handleReset}
                disabled={loading}
                style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
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
                  {loading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.btnText}>SEND RESET LINK ✉️</Text>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={() => router.replace('/(auth)/login' as never)}
                style={styles.switchRow}
              >
                <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                  Remember your password?{' '}
                  <Text style={[styles.switchLink, { color: colors.primary }]}>Sign in</Text>
                </Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe:     { flex: 1 },
  kav:      { flex: 1 },
  scroll:   { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn:  { alignSelf: 'flex-start' },
  backText: { fontSize: 13, fontWeight: '700' },

  header:    { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10, borderWidth: 1.5,
  },
  logoIcon:  { fontSize: 28 },
  appName:   { fontSize: 13, letterSpacing: 4, fontWeight: '900', marginBottom: 6 },
  title:     { fontSize: 24, fontWeight: '900', letterSpacing: 0.5, marginBottom: 8 },
  subtitle:  { fontSize: 13, textAlign: 'center', lineHeight: 19, paddingHorizontal: 12 },

  card: {
    borderRadius: 22, padding: 22,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  errorBanner: {
    borderRadius: 10, padding: 12, borderWidth: 1,
    marginBottom: 14,
  },
  errorText: { fontSize: 12, fontWeight: '700' },

  successBanner: {
    borderRadius: 10, padding: 12, borderWidth: 1,
    marginBottom: 14,
  },
  successText: { fontSize: 12, fontWeight: '700', lineHeight: 18 },

  inputGroup: { marginBottom: 20 },
  label:      { fontSize: 10, letterSpacing: 1.5, fontWeight: '800', marginBottom: 8 },
  input: {
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 14, borderWidth: 1,
  },

  btn: { borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  btnGrad: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13, letterSpacing: 1.5 },

  switchRow:  { alignItems: 'center', marginTop: 4 },
  switchText: { fontSize: 13 },
  switchLink: { fontWeight: '800' },
});
