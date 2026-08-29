/**
 * ATHLETIX — Login Screen (Minimalist Dual-Tone Stream)
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
import { login } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export default function LoginScreen() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!email.trim()) { setError('Please enter your email.'); shake(); return; }
    if (!password.trim()) { setError('Please enter your password.'); shake(); return; }

    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      await refresh();
    } catch (err: any) {
      const msg = err?.userMessage ?? 'Login failed. Please check credentials.';
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
                  Welcome Back
                </Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  Sign in to your athlete account
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

                {/* Password Field */}
                <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 14 }]}>
                  PASSWORD
                </Text>
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

                {/* Footer Switcher */}
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
  topRightToggle: {
    position: 'absolute',
    top: 14,
    right: 18,
    zIndex: 10,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  logoSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  errorText: { fontSize: 12, fontWeight: '700' },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: { fontSize: 13, fontWeight: '500' },
  linkText: { fontSize: 13, fontWeight: '800' },
});
