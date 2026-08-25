/**
 * ATHLETIX — Athlete Profile & Onboarding Screen
 * app/(athlete)/profile.tsx
 *
 * Interactive, high-polish onboarding & profile editor.
 * Features:
 *  - Animated Profile Completeness Ring/Meter
 *  - Glowing avatar initial badge
 *  - Tabbed sections: Specs, Sport & Level, Scout Bio & Location
 *  - Interactive stepper buttons & pill selectors
 *  - Instant save feedback toast
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useProfile } from '../../hooks/useProfile';
import { Colors } from '../../constants/colors';
import { AthleteProfileData } from '../../services/userService';

type TabKey = 'specs' | 'sport' | 'bio';

const EXPERIENCE_LEVELS: { key: 'beginner' | 'intermediate' | 'advanced' | 'elite'; label: string; icon: string }[] = [
  { key: 'beginner',     label: 'Beginner',     icon: '🌱' },
  { key: 'intermediate', label: 'Intermediate', icon: '⚡' },
  { key: 'advanced',     label: 'Advanced',     icon: '🔥' },
  { key: 'elite',        label: 'Elite',        icon: '👑' },
];

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, completenessPercent, isLoading, isSaving, saveProfile } = useProfile();

  const [activeTab, setActiveTab] = useState<TabKey>('specs');
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | undefined>();
  const [gender, setGender] = useState<typeof GENDERS[number]>('Male');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [primarySport, setPrimarySport] = useState<'powerlifting' | 'calisthenics'>('powerlifting');
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'elite'>('intermediate');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      const ap = profile.athlete_profile || {};
      setAge(ap.age);
      if (ap.gender) setGender(ap.gender as any);
      setLocation(ap.location || '');
      setBio(ap.bio || '');
      if (ap.primary_sport) setPrimarySport(ap.primary_sport);
      if (ap.height_cm) setHeightCm(Number(ap.height_cm));
      if (ap.weight_kg) setWeightKg(Number(ap.weight_kg));
      if (ap.experience_level) setExperienceLevel(ap.experience_level);
    }
  }, [profile]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(progressAnim, { toValue: completenessPercent / 100, duration: 800, useNativeDriver: false }),
    ]).start();
  }, [completenessPercent]);

  const handleSave = async () => {
    const payload: AthleteProfileData = {
      age: age ? Number(age) : undefined,
      gender,
      location: location.trim(),
      bio: bio.trim(),
      primary_sport: primarySport,
      height_cm: Number(heightCm),
      weight_kg: Number(weightKg),
      experience_level: experienceLevel,
    };

    const success = await saveProfile(name, payload);
    if (success) {
      setToastMsg('Profile updated & synchronized! 🎯');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const getInitials = (str: string) => {
    if (!str) return 'AT';
    const parts = str.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : str.substring(0, 2).toUpperCase();
  };

  const readinessStatus =
    completenessPercent >= 80 ? '🎯 Scout Ready' : completenessPercent >= 50 ? '⚡ Progressing' : '🚀 Setup Required';

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile data...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#070B14', '#0A0E1A', '#0D1525']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

          {/* ── Top Bar ── */}
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back to Dashboard</Text>
            </Pressable>
            <Text style={styles.topTitle}>ATHLETE ONBOARDING</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {/* ── Profile Header Card ── */}
            <Animated.View style={[styles.headerCard, { opacity: fadeAnim }]}>
              <View style={styles.avatarRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{getInitials(name || profile?.name || 'A')}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.athleteName}>{name || 'Athlete'}</Text>
                  <Text style={styles.athleteEmail}>{profile?.email}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.sportBadge}>
                      <Text style={styles.sportBadgeText}>{primarySport.toUpperCase()}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>{readinessStatus}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Completeness Bar */}
              <View style={styles.completenessWrap}>
                <View style={styles.completenessHeader}>
                  <Text style={styles.completenessLabel}>PROFILE COMPLETENESS</Text>
                  <Text style={styles.completenessVal}>{completenessPercent}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
                </View>
              </View>
            </Animated.View>

            {/* ── Tab Switcher ── */}
            <View style={styles.tabContainer}>
              <Pressable
                style={[styles.tabBtn, activeTab === 'specs' && styles.activeTabBtn]}
                onPress={() => setActiveTab('specs')}
              >
                <Text style={[styles.tabText, activeTab === 'specs' && styles.activeTabText]}>📏 Specs</Text>
              </Pressable>
              <Pressable
                style={[styles.tabBtn, activeTab === 'sport' && styles.activeTabBtn]}
                onPress={() => setActiveTab('sport')}
              >
                <Text style={[styles.tabText, activeTab === 'sport' && styles.activeTabText]}>🏋️ Sport & Level</Text>
              </Pressable>
              <Pressable
                style={[styles.tabBtn, activeTab === 'bio' && styles.activeTabBtn]}
                onPress={() => setActiveTab('bio')}
              >
                <Text style={[styles.tabText, activeTab === 'bio' && styles.activeTabText]}>📍 Location & Bio</Text>
              </Pressable>
            </View>

            {/* ── TAB 1: Specs ── */}
            {activeTab === 'specs' && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>Physical & Personal Specifications</Text>

                {/* Display Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>DISPLAY NAME</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Full Name"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                {/* Age */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>AGE (YEARS)</Text>
                  <TextInput
                    style={styles.input}
                    value={age ? String(age) : ''}
                    onChangeText={(v) => setAge(v ? parseInt(v, 10) : undefined)}
                    placeholder="e.g. 21"
                    keyboardType="number-pad"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                {/* Height Stepper */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>HEIGHT: {heightCm} cm</Text>
                  <View style={styles.stepperRow}>
                    <Pressable style={styles.stepBtn} onPress={() => setHeightCm((h) => Math.max(120, h - 1))}>
                      <Text style={styles.stepBtnText}>-</Text>
                    </Pressable>
                    <Text style={styles.stepperValue}>{heightCm} cm</Text>
                    <Pressable style={styles.stepBtn} onPress={() => setHeightCm((h) => Math.min(230, h + 1))}>
                      <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Weight Stepper */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>WEIGHT: {weightKg} kg</Text>
                  <View style={styles.stepperRow}>
                    <Pressable style={styles.stepBtn} onPress={() => setWeightKg((w) => Math.max(35, w - 1))}>
                      <Text style={styles.stepBtnText}>-</Text>
                    </Pressable>
                    <Text style={styles.stepperValue}>{weightKg} kg</Text>
                    <Pressable style={styles.stepBtn} onPress={() => setWeightKg((w) => Math.min(200, w + 1))}>
                      <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Gender */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>GENDER</Text>
                  <View style={styles.pillRow}>
                    {GENDERS.map((g) => (
                      <Pressable
                        key={g}
                        style={[styles.pill, gender === g && styles.activePill]}
                        onPress={() => setGender(g)}
                      >
                        <Text style={[styles.pillText, gender === g && styles.activePillText]}>{g}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* ── TAB 2: Sport & Level ── */}
            {activeTab === 'sport' && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>Primary Sport Discipline</Text>

                <View style={styles.sportCardsRow}>
                  {/* Powerlifting */}
                  <Pressable
                    style={[
                      styles.sportCard,
                      primarySport === 'powerlifting' && styles.activeSportCard,
                    ]}
                    onPress={() => setPrimarySport('powerlifting')}
                  >
                    <Text style={styles.sportIcon}>🏋️</Text>
                    <Text style={styles.sportTitle}>Powerlifting</Text>
                    <Text style={styles.sportDesc}>Squats, Bench Press & Deadlifts evaluated for maximum strength & posture</Text>
                  </Pressable>

                  {/* Calisthenics */}
                  <Pressable
                    style={[
                      styles.sportCard,
                      primarySport === 'calisthenics' && styles.activeSportCard,
                    ]}
                    onPress={() => setPrimarySport('calisthenics')}
                  >
                    <Text style={styles.sportIcon}>🤸</Text>
                    <Text style={styles.sportTitle}>Calisthenics</Text>
                    <Text style={styles.sportDesc}>Push-ups, Pull-ups & Handstands evaluated for endurance & body line control</Text>
                  </Pressable>
                </View>

                <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Experience Level</Text>
                <View style={styles.levelGrid}>
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <Pressable
                      key={lvl.key}
                      style={[
                        styles.levelCard,
                        experienceLevel === lvl.key && styles.activeLevelCard,
                      ]}
                      onPress={() => setExperienceLevel(lvl.key)}
                    >
                      <Text style={styles.levelIcon}>{lvl.icon}</Text>
                      <Text style={styles.levelLabel}>{lvl.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* ── TAB 3: Location & Bio ── */}
            {activeTab === 'bio' && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>Scout Bio & Location</Text>

                {/* Location */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>LOCATION (CITY / STATE)</Text>
                  <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="e.g. Mumbai, Maharashtra"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                {/* Bio */}
                <View style={styles.fieldGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.label}>ATHLETE BIO / GOALS</Text>
                    <Text style={styles.charCount}>{bio.length}/200</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.bioInput]}
                    value={bio}
                    onChangeText={(t) => setBio(t.slice(0, 200))}
                    placeholder="Share your training history, athletic goals, and competition highlights for scouts..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>
            )}

            {/* Toast Feedback */}
            {toastMsg && (
              <View style={styles.toast}>
                <Text style={styles.toastText}>{toastMsg}</Text>
              </View>
            )}

            {/* Save Button */}
            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <LinearGradient
                colors={['#00D4FF', '#0099BB']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                {isSaving ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.saveBtnText}>SAVE & UPDATE PROFILE 🎯</Text>
                )}
              </LinearGradient>
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
  loadingWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background,
  },
  loadingText: { color: Colors.textSecondary, marginTop: 12, fontSize: 13 },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:  { paddingVertical: 4 },
  backText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  topTitle: { color: Colors.textMuted, fontSize: 10, letterSpacing: 2, fontWeight: '700' },

  scroll: { padding: 20, paddingBottom: 40 },

  // Profile Header Card
  headerCard: {
    backgroundColor: Colors.surface, borderRadius: 22, padding: 20,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.18)', marginBottom: 20,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  avatarCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: `${Colors.primary}25`,
    borderWidth: 2, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '900', color: Colors.primary },
  athleteName: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  athleteEmail: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  sportBadge: {
    backgroundColor: `${Colors.secondary}20`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: `${Colors.secondary}50`,
  },
  sportBadgeText: { color: Colors.secondary, fontSize: 10, fontWeight: '800' },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.border,
  },
  statusBadgeText: { color: Colors.textPrimary, fontSize: 10, fontWeight: '600' },

  completenessWrap: { marginTop: 8 },
  completenessHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  completenessLabel: { fontSize: 10, letterSpacing: 1.5, color: Colors.textMuted, fontWeight: '700' },
  completenessVal: { fontSize: 12, fontWeight: '900', color: Colors.primary },
  progressBarTrack: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },

  // Tabs
  tabContainer: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  tabBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  activeTabBtn: { backgroundColor: `${Colors.primary}20`, borderColor: Colors.primary },
  tabText: { fontSize: 11, color: Colors.textMuted, fontWeight: '700' },
  activeTabText: { color: Colors.primary },

  // Section Card
  sectionCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 20,
  },
  sectionHeading: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 10, letterSpacing: 1.5, color: Colors.textMuted, fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    color: Colors.textPrimary, fontSize: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  bioInput: { height: 90, textAlignVertical: 'top' },
  charCount: { fontSize: 10, color: Colors.textMuted },

  stepperRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  stepBtn: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: `${Colors.primary}25`,
    justifyContent: 'center', alignItems: 'center',
  },
  stepBtnText: { color: Colors.primary, fontSize: 20, fontWeight: '900' },
  stepperValue: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: Colors.border,
  },
  activePill: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: 12, color: Colors.textSecondary },
  activePillText: { color: '#000', fontWeight: '800' },

  // Sport selection cards
  sportCardsRow: { gap: 12 },
  sportCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  activeSportCard: {
    borderColor: Colors.secondary, backgroundColor: `${Colors.secondary}12`,
  },
  sportIcon: { fontSize: 28, marginBottom: 4 },
  sportTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  sportDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },

  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  levelCard: {
    width: '47%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  activeLevelCard: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  levelIcon: { fontSize: 22, marginBottom: 4 },
  levelLabel: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },

  toast: {
    backgroundColor: `${Colors.secondary}25`, borderRadius: 12, borderWidth: 1, borderColor: Colors.secondary,
    padding: 14, alignItems: 'center', marginBottom: 16,
  },
  toastText: { color: Colors.secondary, fontSize: 13, fontWeight: '800' },

  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  saveBtnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 2 },
});
