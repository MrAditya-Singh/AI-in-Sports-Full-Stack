/**
 * ATHLETIX — Signup Screen
 * app/(auth)/signup.tsx
 *
 * Features:
 *  - Animated role selector: 3 glowing cards (Athlete / Official / Admin)
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

import { signup, UserRole } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';

// ── Role card definitions ──────────────────────────────────────────────────────
const ROLES: { key: UserRole; icon: string; label: string; desc: string; glow: string }[] = [
  {
    key:   'athlete',
    icon:  '🏃',
    label: 'Athlete',
    desc:  'Upload videos & get AI-scored assessments',
    glow:  Colors.secondary,   // neon green
  },
  {
    key:   'official',
    icon:  '🏅',
    label: 'Official',
    desc:  'Scout talent & verify performances',
    glow:  Colors.primary,     // electric blue
  },
  {
    key:   'admin',
    icon:  '⚙️',
    label: 'Admin',
    desc:  'Manage the platform & analytics',
    glow:  Colors.warning,     // amber
  },
];

export default function SignupScreen() {
  const router      = useRouter();
  const { refresh } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim   = useRef(new Animated.Value(0)).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const roleAnims  = useRef(ROLES.map(() => new Animated.Value(0))).current;

  React.useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    ROLES.forEach((_, i) => {
      Animated.spring(roleAnims[i], {
        toValue: 1, delay: 150 + i * 100, useNativeDriver: true, tension: 60, friction: 8,
      }).start();
    });
  }, []);

  function onSelectRole(role: UserRole) {
    setSelectedRole(role);
    setError('');
    // Animate form in
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
  const strengthColors = ['#FF4444', '#FFB800', '#39FF14'];
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
    <LinearGradient colors={['#070B14', '#0A0E1A', '#0D1525']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {/* ── Back + Header ── */}
            <Animated.View style={[styles.header, { opacity: headerAnim }]}>
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                <Text style={styles.backText}>← Back</Text>
              </Pressable>
              <Text style={styles.logoText}>ATHLETIX</Text>
              <Text style={styles.headerSub}>Create your account</Text>
            </Animated.View>

            {/* ── Step 1: Role selector ── */}
            <Text style={styles.stepLabel}>STEP 1 — CHOOSE YOUR ROLE</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r, i) => {
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
                        isSelected && {
                          borderColor: r.glow,
                          shadowColor: r.glow,
                          shadowOpacity: 0.5,
                          shadowRadius: 12,
                          elevation: 10,
                          backgroundColor: `${r.glow}18`,
                        },
                      ]}
                      onPress={() => onSelectRole(r.key)}
                    >
                      <Text style={styles.roleIcon}>{r.icon}</Text>
                      <Text style={[styles.roleLabel, isSelected && { color: r.glow }]}>{r.label}</Text>
                      <Text style={styles.roleDesc}>{r.desc}</Text>
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
                  { opacity: formAnim, transform: [{ translateX: shakeAnim }] },
                ]}
              >
                <Text style={styles.stepLabel}>STEP 2 — YOUR DETAILS</Text>

                {/* Name */}
                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>FULL NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor={Colors.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

                {/* Email */}
                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>EMAIL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
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
                    placeholder="Min 8 characters"
                    placeholderTextColor={Colors.textMuted}
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
                            { backgroundColor: i < strength ? strengthColors[strength - 1] : Colors.border },
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
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>⚠  {error}</Text>
                  </View>
                ) : null}

                {/* CTA */}
                <Pressable
                  style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
                  onPress={handleSignup}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#39FF14', '#28CC0F']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    {loading
                      ? <ActivityIndicator color="#000" />
                      : <Text style={styles.btnText}>CREATE ACCOUNT →</Text>
                    }
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}

            {/* Sign in link */}
            <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.linkRow}>
              <Text style={styles.linkText}>
                Already have an account?{'  '}
                <Text style={styles.linkHighlight}>Sign in →</Text>
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
  scroll:   { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 24 },

  header:    { alignItems: 'center', marginBottom: 32 },
  backBtn:   { alignSelf: 'flex-start', marginBottom: 12 },
  backText:  { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  logoText:  {
    fontSize: 32, fontWeight: '900', letterSpacing: 5,
    color: Colors.primary,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  headerSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },

  stepLabel: {
    fontSize: 10, letterSpacing: 2.5, color: Colors.textMuted, fontWeight: '700',
    marginBottom: 14, marginTop: 4,
  },

  // Role cards
  roleRow:     { flexDirection: 'row', gap: 10, marginBottom: 24 },
  roleCardWrap:{ flex: 1 },
  roleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'center',
  },
  roleIcon:    { fontSize: 26, marginBottom: 6 },
  roleLabel:   { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  roleDesc:    { fontSize: 10, color: Colors.textMuted, textAlign: 'center', lineHeight: 14 },
  selectedDot: { width: 7, height: 7, borderRadius: 4, marginTop: 8 },

  // Form card
  formCard: {
    backgroundColor: 'rgba(19, 25, 41, 0.92)',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.12)',
    marginBottom: 16,
  },
  fieldWrap: { marginBottom: 16 },
  label:     { fontSize: 10, letterSpacing: 2, color: Colors.textMuted, marginBottom: 6, fontWeight: '700' },
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

  strengthWrap:  { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  strengthBar:   { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', marginLeft: 4 },

  errorBanner: {
    backgroundColor: 'rgba(255, 68, 68, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: Colors.error, fontSize: 13 },

  btn:         { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  btnPressed:  { opacity: 0.85 },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  btnText:     { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 2 },

  linkRow:       { alignItems: 'center', paddingVertical: 20 },
  linkText:      { color: Colors.textSecondary, fontSize: 14 },
  linkHighlight: { color: Colors.primary, fontWeight: '700' },
});
