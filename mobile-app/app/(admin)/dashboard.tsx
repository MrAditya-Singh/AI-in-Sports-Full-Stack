/**
 * ATHLETIX — Admin Dashboard
 * app/(admin)/dashboard.tsx
 */

import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { useTheme } from '../../hooks/useTheme';
import NotificationBell from '../../components/NotificationBell';
import ThemeToggle from '../../components/ThemeToggle';

type MetricCardProps = {
  value: string;
  label: string;
  icon: string;
  color: string;
  surfaceColor: string;
  labelColor: string;
};

function MetricCard({
  value,
  label,
  icon,
  color,
  surfaceColor,
  labelColor,
}: MetricCardProps) {
  return (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: surfaceColor,
          borderTopColor: color,
          borderTopWidth: 3,
        },
      ]}
    >
      <Text style={styles.metricIcon}>{icon}</Text>

      <Text
        style={[
          styles.metricValue,
          { color },
        ]}
      >
        {value}
      </Text>

      <Text style={[styles.metricLabel, { color: labelColor }]}>
        {label}
      </Text>
    </View>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { name, role, logout } = useAuth();
  const { colors, isDark } = useTheme();

  React.useEffect(() => {
    if (role && role !== 'admin') {
      router.replace(
        role === 'athlete'
          ? '/(athlete)/dashboard'
          : '/(official)/dashboard',
      );
    }
  }, [role, router]);

  const {
    analytics,
    isLoading,
    refreshAdmin,
  } = useAdmin();

  const fadeAnim =
    React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const firstName =
    name?.split(' ')[0] ?? 'Admin';

  const userStats = analytics?.users;
  const videoStats = analytics?.videos;
  const scoutStats = analytics?.scouting;
  const aiStats = analytics?.assessments;

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
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => void refreshAdmin()}
              tintColor={colors.warning}
              colors={[colors.warning]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                Platform Control
              </Text>

              <Text style={[styles.name, { color: colors.textPrimary }]}>
                {firstName} ⚙️
              </Text>

              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor: `${colors.warning}20`,
                    borderColor: `${colors.warning}50`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    { color: colors.warning },
                  ]}
                >
                  🟡 ADMIN
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <ThemeToggle compact />
              <NotificationBell
                routeTarget="/(athlete)/notifications"
              />

              <Pressable
                onPress={() => void logout()}
                style={({ pressed }) => [
                  styles.logoutBtn,
                  {
                    borderColor: colors.border,
                    backgroundColor: isDark ? 'transparent' : colors.surfaceElevated,
                  },
                  pressed && styles.pressed,
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

          {/* System status */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255,184,0,0.12)', 'rgba(255,184,0,0.03)']
                : ['rgba(217,119,6,0.12)', 'rgba(217,119,6,0.03)']
            }
            style={[styles.statusBanner, { borderColor: `${colors.warning}35` }]}
          >
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />

            <View style={{ flex: 1 }}>
              <Text style={[styles.statusText, { color: colors.textPrimary }]}>
                All systems operational · Live DB connected
              </Text>

              <Text style={[styles.statusSub, { color: colors.textSecondary }]}>
                FastAPI · Supabase Postgres · MediaPipe BlazePose
              </Text>
            </View>
          </LinearGradient>

          {/* Platform metrics */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              REAL-TIME PLATFORM METRICS
            </Text>

            <Pressable
              onPress={() => void refreshAdmin()}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.refreshBtn,
                {
                  backgroundColor: `${colors.primary}20`,
                  borderColor: `${colors.primary}40`,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.refreshText, { color: colors.primary }]}>
                {isLoading ? '...' : '↻ Refresh'}
              </Text>
            </Pressable>
          </View>

          {isLoading && !analytics ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator
                color={colors.warning}
                size="large"
              />

              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Computing platform metrics...
              </Text>
            </View>
          ) : (
            <View style={styles.metricsGrid}>
              <MetricCard
                value={String(userStats?.total ?? 0)}
                label={`Users (${userStats?.athletes ?? 0} Ath / ${userStats?.officials ?? 0} Off)`}
                icon="👥"
                color={colors.primary}
                surfaceColor={colors.surface}
                labelColor={colors.textMuted}
              />

              <MetricCard
                value={String(videoStats?.total ?? 0)}
                label={`Videos (${videoStats?.completed ?? 0} Done)`}
                icon="🎬"
                color={colors.secondary}
                surfaceColor={colors.surface}
                labelColor={colors.textMuted}
              />

              <MetricCard
                value={String(aiStats?.total ?? 0)}
                label={`AI Reports (${aiStats?.avg_score ?? 0} Avg Score)`}
                icon="🤖"
                color={colors.warning}
                surfaceColor={colors.surface}
                labelColor={colors.textMuted}
              />

              <MetricCard
                value={String(scoutStats?.shortlisted ?? 0)}
                label={`Shortlisted (${scoutStats?.verifications ?? 0} Verified)`}
                icon="⭐"
                color={colors.accent}
                surfaceColor={colors.surface}
                labelColor={colors.textMuted}
              />
            </View>
          )}

          {/* Quick Management Links */}
          <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 24, marginBottom: 12 }]}>
            ADMINISTRATION MANAGEMENT
          </Text>

          <View style={styles.actionGrid}>
            {[
              {
                title: 'User Management',
                sub: 'Inspect & manage athlete/official accounts',
                icon: '👥',
                route: '/(admin)/users',
                color: colors.primary,
              },
              {
                title: 'Video Submissions',
                sub: 'Audit uploaded exercise video assets',
                icon: '🎬',
                route: '/(admin)/videos',
                color: colors.secondary,
              },
              {
                title: 'Verification Queue',
                sub: 'Review official talent verifications',
                icon: '🛡️',
                route: '/(admin)/verifications',
                color: colors.warning,
              },
              {
                title: 'Analytics Intelligence',
                sub: 'Detailed system charts & performance breakdown',
                icon: '📊',
                route: '/(admin)/analytics',
                color: colors.accent,
              },
            ].map((item) => (
              <Pressable
                key={item.title}
                style={({ pressed }) => [
                  styles.adminCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderLeftColor: item.color,
                    borderLeftWidth: 4,
                  },
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push(item.route as any)}
              >
                <Text style={styles.adminCardIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.adminCardTitle, { color: colors.textPrimary }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.adminCardSub, { color: colors.textSecondary }]}>
                    {item.sub}
                  </Text>
                </View>
                <Text style={[styles.adminCardArrow, { color: item.color }]}>→</Text>
              </Pressable>
            ))}
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: { fontSize: 13 },
  name: { fontSize: 26, fontWeight: '900', marginVertical: 2 },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  logoutText: { fontSize: 11 },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 13, fontWeight: '800' },
  statusSub: { fontSize: 11, marginTop: 2 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  refreshText: { fontSize: 11, fontWeight: '700' },

  loadingBox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { marginTop: 10, fontSize: 12 },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  metricIcon: { fontSize: 22, marginBottom: 4 },
  metricValue: { fontSize: 24, fontWeight: '900', marginBottom: 2 },
  metricLabel: { fontSize: 10, lineHeight: 14 },

  actionGrid: {
    gap: 10,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  adminCardIcon: { fontSize: 24 },
  adminCardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  adminCardSub: { fontSize: 11 },
  adminCardArrow: { fontSize: 18, fontWeight: '900' },

  pressed: { opacity: 0.8 },
});