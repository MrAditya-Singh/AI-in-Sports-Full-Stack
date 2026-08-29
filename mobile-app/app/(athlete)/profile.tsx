/**
 * ATHLETIX — Athlete Profile & Onboarding Screen
 * app/(athlete)/profile.tsx
 *
 * Interactive, high-polish onboarding & profile editor.
 * Features:
 *  - Animated Profile Completeness Ring & Gauge
 *  - Interactive Avatar Persona Selector (Beast, Thunder, Hawk, Champion, Sprinter, Elite)
 *  - Smart BMI & Body Specs Live Calculator
 *  - Tabbed sections: Vitals & Specs, Sport & Discipline, Scout Bio & Location
 *  - Theme Preferences: System / Dark / Light selector
 *  - Visual Sport cards & Experience level matrix
 *  - Inline form validations matching backend Pydantic rules
 *  - Instant save feedback toast & pull-to-refresh
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import InnovativeIcon from '../../components/InnovativeIcon';
import ThemeToggle from '../../components/ThemeToggle';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../hooks/useTheme';
import { type ThemeMode } from '../../constants/colors';
import { type AthleteProfileData } from '../../services/userService';

type TabKey = 'specs' | 'sport' | 'bio';

const AVATAR_PERSONAS = [
  { id: 'beast', icon: '🦁', label: 'Beast' },
  { id: 'thunder', icon: '⚡', label: 'Thunder' },
  { id: 'hawk', icon: '🦅', label: 'Hawk' },
  { id: 'champion', icon: '🥊', label: 'Champion' },
  { id: 'sprinter', icon: '🏃', label: 'Sprinter' },
  { id: 'titan', icon: '👑', label: 'Titan' },
];

const EXPERIENCE_LEVELS: {
  key: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  label: string;
  sub: string;
  icon: string;
}[] = [
  { key: 'beginner', label: 'Beginner', sub: '< 1 yr exp', icon: '🌱' },
  { key: 'intermediate', label: 'Intermediate', sub: '1–3 yrs exp', icon: '⚡' },
  { key: 'advanced', label: 'Advanced', sub: '3–5 yrs exp', icon: '🔥' },
  { key: 'elite', label: 'Elite / Pro', sub: '5+ yrs & comp', icon: '👑' },
];

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDark, mode: themeMode, setThemeMode } = useTheme();

  const {
    profile,
    completenessPercent,
    isLoading,
    isSaving,
    error: hookError,
    reloadProfile,
    saveProfile,
  } = useProfile();

  const [activeTab, setActiveTab] = useState<TabKey>('specs');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('beast');
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | undefined>(21);
  const [gender, setGender] = useState<(typeof GENDERS)[number]>('Male');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [primarySport, setPrimarySport] = useState<
    'powerlifting' | 'calisthenics'
  >('powerlifting');
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [experienceLevel, setExperienceLevel] = useState<
    'beginner' | 'intermediate' | 'advanced' | 'elite'
  >('intermediate');

  // UI feedback states
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Hydrate fields from profile
  useEffect(() => {
    if (profile) {
      if (profile.name) setName(profile.name);
      const ap = profile.athlete_profile || (profile as any).athlete_profiles;
      if (ap) {
        if (ap.age !== undefined && ap.age !== null) setAge(ap.age);
        if (ap.gender && GENDERS.includes(ap.gender as any))
          setGender(ap.gender as any);
        if (ap.location) setLocation(ap.location);
        if (ap.bio) setBio(ap.bio);
        if (ap.primary_sport === 'powerlifting' || ap.primary_sport === 'calisthenics')
          setPrimarySport(ap.primary_sport);
        if (ap.height_cm) setHeightCm(ap.height_cm);
        if (ap.weight_kg) setWeightKg(ap.weight_kg);
        if (ap.experience_level)
          setExperienceLevel(ap.experience_level as any);
      }
    }
  }, [profile]);

  // Animate progress bar & fade in
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(progressAnim, {
        toValue: completenessPercent / 100,
        friction: 6,
        tension: 40,
        useNativeDriver: false,
      }),
    ]).start();
  }, [completenessPercent, fadeAnim, progressAnim]);

  // Derived BMI & Height conversion
  const bmi = useMemo(() => {
    if (!heightCm || !weightKg) return '—';
    const heightM = heightCm / 100;
    const val = weightKg / (heightM * heightM);
    return isFinite(val) ? val.toFixed(1) : '—';
  }, [heightCm, weightKg]);

  const heightFtIn = useMemo(() => {
    if (!heightCm) return '';
    const totalInches = heightCm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}′ ${inches}″`;
  }, [heightCm]);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!name.trim()) errors.name = 'Full name is required';
    if (age !== undefined && (age < 10 || age > 90))
      errors.age = 'Age must be between 10 and 90';
    if (heightCm < 100 || heightCm > 250)
      errors.height = 'Height must be between 100 cm and 250 cm';
    if (weightKg < 30 || weightKg > 250)
      errors.weight = 'Weight must be between 30 kg and 250 kg';

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 6,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

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

    const success = await saveProfile(name.trim(), payload);
    if (success) {
      setToastMsg('Profile updated & synchronized with cloud! 🎯');
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await reloadProfile();
    setIsRefreshing(false);
  };

  const getInitials = (str: string) => {
    if (!str) return 'AT';
    const parts = str.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : str.substring(0, 2).toUpperCase();
  };

  const currentPersona =
    AVATAR_PERSONAS.find((p) => p.id === selectedAvatar)?.icon || '🦁';

  const readinessStatus =
    completenessPercent >= 90
      ? '🎯 Scout Ready'
      : completenessPercent >= 60
        ? '⚡ Progressing'
        : '🚀 Setup Required';

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (isLoading && !profile) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading athlete profile data...
        </Text>
      </View>
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
          style={{ flex: 1 }}
        >
          {/* ── Top Bar ── */}
          <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
            <Pressable
              onPress={() => router.replace('/(athlete)/dashboard' as never)}
              style={[styles.backBtn, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
            >
              <InnovativeIcon name="arrow-left" size={16} color={colors.textPrimary} />
              <Text style={[styles.backText, { color: colors.textPrimary }]}>
                Dashboard
              </Text>
            </Pressable>

            <Text style={[styles.topTitle, { color: colors.textMuted }]}>
              ATHLETE PROFILE
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ThemeToggle compact />
              <Pressable onPress={onRefresh} style={styles.refreshBtn}>
                <InnovativeIcon name="refresh" size={16} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          >
            {/* ── Hero Profile Card ── */}
            <Animated.View
              style={[
                styles.headerCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: `${colors.primary}30`,
                  shadowColor: colors.cardShadow,
                  opacity: fadeAnim,
                  transform: [{ translateX: shakeAnim }],
                },
              ]}
            >
              <View style={styles.avatarRow}>
                {/* Avatar with Persona Icon */}
                <Pressable
                  style={[
                    styles.avatarCircle,
                    {
                      backgroundColor: `${colors.primary}20`,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setShowAvatarPicker((prev) => !prev)}
                >
                  <Text style={styles.personaAvatarText}>{currentPersona}</Text>
                  <View
                    style={[
                      styles.avatarBadge,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text style={styles.avatarBadgeIcon}>✏️</Text>
                  </View>
                </Pressable>

                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.athleteName, { color: colors.textPrimary }]}>
                      {name || 'Athlete'}
                    </Text>
                    <Text style={[styles.initialsTag, { color: colors.primary }]}>
                      ({getInitials(name || profile?.name || 'A')})
                    </Text>
                  </View>

                  <Text style={[styles.athleteEmail, { color: colors.textSecondary }]}>
                    {profile?.email}
                  </Text>

                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.sportBadge,
                        {
                          backgroundColor: `${colors.secondary}20`,
                          borderColor: `${colors.secondary}50`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sportBadgeText,
                          { color: colors.secondary },
                        ]}
                      >
                        {primarySport === 'powerlifting'
                          ? '🏋️ POWERLIFTING'
                          : '🤸 CALISTHENICS'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {readinessStatus}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Persona Selector Modal / Expand */}
              {showAvatarPicker && (
                <View
                  style={[
                    styles.avatarPickerWrap,
                    {
                      backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.03)',
                      borderColor: `${colors.primary}35`,
                    },
                  ]}
                >
                  <Text style={[styles.avatarPickerTitle, { color: colors.primary }]}>
                    CHOOSE ATHLETE SPIRIT PERSONA
                  </Text>
                  <View style={styles.avatarGrid}>
                    {AVATAR_PERSONAS.map((p) => (
                      <Pressable
                        key={p.id}
                        style={[
                          styles.avatarOption,
                          {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceElevated,
                            borderColor: colors.border,
                          },
                          selectedAvatar === p.id && [
                            styles.activeAvatarOption,
                            {
                              borderColor: colors.primary,
                              backgroundColor: `${colors.primary}25`,
                            },
                          ],
                        ]}
                        onPress={() => {
                          setSelectedAvatar(p.id);
                          setShowAvatarPicker(false);
                        }}
                      >
                        <Text style={styles.avatarOptionEmoji}>{p.icon}</Text>
                        <Text
                          style={[
                            styles.avatarOptionLabel,
                            { color: colors.textSecondary },
                            selectedAvatar === p.id && { color: colors.primary },
                          ]}
                        >
                          {p.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Completeness Bar */}
              <View style={styles.completenessWrap}>
                <View style={styles.completenessHeader}>
                  <Text style={[styles.completenessLabel, { color: colors.textMuted }]}>
                    PROFILE COMPLETENESS FOR SCOUTING
                  </Text>
                  <Text style={[styles.completenessVal, { color: colors.primary }]}>
                    {completenessPercent}%
                  </Text>
                </View>

                <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: colors.primary,
                        width: progressWidth,
                      },
                    ]}
                  />
                </View>

                <Text style={[styles.completenessSubtext, { color: colors.textSecondary }]}>
                  {completenessPercent < 100
                    ? 'Fill out all specs, sport tiers, and your bio to unlock full official scouting consideration.'
                    : '🎉 Your athlete profile is 100% complete and ready for national talent scouts!'}
                </Text>
              </View>
            </Animated.View>

            {/* ── Key Metrics Overview ── */}
            <View
              style={[
                styles.insightCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.cardShadow,
                },
              ]}
            >
              <View style={styles.insightCol}>
                <Text style={[styles.insightLabel, { color: colors.textMuted }]}>
                  BODY MASS INDEX
                </Text>
                <Text style={[styles.insightVal, { color: colors.textPrimary }]}>
                  {bmi}
                </Text>
                <Text style={styles.insightSubBadge}>
                  {parseFloat(bmi) < 18.5
                    ? 'Lean'
                    : parseFloat(bmi) < 25
                      ? 'Optimal'
                      : parseFloat(bmi) < 30
                        ? 'Athletic'
                        : 'Power'}
                </Text>
              </View>

              <View style={[styles.insightDivider, { backgroundColor: colors.border }]} />

              <View style={styles.insightCol}>
                <Text style={[styles.insightLabel, { color: colors.textMuted }]}>
                  HEIGHT / WEIGHT
                </Text>
                <Text style={[styles.insightVal, { color: colors.textPrimary }]}>
                  {heightCm} <Text style={{ fontSize: 11 }}>cm</Text> / {weightKg}{' '}
                  <Text style={{ fontSize: 11 }}>kg</Text>
                </Text>
                <Text style={[styles.insightSub, { color: colors.textSecondary }]}>
                  {heightFtIn}
                </Text>
              </View>

              <View style={[styles.insightDivider, { backgroundColor: colors.border }]} />

              <View style={styles.insightCol}>
                <Text style={[styles.insightLabel, { color: colors.textMuted }]}>
                  EXPERIENCE TIER
                </Text>
                <Text
                  style={[
                    styles.insightVal,
                    { fontSize: 14, color: colors.secondary },
                  ]}
                >
                  {experienceLevel.toUpperCase()}
                </Text>
                <Text style={[styles.insightSub, { color: colors.textSecondary }]}>
                  {primarySport === 'powerlifting' ? 'Barbell' : 'Bodyweight'}
                </Text>
              </View>
            </View>

            {/* ── Tabbed Section Switcher ── */}
            <View style={styles.tabContainer}>
              <Pressable
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  activeTab === 'specs' && [
                    styles.activeTabBtn,
                    {
                      backgroundColor: `${colors.primary}20`,
                      borderColor: colors.primary,
                    },
                  ],
                ]}
                onPress={() => setActiveTab('specs')}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: colors.textMuted },
                    activeTab === 'specs' && [
                      styles.activeTabText,
                      { color: colors.primary },
                    ],
                  ]}
                >
                  📊 Vitals & Specs
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  activeTab === 'sport' && [
                    styles.activeTabBtn,
                    {
                      backgroundColor: `${colors.primary}20`,
                      borderColor: colors.primary,
                    },
                  ],
                ]}
                onPress={() => setActiveTab('sport')}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: colors.textMuted },
                    activeTab === 'sport' && [
                      styles.activeTabText,
                      { color: colors.primary },
                    ],
                  ]}
                >
                  🏆 Sport & Level
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  activeTab === 'bio' && [
                    styles.activeTabBtn,
                    {
                      backgroundColor: `${colors.primary}20`,
                      borderColor: colors.primary,
                    },
                  ],
                ]}
                onPress={() => setActiveTab('bio')}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: colors.textMuted },
                    activeTab === 'bio' && [
                      styles.activeTabText,
                      { color: colors.primary },
                    ],
                  ]}
                >
                  📍 Scout Bio
                </Text>
              </Pressable>
            </View>

            {/* ── TAB 1: Specs & Vitals ── */}
            {activeTab === 'specs' && (
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                  Biometric Specifications
                </Text>

                {/* Name */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>
                      DISPLAY NAME
                    </Text>
                    {formErrors.name && (
                      <Text style={[styles.fieldError, { color: colors.error }]}>
                        {formErrors.name}
                      </Text>
                    )}
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceElevated,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                      formErrors.name ? { borderColor: colors.error } : null,
                    ]}
                    value={name}
                    onChangeText={(val) => {
                      setName(val);
                      if (formErrors.name) {
                        setFormErrors((prev) => ({ ...prev, name: '' }));
                      }
                    }}
                    placeholder="Enter athlete full name"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* Age */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>
                      AGE (10 – 90 YEARS)
                    </Text>
                    {formErrors.age && (
                      <Text style={[styles.fieldError, { color: colors.error }]}>
                        {formErrors.age}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.stepperRow,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Pressable
                      style={[styles.stepBtn, { backgroundColor: `${colors.primary}25` }]}
                      onPress={() =>
                        setAge((prev) => Math.max(10, (prev || 21) - 1))
                      }
                    >
                      <Text style={[styles.stepBtnText, { color: colors.primary }]}>-</Text>
                    </Pressable>
                    <TextInput
                      style={[styles.stepperInput, { color: colors.textPrimary }]}
                      value={age ? String(age) : ''}
                      onChangeText={(v) => {
                        const parsed = parseInt(v, 10);
                        setAge(isNaN(parsed) ? undefined : parsed);
                        if (formErrors.age) {
                          setFormErrors((prev) => ({ ...prev, age: '' }));
                        }
                      }}
                      placeholder="21"
                      keyboardType="number-pad"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Pressable
                      style={[styles.stepBtn, { backgroundColor: `${colors.primary}25` }]}
                      onPress={() =>
                        setAge((prev) => Math.min(90, (prev || 21) + 1))
                      }
                    >
                      <Text style={[styles.stepBtnText, { color: colors.primary }]}>+</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Height Stepper */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>
                      HEIGHT: {heightCm} cm ({heightFtIn})
                    </Text>
                    {formErrors.height && (
                      <Text style={[styles.fieldError, { color: colors.error }]}>
                        {formErrors.height}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.stepperRow,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Pressable
                      style={[styles.stepBtn, { backgroundColor: `${colors.primary}25` }]}
                      onPress={() => setHeightCm((h) => Math.max(100, h - 1))}
                    >
                      <Text style={[styles.stepBtnText, { color: colors.primary }]}>-1</Text>
                    </Pressable>

                    <Text style={[styles.stepperValue, { color: colors.textPrimary }]}>
                      {heightCm} cm
                    </Text>

                    <Pressable
                      style={[styles.stepBtn, { backgroundColor: `${colors.primary}25` }]}
                      onPress={() => setHeightCm((h) => Math.min(250, h + 1))}
                    >
                      <Text style={[styles.stepBtnText, { color: colors.primary }]}>+1</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Weight Stepper */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>
                      BODY WEIGHT: {weightKg} kg (
                      {Math.round(weightKg * 2.20462)} lbs)
                    </Text>
                    {formErrors.weight && (
                      <Text style={[styles.fieldError, { color: colors.error }]}>
                        {formErrors.weight}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.stepperRow,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Pressable
                      style={[styles.stepBtn, { backgroundColor: `${colors.primary}25` }]}
                      onPress={() => setWeightKg((w) => Math.max(30, w - 1))}
                    >
                      <Text style={[styles.stepBtnText, { color: colors.primary }]}>-1</Text>
                    </Pressable>

                    <Text style={[styles.stepperValue, { color: colors.textPrimary }]}>
                      {weightKg} kg
                    </Text>

                    <Pressable
                      style={[styles.stepBtn, { backgroundColor: `${colors.primary}25` }]}
                      onPress={() => setWeightKg((w) => Math.min(250, w + 1))}
                    >
                      <Text style={[styles.stepBtnText, { color: colors.primary }]}>+1</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Gender */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    GENDER CATEGORY
                  </Text>
                  <View style={styles.pillRow}>
                    {GENDERS.map((g) => (
                      <Pressable
                        key={g}
                        style={[
                          styles.pill,
                          {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.surfaceElevated,
                            borderColor: colors.border,
                          },
                          gender === g && [
                            styles.activePill,
                            {
                              backgroundColor: colors.primary,
                              borderColor: colors.primary,
                            },
                          ],
                        ]}
                        onPress={() => setGender(g)}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            { color: colors.textSecondary },
                            gender === g && [
                              styles.activePillText,
                              { color: colors.textInverse },
                            ],
                          ]}
                        >
                          {g}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* ── TAB 2: Sport & Level ── */}
            {activeTab === 'sport' && (
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                  Primary Sport Discipline
                </Text>

                <View style={styles.sportCardsRow}>
                  {/* Powerlifting */}
                  <Pressable
                    style={[
                      styles.sportCard,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                      primarySport === 'powerlifting' && [
                        styles.activeSportCard,
                        {
                          borderColor: colors.secondary,
                          backgroundColor: `${colors.secondary}12`,
                        },
                      ],
                    ]}
                    onPress={() => setPrimarySport('powerlifting')}
                  >
                    <View style={styles.sportHeaderRow}>
                      <Text style={styles.sportIcon}>🏋️</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sportTitle, { color: colors.textPrimary }]}>
                          Powerlifting
                        </Text>
                        <Text style={[styles.sportDesc, { color: colors.textSecondary }]}>
                          Raw Strength & Barbell Mechanics
                        </Text>
                      </View>
                      {primarySport === 'powerlifting' && (
                        <Text style={[styles.sportCheck, { color: colors.secondary }]}>
                          ✓ SELECTED
                        </Text>
                      )}
                    </View>

                    <View style={styles.exerciseTagRow}>
                      <Text style={[styles.exerciseTag, { color: colors.textMuted, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                        • Barbell Squats
                      </Text>
                      <Text style={[styles.exerciseTag, { color: colors.textMuted, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                        • Bench Press
                      </Text>
                      <Text style={[styles.exerciseTag, { color: colors.textMuted, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                        • Deadlifts
                      </Text>
                    </View>
                  </Pressable>

                  {/* Calisthenics */}
                  <Pressable
                    style={[
                      styles.sportCard,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                      primarySport === 'calisthenics' && [
                        styles.activeSportCard,
                        {
                          borderColor: colors.secondary,
                          backgroundColor: `${colors.secondary}12`,
                        },
                      ],
                    ]}
                    onPress={() => setPrimarySport('calisthenics')}
                  >
                    <View style={styles.sportHeaderRow}>
                      <Text style={styles.sportIcon}>🤸</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sportTitle, { color: colors.textPrimary }]}>
                          Calisthenics
                        </Text>
                        <Text style={[styles.sportDesc, { color: colors.textSecondary }]}>
                          Bodyweight Mastery & Control
                        </Text>
                      </View>
                      {primarySport === 'calisthenics' && (
                        <Text style={[styles.sportCheck, { color: colors.secondary }]}>
                          ✓ SELECTED
                        </Text>
                      )}
                    </View>

                    <View style={styles.exerciseTagRow}>
                      <Text style={[styles.exerciseTag, { color: colors.textMuted, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                        • Strict Push-ups
                      </Text>
                      <Text style={[styles.exerciseTag, { color: colors.textMuted, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                        • Strict Pull-ups
                      </Text>
                      <Text style={[styles.exerciseTag, { color: colors.textMuted, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                        • Handstand Holds
                      </Text>
                    </View>
                  </Pressable>
                </View>

                <Text style={[styles.sectionHeading, { marginTop: 24, color: colors.textPrimary }]}>
                  Experience Level & Competition Tier
                </Text>
                <View style={styles.levelGrid}>
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <Pressable
                      key={lvl.key}
                      style={[
                        styles.levelCard,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surfaceElevated,
                          borderColor: colors.border,
                        },
                        experienceLevel === lvl.key && [
                          styles.activeLevelCard,
                          {
                            borderColor: colors.primary,
                            backgroundColor: `${colors.primary}15`,
                          },
                        ],
                      ]}
                      onPress={() => setExperienceLevel(lvl.key)}
                    >
                      <Text style={styles.levelIcon}>{lvl.icon}</Text>
                      <Text style={[styles.levelLabel, { color: colors.textPrimary }]}>
                        {lvl.label}
                      </Text>
                      <Text style={[styles.levelSub, { color: colors.textMuted }]}>
                        {lvl.sub}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* ── TAB 3: Location & Bio ── */}
            {activeTab === 'bio' && (
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                  Scout Bio & Location
                </Text>

                {/* Location */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    LOCATION (CITY, STATE / REGION)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceElevated,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="e.g. Mumbai, Maharashtra"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* Bio */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>
                      ATHLETE BIO & GOALS
                    </Text>
                    <Text style={[styles.charCount, { color: colors.textMuted }]}>
                      {bio.length}/200
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      styles.bioInput,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceElevated,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    value={bio}
                    onChangeText={(t) => setBio(t.slice(0, 200))}
                    placeholder="Share your personal best lifts/reps, athletic goals, training years, and competition highlights for verified scouts..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View
                  style={[
                    styles.scoutHintBox,
                    {
                      backgroundColor: `${colors.primary}12`,
                      borderColor: `${colors.primary}25`,
                    },
                  ]}
                >
                  <Text style={styles.scoutHintIcon}>💡</Text>
                  <Text style={[styles.scoutHintText, { color: colors.textSecondary }]}>
                    Officials and Talent Scouts filter athletes by sport discipline, location, and completeness when offering trials.
                  </Text>
                </View>
              </View>
            )}

            {/* ── Theme Appearance Preferences ── */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.cardShadow,
                },
              ]}
            >
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                🎨 App Theme & Appearance
              </Text>
              <Text style={[styles.themeDescription, { color: colors.textSecondary }]}>
                Choose your preferred interface theme. Changes take effect instantly across all screens.
              </Text>

              <View style={styles.themeSelectorRow}>
                {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => {
                  const isSelected = themeMode === mode;
                  const icon = mode === 'dark' ? '🌙' : mode === 'light' ? '☀️' : '⚙️';
                  const label = mode === 'dark' ? 'Dark' : mode === 'light' ? 'Light' : 'Auto';

                  return (
                    <Pressable
                      key={mode}
                      style={[
                        styles.themeModeBtn,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceElevated,
                          borderColor: colors.border,
                        },
                        isSelected && [
                          styles.activeThemeModeBtn,
                          {
                            borderColor: colors.primary,
                            backgroundColor: `${colors.primary}20`,
                          },
                        ],
                      ]}
                      onPress={() => void setThemeMode(mode)}
                    >
                      <Text style={styles.themeModeIcon}>{icon}</Text>
                      <Text
                        style={[
                          styles.themeModeLabel,
                          { color: colors.textSecondary },
                          isSelected && { color: colors.primary, fontWeight: '900' },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Error Banner */}
            {hookError ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: `${colors.error}15`,
                    borderColor: `${colors.error}35`,
                  },
                ]}
              >
                <Text style={[styles.errorBannerText, { color: colors.error }]}>
                  ⚠ {hookError}
                </Text>
              </View>
            ) : null}

            {/* Toast Feedback */}
            {toastMsg && (
              <View
                style={[
                  styles.toast,
                  {
                    backgroundColor: `${colors.secondary}25`,
                    borderColor: colors.secondary,
                  },
                ]}
              >
                <Text style={[styles.toastText, { color: colors.secondary }]}>
                  {toastMsg}
                </Text>
              </View>
            )}

            {/* Save Button */}
            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && { opacity: 0.85 },
                isSaving && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <LinearGradient
                colors={
                  isDark
                    ? ['#00D4FF', '#0099BB']
                    : ['#0284C7', '#0369A1']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    SAVE & SYNCHRONIZE PROFILE 🎯
                  </Text>
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
  safe: { flex: 1 },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 13 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: 13, fontWeight: '700' },
  topTitle: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
  },
  refreshBtn: { padding: 4 },
  refreshIcon: { fontSize: 16 },

  scroll: { padding: 20, paddingBottom: 40 },

  // Hero Card
  headerCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  personaAvatarText: { fontSize: 32 },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 10,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderWidth: 1,
  },
  avatarBadgeIcon: { fontSize: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  athleteName: { fontSize: 20, fontWeight: '900' },
  initialsTag: { fontSize: 12, fontWeight: '800' },
  athleteEmail: { fontSize: 12, marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sportBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  sportBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Avatar picker
  avatarPickerWrap: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  avatarPickerTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  avatarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  avatarOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  activeAvatarOption: {},
  avatarOptionEmoji: { fontSize: 22, marginBottom: 2 },
  avatarOptionLabel: {
    fontSize: 9,
    fontWeight: '700',
  },

  // Completeness Bar
  completenessWrap: { marginTop: 4 },
  completenessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  completenessLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  completenessVal: { fontSize: 13, fontWeight: '900' },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  completenessSubtext: {
    fontSize: 11,
    marginTop: 8,
    lineHeight: 15,
  },

  // Insights Card
  insightCard: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 18,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  insightCol: { flex: 1, alignItems: 'center' },
  insightLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  insightVal: {
    fontSize: 17,
    fontWeight: '900',
    marginVertical: 1,
  },
  insightSub: { fontSize: 10 },
  insightSubBadge: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 1,
  },
  insightDivider: { width: 1, height: 36 },

  // Tabs
  tabContainer: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  activeTabBtn: {},
  tabText: { fontSize: 11, fontWeight: '700' },
  activeTabText: {},

  // Section Card
  sectionCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 14,
  },
  themeDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeModeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  activeThemeModeBtn: {},
  themeModeIcon: {
    fontSize: 20,
  },
  themeModeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  fieldGroup: { marginBottom: 18 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  fieldError: { fontSize: 10, fontWeight: '700' },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bioInput: { height: 95, textAlignVertical: 'top' },
  charCount: { fontSize: 10 },

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepperInput: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 60,
  },
  stepBtn: {
    width: 44,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: { fontSize: 16, fontWeight: '900' },
  stepperValue: { fontSize: 16, fontWeight: '900' },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  activePill: {},
  pillText: { fontSize: 12, fontWeight: '600' },
  activePillText: { fontWeight: '900' },

  // Sport selection cards
  sportCardsRow: { gap: 12 },
  sportCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
  },
  activeSportCard: {},
  sportHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sportIcon: { fontSize: 30 },
  sportTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  sportDesc: { fontSize: 11 },
  sportCheck: { fontSize: 10, fontWeight: '900' },
  exerciseTagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  exerciseTag: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: '600',
  },

  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  levelCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  activeLevelCard: {},
  levelIcon: { fontSize: 24, marginBottom: 4 },
  levelLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  levelSub: { fontSize: 10 },

  scoutHintBox: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  scoutHintIcon: { fontSize: 18 },
  scoutHintText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },

  errorBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  errorBannerText: { fontSize: 13, fontWeight: '700' },

  toast: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  toastText: { fontSize: 13, fontWeight: '800' },

  saveBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 2,
  },
});
