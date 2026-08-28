/**
 * ATHLETIX — Signup Screen
 * app/(auth)/signup.tsx
 *
 * Features:
 *  - Dynamic Light & Dark Theme support
 *  - Animated role selector: 3 glowing cards (Athlete / Official / Admin)
 *  - Top corner ThemeToggle for instant preview
 *  - Selected role card expands with neon border glow
 *  - Form fields fade in after role is chosen
 *  - Full validation with shake animation
 *  - Password strength mini-indicator
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
import { signup, UserRole } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export default function SignupScreen() {
  const router      = useRouter();
  const { refresh } = useAuth();
  const { colors, isDark } = useTheme();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const roles = [
    {
      key:   'athlete' as UserRole,
      icon:  '🏃',
      label: 'Athlete',
      desc:  'Upload videos & get AI-scored assessments',
      glow:  colors.secondary,
    },
    {
      key:   'official' as UserRole,
      icon:  '🏅',
      label: 'Official',
      desc:  'Scout talent & verify performances',
      glow:  colors.primary,
    },
    {
      key:   'admin' as UserRole,
      icon:  '⚙️',
      label: 'Admin',
      desc:  'Manage the platform & analytics',
      glow:  colors.warning,
    },
  ];

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim   = useRef(new Animated.Value(0)).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const roleAnims  = useRef(roles.map(() => new Animated.Value(0))).current;

  React.useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    roles.forEach((_, i) => {
      Animated.spring(roleAnims[i], {
        toValue: 1, delay: 150 + i * 100, useNativeDriver: true, tension: 60, friction: 8,
      }).start();
    });
  }, [headerAnim]);

  function onSelectRole(role: UserRole) {
    setSelectedRole(role);
    setError('');
    Animated.timing(formAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:   8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:   0, duration: 55, useNativeDriver: true }),
    ]).start();
  }

  // Password strength indicator (0-3)
  function passwordStrength(): number {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8)              s++;
    if (/[A-Z]/.test(password))            s++;
    if (/[0-9!@#$%^&*]/.test(password))   s++;
    return s;
  }

  const strength = passwordStrength();
  const strengthColors = [colors.error, colors.warning, colors.secondary];
  const strengthLabels = ['Weak', 'Fair', 'Strong'];

  async function handleSignup() {
    setError('');
    if (!selectedRole)         { setError('Please select your role first.');          shake(); return; }
    if (!name.trim())          { setError('Please enter your name.');                  shake(); return; }
    if (!email.trim())         { setError('Please enter your email.');                 shake(); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters.');  shake(); return; }

    setLoading(true);
    try {
      await signup({
        name:  name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role:  selectedRole,
      });
      await refresh();
      // Navigation guard routes to correct dashboard automatically
    } catch (err: any) {
      const msg = err?.userMessage ?? 'Signup failed. Please try again.';
      setError(msg);
      shake();
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={colors.gradientMain} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          {/* Top corner ThemeToggle */}
          <View style={styles.topRightToggle}>
            <ThemeToggle compact />
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {/* ── Back + Header ── */}
            <Animated.View style={[styles.header, { opacity: headerAnim }]}>
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
              </Pressable>
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
              <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                Create your account
              </Text>
            </Animated.View>

            {/* ── Step 1: Role selector ── */}
            <Text style={[styles.stepLabel, { color: colors.textMuted }]}>
              STEP 1 — CHOOSE YOUR ROLE
            </Text>
            <View style={styles.roleRow}>
              {roles.map((r, i) => {
                const isSelected = selectedRole === r.key;
                return (
                  <Animated.View
                    key={r.key}
                    style={[
                      styles.roleCardWrap,
                      {
                        opacity:   roleAnims[i],
                        transform: [{ scale: roleAnims[i] }],
                      },
                    ]}
                  >
                    <Pressable
                      style={[
                        styles.roleCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          shadowColor: colors.cardShadow,
                        },
                        isSelected && {
                          borderColor: r.glow,
                          shadowColor: r.glow,
                          shadowOpacity: 0.35,
                          shadowRadius: 10,
                          elevation: 6,
                          backgroundColor: `${r.glow}18`,
                        },
                      ]}
                      onPress={() => onSelectRole(r.key)}
                    >
                      <Text style={styles.roleIcon}>{r.icon}</Text>
                      <Text
                        style={[
                          styles.roleLabel,
                          { color: colors.textPrimary },
                          isSelected && { color: r.glow },
                        ]}
                      >
                        {r.label}
                      </Text>
                      <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>
                        {r.desc}
                      </Text>
                      {isSelected && (
                        <View style={[styles.selectedDot, { backgroundColor: r.glow }]} />
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            {/* ── Step 2: Form (fades in after role selected) ── */}
            {selectedRole && (
              <Animated.View
                style={[
                  styles.formCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    shadowColor: colors.cardShadow,
                    opacity: formAnim,
                    transform: [{ translateX: shakeAnim }],
                  },
                ]}
              >
                <Text style={[styles.stepLabel, { color: colors.textMuted }]}>
                  STEP 2 — YOUR DETAILS
                </Text>

                {/* Name */}
                <View style={styles.fieldWrap}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>FULL NAME</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.surfaceElevated,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor={colors.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

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
                    placeholder="you@example.com"
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
                    placeholder="Min 8 characters"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <View style={styles.strengthWrap}>
                      {[0, 1, 2].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.strengthBar,
                            { backgroundColor: i < strength ? strengthColors[strength - 1] : colors.border },
                          ]}
                        />
                      ))}
                      {strength > 0 && (
                        <Text style={[styles.strengthLabel, { color: strengthColors[strength - 1] }]}>
                          {strengthLabels[strength - 1]}
                        </Text>
                      )}
                    </View>
                  )}
                </View>

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
                  onPress={handleSignup}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={
                      isDark
                        ? ['#39FF14', '#28CC0F']
                        : ['#059669', '#047857']
                    }
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    {loading
                      ? <ActivityIndicator color="#FFF" />
                      : <Text style={styles.btnText}>CREATE ACCOUNT →</Text>
                    }
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}

            {/* Sign in link */}
            <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.linkRow}>
              <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                Already have an account?{'  '}
                <Text style={[styles.linkHighlight, { color: colors.primary }]}>Sign in →</Text>
              </Text>
            </Pressable>

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
  scroll:   { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 28 },

  topRightToggle: {
    position: 'absolute',
    top: 14,
    right: 20,
    zIndex: 10,
  },

  header: { alignItems: 'center', marginBottom: 28 },
  backBtn:  { alignSelf: 'flex-start', marginBottom: 12 },
  backText: { fontSize: 13, fontWeight: '700' },
  logoText: {
    fontSize: 34, fontWeight: '900', letterSpacing: 5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  headerSub: { fontSize: 12, letterSpacing: 1.5, marginTop: 4, textTransform: 'uppercase' },

  stepLabel: {
    fontSize: 10, letterSpacing: 2, fontWeight: '800',
    marginBottom: 12,
  },

  roleRow:      { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleCardWrap: { flex: 1 },
  roleCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  roleIcon:    { fontSize: 26, marginBottom: 6 },
  roleLabel:   { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  roleDesc:    { fontSize: 9, textAlign: 'center', lineHeight: 12 },
  selectedDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },

  formCard: {
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  fieldWrap: { marginBottom: 16 },
  label:     { fontSize: 10, letterSpacing: 2, marginBottom: 6, fontWeight: '700' },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  strengthWrap:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  strengthBar:   { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 10, fontWeight: '700', marginLeft: 4 },

  errorBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontSize: 13 },

  btn:         { borderRadius: 14, overflow: 'hidden', marginTop: 6 },
  btnPressed:  { opacity: 0.85 },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  btnText:     { color: '#FFFFFF', fontWeight: '900', fontSize: 14, letterSpacing: 2 },

  linkRow:       { alignItems: 'center', paddingVertical: 12 },
  linkText:      { fontSize: 13 },
  linkHighlight: { fontWeight: '700' },
});
