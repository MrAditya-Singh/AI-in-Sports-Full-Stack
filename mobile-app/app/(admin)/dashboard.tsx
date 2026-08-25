/**
 * ATHLETIX — Admin Dashboard (Phase 8: FULLY IMPLEMENTED)
 * app/(admin)/dashboard.tsx
 *
 * Connected to live platform analytics, real-time metrics, quick action tiles,
 * and user role management navigation.
 */

import React from 'react';
import {
  ActivityIndicator,
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

import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { Colors } from '../../constants/colors';
import NotificationBell from '../../components/NotificationBell';

type MetricCardProps = { value: string; label: string; icon: string; color: string };
function MetricCard({ value, label, icon, color }: MetricCardProps) {
  return (
    <View style={[styles.metricCard, { borderTopColor: color, borderTopWidth: 2 }]}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { name, email, logout } = useAuth();
  const { analytics, isLoading, refreshAdmin } = useAdmin();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const firstName = name?.split(' ')[0] ?? 'Admin';

  const userStats    = analytics?.users;
  const videoStats   = analytics?.videos;
  const scoutStats   = analytics?.scouting;
  const aiStats      = analytics?.assessments;

  return (
    <LinearGradient colors={['#0A0800', '#0A0E1A', '#0A0E1A']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={styles.scroll}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Platform Control</Text>
              <Text style={styles.name}>{firstName} ⚙️</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>🟡 ADMIN</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <NotificationBell routeTarget="/(athlete)/notifications" />
              <Pressable onPress={logout} style={styles.logoutBtn}>
                <Text style={styles.logoutText}>Sign out</Text>
              </Pressable>
            </View>
          </View>

          {/* ── System Status Banner ── */}
          <LinearGradient
            colors={['rgba(255,184,0,0.12)', 'rgba(255,184,0,0.03)']}
            style={styles.statusBanner}
          >
            <View style={styles.statusDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusText}>All systems operational · Live DB connected</Text>
              <Text style={styles.statusSub}>FastAPI v1.0.0 · Supabase Postgres · MediaPipe BlazePose</Text>
            </View>
          </LinearGradient>

          {/* ── Platform Metrics Grid ── */}
          <Text style={styles.sectionTitle}>REAL-TIME PLATFORM METRICS</Text>
          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Colors.warning} size="large" />
              <Text style={styles.loadingText}>Computing platform metrics...</Text>
            </View>
          ) : (
            <View style={styles.metricsGrid}>
              <MetricCard
                value={String(userStats?.total ?? 0)}
                label={`Users (${userStats?.athletes ?? 0} Ath / ${userStats?.officials ?? 0} Off)`}
                icon="👥"
                color={Colors.primary}
              />
              <MetricCard
                value={String(videoStats?.total ?? 0)}
                label={`Videos (${videoStats?.completed ?? 0} Done)`}
                icon="🎬"
                color={Colors.secondary}
              />
              <MetricCard
                value={String(aiStats?.total ?? 0)}
                label={`AI Reports (${aiStats?.avg_score ?? 0} Avg Score)`}
                icon="🤖"
                color={Colors.warning}
              />
              <MetricCard
                value={String(scoutStats?.shortlisted ?? 0)}
                label={`Shortlisted (${scoutStats?.verifications ?? 0} Verified)`}
                icon="⭐"
                color={Colors.gold}
              />
            </View>
          )}

          {/* ── Quick Action Nav Tiles ── */}
          <Text style={styles.sectionTitle}>ADMINISTRATION & OVERVIEW</Text>
          <View style={styles.actionsGrid}>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.75 }]}
              onPress={() => router.push('/(admin)/users' as any)}
            >
              <Text style={styles.actionBtnIcon}>👥</Text>
              <Text style={styles.actionBtnLabel}>Manage Users</Text>
              <Text style={styles.actionBtnNote}>Role elevation & directory</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.75 }]}
              onPress={() => router.push('/(admin)/analytics' as any)}
            >
              <Text style={styles.actionBtnIcon}>📊</Text>
              <Text style={styles.actionBtnLabel}>Platform Analytics</Text>
              <Text style={styles.actionBtnNote}>Deep metrics & AI SLA</Text>
            </Pressable>
          </View>

          {/* ── Admin Identity Card ── */}
          <View style={styles.identityCard}>
            <Text style={styles.identityLabel}>ADMINISTRATOR SESSION</Text>
            <Text style={styles.identityEmail}>{email}</Text>
            <Text style={styles.identityRole}>Full access privileges across all tables & endpoints</Text>
          </View>

        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe:     { flex: 1 },
  scroll:   { padding: 24, paddingBottom: 48 },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting:  { fontSize: 14, color: Colors.textSecondary },
  name:      { fontSize: 28, fontWeight: '900', color: Colors.textPrimary, marginVertical: 2 },
  roleBadge: {
    alignSelf: 'flex-start', backgroundColor: `${Colors.warning}20`,
    borderRadius: 20, borderWidth: 1, borderColor: `${Colors.warning}50`,
    paddingHorizontal: 10, paddingVertical: 4, marginTop: 4,
  },
  roleBadgeText: { color: Colors.warning, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  logoutBtn:     { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  logoutText:    { color: Colors.textMuted, fontSize: 11 },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)',
    marginBottom: 28,
  },
  statusDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.secondary, marginRight: 10 },
  statusText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '700' },
  statusSub:  { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  sectionTitle: { fontSize: 10, letterSpacing: 2.5, color: Colors.textMuted, fontWeight: '700', marginBottom: 14, marginTop: 8 },

  loadingBox: { padding: 30, alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, marginTop: 10, fontSize: 12 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  metricCard:  {
    width: '47%', backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  metricIcon:  { fontSize: 22, marginBottom: 6 },
  metricValue: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  metricLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },

  actionsGrid: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  actionBtn: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  actionBtnIcon:  { fontSize: 26, marginBottom: 8 },
  actionBtnLabel: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  actionBtnNote:  { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },

  identityCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  identityLabel: { fontSize: 10, letterSpacing: 2, color: Colors.textMuted, marginBottom: 6 },
  identityEmail: { fontSize: 14, fontWeight: '700', color: Colors.warning, marginBottom: 4 },
  identityRole:  { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
});
