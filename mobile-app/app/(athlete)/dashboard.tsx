/**
 * ATHLETIX — Athlete Dashboard (Fully Connected & Interactive)
 * app/(athlete)/dashboard.tsx
 *
 * Connected to live assessment scores, profile completeness gauge,
 * quick action tiles, recent AI report cards, and leaderboard preview.
 */

import React from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import NotificationBell from '../../components/NotificationBell';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useAssessments } from '../../hooks/useAssessments';
import { useVideos } from '../../hooks/useVideos';
import { Colors } from '../../constants/colors';

function StatCard({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <View style={[styles.statCard, { borderColor: `${accent}30` }]}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function AthleteDashboard() {
  const router = useRouter();
  const { name, logout } = useAuth();
  const { profile, completenessPercent } = useProfile();
  const { assessments, latestAssessment } = useAssessments();
  const { videos } = useVideos();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const firstName = (profile?.name || name)?.split(' ')[0] ?? 'Athlete';

  const bestScore =
    assessments.length > 0
      ? Math.round(Math.max(...assessments.map((a) => a.score || 0)))
      : null;

  return (
    <LinearGradient colors={['#070B14', '#0A0E1A', '#0D1424']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={styles.scroll}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>{firstName} 👋</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>🏃 ATHLETE</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <NotificationBell routeTarget="/(athlete)/notifications" />
              <View style={{ gap: 6, alignItems: 'flex-end' }}>
                <Pressable onPress={() => router.push('/(athlete)/profile' as any)} style={styles.profileBtn}>
                  <Text style={styles.profileBtnText}>⚙️ Profile</Text>
                </Pressable>
                <Pressable onPress={logout} style={styles.logoutBtn}>
                  <Text style={styles.logoutText}>Sign out</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* ── Profile Completeness Card ── */}
          <Pressable
            style={styles.profileCard}
            onPress={() => router.push('/(athlete)/profile' as any)}
          >
            <View style={styles.profileCardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileCardTitle}>
                  Profile Completion: <Text style={{ color: Colors.primary }}>{completenessPercent}%</Text>
                </Text>
                <Text style={styles.profileCardSub}>
                  {completenessPercent < 100
                    ? 'Complete your athletic specs & bio to get scouted by officials'
                    : 'Your athlete profile is fully set up & scout ready!'}
                </Text>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${completenessPercent}%` }]} />
            </View>
          </Pressable>

          {/* ── Stats Row ── */}
          <View style={styles.statsRow}>
            <StatCard
              value={bestScore !== null ? `${bestScore}` : '—'}
              label="Best AI Score"
              accent={Colors.secondary}
            />
            <StatCard
              value={String(assessments.length)}
              label="AI Reports"
              accent={Colors.primary}
            />
            <StatCard
              value={String(videos.length)}
              label="Submissions"
              accent={Colors.warning}
            />
          </View>

          {/* ── CTA: Upload Attempt ── */}
          <Pressable
            style={styles.uploadCta}
            onPress={() => router.push('/(athlete)/upload' as any)}
          >
            <LinearGradient
              colors={['#00D4FF', '#0099FF']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.uploadCtaGrad}
            >
              <Text style={styles.uploadCtaText}>🎬  Upload Exercise Attempt Video</Text>
              <Text style={styles.uploadCtaSub}>MediaPipe BlazePose 33-Keypoint Form & Rep Assessment</Text>
            </LinearGradient>
          </Pressable>

          {/* ── Section: Latest AI Report ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>LATEST AI PERFORMANCE REPORT</Text>
            {assessments.length > 0 && (
              <Pressable onPress={() => router.push('/(athlete)/reports' as any)}>
                <Text style={styles.viewAllText}>View All ({assessments.length}) →</Text>
              </Pressable>
            )}
          </View>

          {latestAssessment ? (
            <Pressable
              style={styles.latestReportCard}
              onPress={() => router.push('/(athlete)/reports' as any)}
            >
              <View style={styles.reportHeaderRow}>
                <View style={styles.reportScoreCircle}>
                  <Text style={styles.reportScoreVal}>{Math.round(latestAssessment.score)}</Text>
                  <Text style={styles.reportScoreLabel}>AI SCORE</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.reportExerciseName}>
                    {(latestAssessment.videos?.exercise || 'Exercise').toUpperCase().replace('_', ' ')}
                  </Text>
                  <Text style={styles.reportSportBadge}>
                    {(latestAssessment.videos?.sport || 'Sport').toUpperCase()}
                  </Text>
                  <Text style={styles.reportDate}>
                    {new Date(latestAssessment.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.arrowIcon}>→</Text>
              </View>

              {latestAssessment.strengths && latestAssessment.strengths[0] && (
                <View style={styles.snippetRow}>
                  <Text style={styles.snippetGreen}>🟢 {latestAssessment.strengths[0]}</Text>
                </View>
              )}
            </Pressable>
          ) : (
            <Pressable
              style={styles.emptyCard}
              onPress={() => router.push('/(athlete)/upload' as any)}
            >
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>No AI assessments yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap here to upload your first exercise video and get scored by BlazePose AI!
              </Text>
            </Pressable>
          )}

          {/* ── Section: Leaderboard ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>TALENT LEADERBOARD</Text>
            <Pressable onPress={() => router.push('/(athlete)/leaderboard' as any)}>
              <Text style={styles.viewAllText}>Open Leaderboard →</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.leaderboardPromoCard}
            onPress={() => router.push('/(athlete)/leaderboard' as any)}
          >
            <LinearGradient
              colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.02)']}
              style={styles.leaderboardPromoGrad}
            >
              <Text style={styles.trophyIcon}>🏆</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.leaderboardPromoTitle}>National Talent Leaderboard</Text>
                <Text style={styles.leaderboardPromoSub}>
                  Compare your AI form score with athletes across India & get scouted by officials.
                </Text>
              </View>
              <Text style={styles.arrowGold}>→</Text>
            </LinearGradient>
          </Pressable>

        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe:     { flex: 1 },
  scroll:   { padding: 20, paddingBottom: 48 },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting:  { fontSize: 14, color: Colors.textSecondary },
  name:      { fontSize: 26, fontWeight: '900', color: Colors.textPrimary, marginVertical: 2 },
  roleBadge: {
    alignSelf: 'flex-start', backgroundColor: `${Colors.secondary}20`,
    borderRadius: 20, borderWidth: 1, borderColor: `${Colors.secondary}50`,
    paddingHorizontal: 10, paddingVertical: 4, marginTop: 4,
  },
  roleBadgeText: { color: Colors.secondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  profileBtn:    { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: `${Colors.primary}20`, borderWidth: 1, borderColor: `${Colors.primary}50` },
  profileBtnText:{ color: Colors.primary, fontSize: 11, fontWeight: '700' },
  logoutBtn:     { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  logoutText:    { color: Colors.textMuted, fontSize: 11 },

  profileCard: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)', marginBottom: 20,
  },
  profileCardRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  profileCardTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2 },
  profileCardSub:   { fontSize: 11, color: Colors.textSecondary, lineHeight: 15 },
  arrowIcon:        { fontSize: 18, color: Colors.primary, fontWeight: '900', marginLeft: 8 },
  progressBarTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  progressBarFill:  { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16,
    padding: 14, alignItems: 'center', borderWidth: 1,
  },
  statValue: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },

  uploadCta:    { borderRadius: 18, overflow: 'hidden', marginBottom: 24 },
  uploadCtaGrad:{ padding: 20, alignItems: 'center' },
  uploadCtaText:{ fontSize: 15, fontWeight: '900', color: '#000' },
  uploadCtaSub: { fontSize: 10, color: 'rgba(0,0,0,0.6)', marginTop: 3, fontWeight: '600' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  sectionTitle:     { fontSize: 10, letterSpacing: 2, color: Colors.textMuted, fontWeight: '800' },
  viewAllText:      { fontSize: 11, color: Colors.primary, fontWeight: '700' },

  latestReportCard: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 20,
  },
  reportHeaderRow:   { flexDirection: 'row', alignItems: 'center' },
  reportScoreCircle: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: Colors.secondary,
    backgroundColor: `${Colors.secondary}15`, justifyContent: 'center', alignItems: 'center',
  },
  reportScoreVal:    { fontSize: 16, fontWeight: '900', color: Colors.secondary },
  reportScoreLabel:  { fontSize: 7, fontWeight: '800', color: Colors.secondary },
  reportExerciseName:{ fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  reportSportBadge:  { fontSize: 10, color: Colors.primary, fontWeight: '700', marginTop: 1 },
  reportDate:        { fontSize: 10, color: Colors.textMuted, marginTop: 1 },

  snippetRow:   { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  snippetGreen: { fontSize: 11, color: Colors.secondary, fontWeight: '600' },

  emptyCard: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
    marginBottom: 20, borderStyle: 'dashed',
  },
  emptyIcon:     { fontSize: 32, marginBottom: 8 },
  emptyTitle:    { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  emptySubtitle: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', lineHeight: 17 },

  leaderboardPromoCard: {
    borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)',
    marginBottom: 20,
  },
  leaderboardPromoGrad: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  trophyIcon:            { fontSize: 28 },
  leaderboardPromoTitle: { fontSize: 14, fontWeight: '800', color: Colors.gold, marginBottom: 2 },
  leaderboardPromoSub:   { fontSize: 11, color: Colors.textSecondary, lineHeight: 15 },
  arrowGold:             { fontSize: 18, color: Colors.gold, fontWeight: '900' },
});
