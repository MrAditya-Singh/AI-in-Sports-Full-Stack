/**
 * ATHLETIX — Athlete Dashboard (Minimalist Dual-Tone Stream Architecture)
 * app/(athlete)/dashboard.tsx
 *
 * Design:
 * - Pure Minimalist Swiss layout (No Bento Grids, clean vertical flow)
 * - Exclusive Dual-Tone Light Palette (Ivory Cream #F7F4EE & Jet Obsidian #111111)
 * - Innovative Vector Icons powered by InnovativeIcon (@expo/vector-icons)
 * - Tactile, sleek full-width stream cards
 */

import React, { useMemo } from 'react';
import {
  Animated,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import MinimalCard from '../../components/MinimalCard';
import InnovativeIcon from '../../components/InnovativeIcon';
import NeomorphicButton from '../../components/NeomorphicButton';
import NotificationBell from '../../components/NotificationBell';
import ThemeToggle from '../../components/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useAssessments } from '../../hooks/useAssessments';
import { useVideos } from '../../hooks/useVideos';
import { useTheme } from '../../hooks/useTheme';

export default function AthleteDashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const { name, logout } = useAuth();
  const { profile, completenessPercent, reloadProfile } = useProfile();
  const { assessments, latestAssessment, refreshAssessments } = useAssessments();
  const { videos, refreshVideos, removeVideo } = useVideos();

  const [refreshing, setRefreshing] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      reloadProfile?.(),
      refreshAssessments?.(),
      refreshVideos?.(),
    ]);
    setRefreshing(false);
  }, [reloadProfile, refreshAssessments, refreshVideos]);

  const handleRemoveAttempt = React.useCallback((videoId: string) => {
    Alert.alert(
      'Remove Attempt',
      'Are you sure you want to remove this attempt from your logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeVideo(videoId);
            await refreshVideos();
          },
        },
      ],
    );
  }, [removeVideo, refreshVideos]);

  const firstName = useMemo(() => {
    return (profile?.name || name)?.split(' ')[0] ?? 'Athlete';
  }, [profile?.name, name]);

  const bestScore = useMemo(() => {
    if (assessments.length === 0) return null;
    return Math.round(
      Math.max(...assessments.map((a) => a.score || 0)),
    );
  }, [assessments]);

  const recentLogs = useMemo(() => {
    return (videos || []).slice(0, 5);
  }, [videos]);

  return (
    <LinearGradient colors={colors.gradientMain} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* ── Top Header ── */}
          <View style={styles.headerRow}>
            <View style={styles.userInfo}>
              <View style={styles.tagRow}>
                <InnovativeIcon name="sparkles" size={14} color={colors.textSecondary} />
                <Text style={[styles.welcomeLabel, { color: colors.textSecondary }]}>
                  ATHLETIX OS
                </Text>
              </View>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>
                {firstName}
              </Text>
              <View
                style={[
                  styles.verifiedBadge,
                  {
                    backgroundColor: isDark ? 'rgba(57, 255, 20, 0.12)' : '#111111',
                    borderColor: isDark ? 'rgba(57, 255, 20, 0.35)' : '#111111',
                  },
                ]}
              >
                <InnovativeIcon
                  name="shield-check"
                  size={12}
                  color={isDark ? colors.secondary : '#F7F4EE'}
                />
                <Text
                  style={[
                    styles.verifiedBadgeText,
                    { color: isDark ? colors.secondary : '#F7F4EE' },
                  ]}
                >
                  VERIFIED ATHLETE · LEVEL 2
                </Text>
              </View>
            </View>

            <View style={styles.headerControls}>
              <ThemeToggle compact />
              <NotificationBell routeTarget="/(athlete)/notifications" />
              <Pressable
                onPress={() => router.push('/(athlete)/profile' as any)}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                    borderColor: colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <InnovativeIcon name="settings" size={17} color={colors.textPrimary} />
              </Pressable>
              <Pressable
                onPress={() => void logout()}
                style={({ pressed }) => [
                  styles.signOutBtn,
                  {
                    backgroundColor: isDark ? 'transparent' : '#FFFFFF',
                    borderColor: colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <InnovativeIcon name="logout" size={14} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          {/* ── Hero Feature Card (Solid Dark Architectural Block) ── */}
          <MinimalCard
            variant={isDark ? 'elevated' : 'darkBlock'}
            onPress={() => router.push('/(athlete)/live' as any)}
            contentStyle={{ padding: 22 }}
          >
            <View style={styles.heroHeaderRow}>
              <View style={styles.liveIndicator}>
                <View style={[styles.pulseDot, { backgroundColor: isDark ? '#39FF14' : '#F7F4EE' }]} />
                <Text
                  style={[
                    styles.liveTagText,
                    { color: isDark ? colors.secondary : '#F7F4EE' },
                  ]}
                >
                  REALTIME WEBRTC 60 FPS
                </Text>
              </View>
              <InnovativeIcon
                name="arrow-up-right"
                size={18}
                color={isDark ? colors.primary : '#F7F4EE'}
              />
            </View>

            <Text style={[styles.heroMainTitle, { color: isDark ? colors.textPrimary : '#F7F4EE' }]}>
              Live AI Performance Coach
            </Text>
            <Text style={[styles.heroMainSub, { color: isDark ? colors.textMuted : 'rgba(247, 244, 238, 0.7)' }]}>
              Full-body pose estimation, automatic rep cadence counting, and live form correction.
            </Text>

            <View style={styles.heroFooter}>
              <View style={styles.heroStatItem}>
                <InnovativeIcon name="cpu" size={14} color={isDark ? colors.primary : '#F7F4EE'} />
                <Text style={[styles.heroStatText, { color: isDark ? colors.textSecondary : '#F7F4EE' }]}>
                  BlazePose 33-Keypoint
                </Text>
              </View>
              <View style={styles.heroStatItem}>
                <InnovativeIcon name="activity" size={14} color={isDark ? colors.primary : '#F7F4EE'} />
                <Text style={[styles.heroStatText, { color: isDark ? colors.textSecondary : '#F7F4EE' }]}>
                  Zero Latency
                </Text>
              </View>
            </View>
          </MinimalCard>

          {/* ── Metric Performance Stream (Horizontal / Vertical flow, No Bento) ── */}
          <View style={styles.metricsStreamRow}>
            {/* Metric 1: Best AI Score */}
            <MinimalCard
              style={{ flex: 1, marginRight: 8 }}
              contentStyle={{ padding: 16 }}
              onPress={() => router.push('/(athlete)/reports' as any)}
            >
              <View style={styles.metricCardHeader}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  BEST FORM SCORE
                </Text>
                <InnovativeIcon name="target" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.metricBigVal, { color: colors.textPrimary }]}>
                {bestScore !== null ? `${bestScore}` : '—'}
              </Text>
              <Text style={[styles.metricSub, { color: colors.textSecondary }]}>
                {bestScore ? 'Top Form Quality' : 'No logs recorded'}
              </Text>
            </MinimalCard>

            {/* Metric 2: AI Reports */}
            <MinimalCard
              style={{ flex: 1, marginLeft: 8 }}
              contentStyle={{ padding: 16 }}
              onPress={() => router.push('/(athlete)/reports' as any)}
            >
              <View style={styles.metricCardHeader}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  AI ASSESSMENTS
                </Text>
                <InnovativeIcon name="bar-chart" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.metricBigVal, { color: colors.textPrimary }]}>
                {assessments.length}
              </Text>
              <Text style={[styles.metricSub, { color: colors.textSecondary }]}>
                {latestAssessment ? 'Report Available' : 'Upload to generate'}
              </Text>
            </MinimalCard>
          </View>

          {/* ── Profile Readiness Bar ── */}
          <MinimalCard
            onPress={() => router.push('/(athlete)/profile' as any)}
            contentStyle={{ padding: 18 }}
          >
            <View style={styles.profileRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <InnovativeIcon name="user" size={14} color={colors.primary} />
                  <Text style={[styles.profileProgressTitle, { color: colors.textPrimary }]}>
                    Scout Profile Readiness · {completenessPercent}%
                  </Text>
                </View>
                <Text style={[styles.profileProgressSub, { color: colors.textSecondary }]}>
                  {completenessPercent < 100
                    ? 'Complete athlete bio and biometric metrics to get verified.'
                    : 'Profile is fully optimized for scout evaluation.'}
                </Text>
              </View>
              <InnovativeIcon name="arrow-right" size={16} color={colors.textPrimary} />
            </View>

            <View
              style={[
                styles.track,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EFECE4' },
              ]}
            >
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.min(100, Math.max(8, completenessPercent))}%`,
                  },
                ]}
              />
            </View>
          </MinimalCard>

          {/* ── Primary Action Stream ── */}
          <Text style={[styles.streamSectionHeader, { color: colors.textMuted }]}>
            ATHLETIC ACTIONS
          </Text>

          <MinimalCard
            onPress={() => router.push('/(athlete)/upload' as any)}
            contentStyle={{ padding: 18 }}
          >
            <View style={styles.actionCardInner}>
              <View
                style={[
                  styles.actionIconPill,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFECE4' },
                ]}
              >
                <InnovativeIcon name="video" size={20} color={colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionHeading, { color: colors.textPrimary }]}>
                  Upload Attempt for AI Scoring
                </Text>
                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                  Submit video for MediaPipe biomechanics and rep validation.
                </Text>
              </View>
              <InnovativeIcon name="arrow-right" size={16} color={colors.textMuted} />
            </View>
          </MinimalCard>

          <MinimalCard
            onPress={() => router.push('/(athlete)/verification' as any)}
            contentStyle={{ padding: 18 }}
          >
            <View style={styles.actionCardInner}>
              <View
                style={[
                  styles.actionIconPill,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFECE4' },
                ]}
              >
                <InnovativeIcon name="shield-check" size={20} color={colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionHeading, { color: colors.textPrimary }]}>
                  Official Performance Verification
                </Text>
                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                  Submit attempts with official certificates for trusted badges.
                </Text>
              </View>
              <InnovativeIcon name="arrow-right" size={16} color={colors.textMuted} />
            </View>
          </MinimalCard>

          <MinimalCard
            onPress={() => router.push('/(athlete)/leaderboard' as any)}
            contentStyle={{ padding: 18 }}
          >
            <View style={styles.actionCardInner}>
              <View
                style={[
                  styles.actionIconPill,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFECE4' },
                ]}
              >
                <InnovativeIcon name="trophy" size={20} color={colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionHeading, { color: colors.textPrimary }]}>
                  National Talent Leaderboard
                </Text>
                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                  Explore nationwide athlete rankings, verified scores, and top performers.
                </Text>
              </View>
              <InnovativeIcon name="arrow-right" size={16} color={colors.textMuted} />
            </View>
          </MinimalCard>

          {/* ── Recent 5 Upload Logs Stream ── */}
          <View style={styles.recentSectionHeaderRow}>
            <Text style={[styles.streamSectionHeader, { color: colors.textMuted }]}>
              RECENT ATTEMPTS ({recentLogs.length})
            </Text>
            {videos.length > 0 && (
              <Pressable onPress={() => router.push('/(athlete)/reports' as any)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[styles.viewAllText, { color: colors.textPrimary }]}>
                    All ({videos.length})
                  </Text>
                  <InnovativeIcon name="arrow-right" size={13} color={colors.textPrimary} />
                </View>
              </Pressable>
            )}
          </View>

          {recentLogs.length === 0 ? (
            <MinimalCard contentStyle={{ padding: 24, alignItems: 'center' }}>
              <InnovativeIcon name="camera" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No Video Attempts Uploaded Yet
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Record or upload your Squat, Push-up, or Curl to start AI scoring.
              </Text>
              <NeomorphicButton
                title="UPLOAD FIRST ATTEMPT"
                icon={<InnovativeIcon name="video" size={16} color={isDark ? '#FFFFFF' : '#F7F4EE'} />}
                onPress={() => router.push('/(athlete)/upload' as any)}
                style={{ marginTop: 16 }}
              />
            </MinimalCard>
          ) : (
            <View style={{ gap: 8, marginBottom: 24 }}>
              {recentLogs.map((item) => (
                <MinimalCard key={item.id} contentStyle={{ padding: 14 }}>
                  <View style={styles.logRow}>
                    <View
                      style={[
                        styles.logIconBox,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFECE4' },
                      ]}
                    >
                      <InnovativeIcon
                        name={item.exercise?.includes('squat') ? 'dumbell' : 'activity'}
                        size={18}
                        color={colors.textPrimary}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.logTitle, { color: colors.textPrimary }]}>
                          {(item.exercise || 'Performance').replace(/_/g, ' ').toUpperCase()}
                        </Text>
                        <View
                          style={[
                            styles.statusChip,
                            {
                              backgroundColor:
                                item.status === 'completed'
                                  ? isDark ? 'rgba(57, 255, 20, 0.12)' : '#111111'
                                  : isDark ? 'rgba(255, 170, 0, 0.12)' : '#EFECE4',
                              borderColor:
                                item.status === 'completed'
                                  ? isDark ? 'rgba(57, 255, 20, 0.3)' : '#111111'
                                  : isDark ? 'rgba(255, 170, 0, 0.3)' : '#E4DFD3',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusChipText,
                              {
                                color:
                                  item.status === 'completed'
                                    ? isDark ? colors.secondary : '#F7F4EE'
                                    : isDark ? colors.warning : '#111111',
                              },
                            ]}
                          >
                            {item.status === 'completed' ? 'AI ANALYZED' : 'PROCESSING'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.logDate, { color: colors.textMuted }]}>
                        {new Date(item.uploaded_at).toLocaleDateString()} · {(item.sport || 'ATHLETICS').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.logActionsRow, { borderTopColor: colors.border }]}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/(athlete)/verification',
                          params: { videoId: item.id },
                        } as any)
                      }
                      style={[
                        styles.actionPillBtn,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFECE4',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <InnovativeIcon name="shield-check" size={13} color={colors.textPrimary} />
                      <Text style={[styles.actionPillText, { color: colors.textPrimary }]}>
                        Verify
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => router.push('/(athlete)/reports' as any)}
                      style={[
                        styles.actionPillBtn,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFECE4',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <InnovativeIcon name="bar-chart" size={13} color={colors.textPrimary} />
                      <Text style={[styles.actionPillText, { color: colors.textPrimary }]}>
                        Report
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleRemoveAttempt(item.id)}
                      style={[
                        styles.actionPillBtn,
                        {
                          backgroundColor: isDark ? 'rgba(255,0,0,0.1)' : '#EFECE4',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <InnovativeIcon name="trash" size={13} color={colors.textPrimary} />
                      <Text style={[styles.actionPillText, { color: colors.textPrimary }]}>
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                </MinimalCard>
              ))}
            </View>
          )}
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  userInfo: { flex: 1 },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  welcomeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginVertical: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroMainTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  heroMainSub: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 16,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroStatText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsStreamRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  metricBigVal: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  metricSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profileProgressTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  profileProgressSub: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  track: {
    height: 5,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 6,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  streamSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 8,
  },
  actionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionIconPill: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionDescription: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  recentSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 4,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 9,
    fontWeight: '900',
  },
  logDate: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  logActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
});