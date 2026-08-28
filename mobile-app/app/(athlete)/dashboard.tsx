/**
 * ATHLETIX — Athlete Dashboard
 * app/(athlete)/dashboard.tsx
 *
 * Connected to:
 * - Live assessment scores
 * - Profile completeness
 * - Video submissions
 * - AI reports
 * - Leaderboard
 * - Official verification requests
 * - Dynamic Light / Dark theme support
 */

import React from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import NotificationBell from '../../components/NotificationBell';
import ThemeToggle from '../../components/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useAssessments } from '../../hooks/useAssessments';
import { useVideos } from '../../hooks/useVideos';
import { useTheme } from '../../hooks/useTheme';

interface StatCardProps {
  value: string;
  label: string;
  accent: string;
  surfaceColor: string;
  labelColor: string;
}

function StatCard({
  value,
  label,
  accent,
  surfaceColor,
  labelColor,
}: StatCardProps) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: surfaceColor,
          borderColor: `${accent}35`,
        },
      ]}
    >
      <Text
        style={[
          styles.statValue,
          { color: accent },
        ]}
      >
        {value}
      </Text>

      <Text style={[styles.statLabel, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

export default function AthleteDashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const { name, logout } = useAuth();
  const { profile, completenessPercent } = useProfile();
  const { assessments, latestAssessment } = useAssessments();
  const { videos } = useVideos();

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const firstName =
    (profile?.name || name)?.split(' ')[0] ?? 'Athlete';

  const bestScore =
    assessments.length > 0
      ? Math.round(
          Math.max(
            ...assessments.map(
              (assessment) => assessment.score || 0,
            ),
          ),
        )
      : null;

  return (
    <LinearGradient
      colors={colors.gradientMain}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                Welcome back,
              </Text>

              <Text style={[styles.name, { color: colors.textPrimary }]}>
                {firstName} 👋
              </Text>

              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor: `${colors.secondary}20`,
                    borderColor: `${colors.secondary}50`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    { color: colors.secondary },
                  ]}
                >
                  🏃 ATHLETE
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <ThemeToggle compact />
              <NotificationBell routeTarget="/(athlete)/notifications" />

              <View style={styles.accountActions}>
                <Pressable
                  onPress={() =>
                    router.push(
                      '/(athlete)/profile' as any,
                    )
                  }
                  style={[
                    styles.profileBtn,
                    {
                      backgroundColor: `${colors.primary}20`,
                      borderColor: `${colors.primary}50`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.profileBtnText,
                      { color: colors.primary },
                    ]}
                  >
                    ⚙️ Profile
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => void logout()}
                  style={[
                    styles.logoutBtn,
                    {
                      borderColor: colors.border,
                      backgroundColor: isDark ? 'transparent' : colors.surfaceElevated,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.logoutText,
                      { color: colors.textMuted },
                    ]}
                  >
                    Sign out
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Profile completeness */}
          <Pressable
            style={({ pressed }) => [
              styles.profileCard,
              {
                backgroundColor: colors.surface,
                borderColor: `${colors.primary}30`,
                shadowColor: colors.cardShadow,
              },
              pressed && styles.pressed,
            ]}
            onPress={() =>
              router.push('/(athlete)/profile' as any)
            }
          >
            <View style={styles.profileCardRow}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.profileCardTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  Profile Completion:{' '}
                  <Text style={{ color: colors.primary }}>
                    {completenessPercent}%
                  </Text>
                </Text>

                <Text
                  style={[
                    styles.profileCardSub,
                    { color: colors.textSecondary },
                  ]}
                >
                  {completenessPercent < 100
                    ? 'Complete your athletic specs and bio to get scouted by officials.'
                    : 'Your athlete profile is fully set up and scout ready!'}
                </Text>
              </View>

              <Text style={[styles.arrowIcon, { color: colors.primary }]}>→</Text>
            </View>

            <View
              style={[
                styles.progressBarTrack,
                { backgroundColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.min(
                      100,
                      Math.max(0, completenessPercent),
                    )}%`,
                  },
                ]}
              />
            </View>
          </Pressable>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard
              value={
                bestScore !== null
                  ? String(bestScore)
                  : '—'
              }
              label="Best AI Score"
              accent={colors.secondary}
              surfaceColor={colors.surface}
              labelColor={colors.textMuted}
            />

            <StatCard
              value={String(assessments.length)}
              label="AI Reports"
              accent={colors.primary}
              surfaceColor={colors.surface}
              labelColor={colors.textMuted}
            />

            <StatCard
              value={String(videos.length)}
              label="Submissions"
              accent={colors.warning}
              surfaceColor={colors.surface}
              labelColor={colors.textMuted}
            />
          </View>

          {/* Action CTAs */}
          <View style={{ gap: 12, marginBottom: 20 }}>
            {/* Live Performance Coach Hero */}
            <Pressable
              style={({ pressed }) => [
                styles.uploadCta,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                router.push('/(athlete)/live' as any)
              }
            >
              <LinearGradient
                colors={
                  isDark
                    ? ['#059669', '#10B981']
                    : ['#047857', '#059669']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.uploadCtaGrad}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Text style={styles.uploadCtaText}>
                    ⚡ Live AI Performance Coach
                  </Text>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900' }}>LIVE WEBRTC</Text>
                  </View>
                </View>

                <Text style={styles.uploadCtaSub}>
                  Real-time camera pose tracking, rep counting & instant coaching
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Video Upload CTA */}
            <Pressable
              style={({ pressed }) => [
                styles.uploadCta,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                router.push('/(athlete)/upload' as any)
              }
            >
              <LinearGradient
                colors={
                  isDark
                    ? ['#00D4FF', '#0099FF']
                    : ['#0284C7', '#0369A1']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.uploadCtaGrad}
              >
                <Text style={styles.uploadCtaText}>
                  🎬 Upload Video for AI Scoring
                </Text>

                <Text style={styles.uploadCtaSub}>
                  MediaPipe BlazePose 33-Keypoint Form and Rep Assessment
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Latest AI report */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              LATEST AI PERFORMANCE REPORT
            </Text>

            {assessments.length > 0 ? (
              <Pressable
                onPress={() =>
                  router.push(
                    '/(athlete)/reports' as any,
                  )
                }
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  View All ({assessments.length}) →
                </Text>
              </Pressable>
            ) : null}
          </View>

          {latestAssessment ? (
            <Pressable
              style={({ pressed }) => [
                styles.latestReportCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.cardShadow,
                },
                pressed && styles.pressed,
              ]}
              onPress={() =>
                router.push('/(athlete)/reports' as any)
              }
            >
              <View style={styles.reportHeaderRow}>
                <View
                  style={[
                    styles.reportScoreCircle,
                    {
                      borderColor: colors.secondary,
                      backgroundColor: `${colors.secondary}15`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.reportScoreVal,
                      { color: colors.secondary },
                    ]}
                  >
                    {Math.round(latestAssessment.score)}
                  </Text>

                  <Text
                    style={[
                      styles.reportScoreLabel,
                      { color: colors.secondary },
                    ]}
                  >
                    AI SCORE
                  </Text>
                </View>

                <View style={styles.reportInformation}>
                  <Text
                    style={[
                      styles.reportExerciseName,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {(
                      latestAssessment.videos?.exercise ||
                      'Exercise'
                    )
                      .toUpperCase()
                      .replace(/_/g, ' ')}
                  </Text>

                  <Text
                    style={[
                      styles.reportSportBadge,
                      { color: colors.primary },
                    ]}
                  >
                    {(
                      latestAssessment.videos?.sport ||
                      'Sport'
                    ).toUpperCase()}
                  </Text>

                  <Text
                    style={[
                      styles.reportDate,
                      { color: colors.textMuted },
                    ]}
                  >
                    {new Date(
                      latestAssessment.created_at,
                    ).toLocaleDateString()}
                  </Text>
                </View>

                <Text style={[styles.arrowIcon, { color: colors.primary }]}>→</Text>
              </View>

              {latestAssessment.strengths?.[0] ? (
                <View
                  style={[
                    styles.snippetRow,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.snippetGreen,
                      { color: colors.secondary },
                    ]}
                  >
                    🟢 {latestAssessment.strengths[0]}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.emptyCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                pressed && styles.pressed,
              ]}
              onPress={() =>
                router.push('/(athlete)/upload' as any)
              }
            >
              <Text style={styles.emptyIcon}>🎯</Text>

              <Text
                style={[
                  styles.emptyTitle,
                  { color: colors.textPrimary },
                ]}
              >
                No AI assessments yet
              </Text>

              <Text
                style={[
                  styles.emptySubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Tap here to upload your first exercise video and get scored by BlazePose AI!
              </Text>
            </Pressable>
          )}

          {/* Leaderboard */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              TALENT LEADERBOARD
            </Text>

            <Pressable
              onPress={() =>
                router.push(
                  '/(athlete)/leaderboard' as any,
                )
              }
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                Open Leaderboard →
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.leaderboardPromoCard,
              {
                backgroundColor: colors.surface,
                borderColor: `${colors.gold}40`,
                shadowColor: colors.cardShadow,
              },
              pressed && styles.pressed,
            ]}
            onPress={() =>
              router.push(
                '/(athlete)/leaderboard' as any,
              )
            }
          >
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(255,215,0,0.12)', 'rgba(255,215,0,0.02)']
                  : ['rgba(217,119,6,0.12)', 'rgba(217,119,6,0.02)']
              }
              style={styles.leaderboardPromoGrad}
            >
              <Text style={styles.trophyIcon}>🏆</Text>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.leaderboardPromoTitle,
                    { color: colors.gold },
                  ]}
                >
                  National Talent Leaderboard
                </Text>

                <Text
                  style={[
                    styles.leaderboardPromoSub,
                    { color: colors.textSecondary },
                  ]}
                >
                  Compare your AI score with athletes across India and get scouted by officials.
                </Text>
              </View>

              <Text style={[styles.arrowGold, { color: colors.gold }]}>→</Text>
            </LinearGradient>
          </Pressable>

          {/* Verification Centre */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              PERFORMANCE VERIFICATION
            </Text>

            <Pressable
              onPress={() =>
                router.push(
                  '/(athlete)/verification' as any,
                )
              }
            >
              <Text style={[styles.verificationLink, { color: colors.secondary }]}>
                View status →
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.verificationCard,
              {
                backgroundColor: colors.surface,
                borderColor: `${colors.secondary}40`,
                shadowColor: colors.cardShadow,
              },
              pressed && styles.pressed,
            ]}
            onPress={() =>
              router.push(
                '/(athlete)/verification' as any,
              )
            }
          >
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(57,255,20,0.12)', 'rgba(0,212,255,0.04)']
                  : ['rgba(5,150,105,0.12)', 'rgba(2,132,199,0.04)']
              }
              style={styles.verificationGradient}
            >
              <View
                style={[
                  styles.verificationIconBox,
                  {
                    backgroundColor: `${colors.secondary}15`,
                    borderColor: `${colors.secondary}30`,
                  },
                ]}
              >
                <Text style={styles.verificationIcon}>🛡️</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.verificationTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  Request Official Verification
                </Text>

                <Text
                  style={[
                    styles.verificationSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Submit supporting documents and track your pending, approved or rejected status.
                </Text>
              </View>

              <Text style={[styles.verificationArrow, { color: colors.secondary }]}>
                →
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 48,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
  },
  name: {
    fontSize: 26,
    fontWeight: '900',
    marginVertical: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  accountActions: {
    gap: 6,
    alignItems: 'flex-end',
  },
  profileBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  profileBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 11,
  },

  profileCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  profileCardSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  arrowIcon: {
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 8,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  uploadCta: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  uploadCtaGrad: {
    padding: 20,
    alignItems: 'center',
  },
  uploadCtaText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  uploadCtaSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 3,
    fontWeight: '600',
    textAlign: 'center',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    flexShrink: 1,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '700',
  },

  latestReportCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  reportHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportScoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportScoreVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  reportScoreLabel: {
    fontSize: 7,
    fontWeight: '800',
  },
  reportInformation: {
    flex: 1,
    marginLeft: 14,
  },
  reportExerciseName: {
    fontSize: 15,
    fontWeight: '900',
  },
  reportSportBadge: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  reportDate: {
    fontSize: 10,
    marginTop: 1,
  },

  snippetRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  snippetGreen: {
    fontSize: 11,
    fontWeight: '600',
  },

  emptyCard: {
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },

  leaderboardPromoCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  leaderboardPromoGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  trophyIcon: {
    fontSize: 28,
  },
  leaderboardPromoTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  leaderboardPromoSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  arrowGold: {
    fontSize: 18,
    fontWeight: '900',
  },

  verificationCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  verificationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 17,
  },
  verificationIconBox: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
  verificationIcon: {
    fontSize: 23,
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  verificationSubtitle: {
    fontSize: 10,
    lineHeight: 15,
  },
  verificationArrow: {
    fontSize: 21,
    fontWeight: '900',
  },
  verificationLink: {
    fontSize: 11,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.82,
  },
});