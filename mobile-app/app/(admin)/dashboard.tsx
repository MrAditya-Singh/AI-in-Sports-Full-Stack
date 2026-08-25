/**
 * ATHLETIX — Admin Dashboard (Phase 1: Auth Shell)
 * app/(admin)/dashboard.tsx
 *
 * Amber/gold-accented admin view. Shows platform health at a glance.
 * Phase 8 will populate with real analytics and user management.
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

import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';

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

type QuickAction = { icon: string; label: string };
const QUICK_ACTIONS: QuickAction[] = [
  { icon: '👥', label: 'Manage Users' },
  { icon: '🎬', label: 'Review Videos' },
  { icon: '📊', label: 'Analytics' },
  { icon: '🚨', label: 'Flagged Content' },
];

export default function AdminDashboard() {
  const { name, email, logout } = useAuth();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const firstName = name?.split(' ')[0] ?? 'Admin';

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
            <Pressable onPress={logout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Sign out</Text>
            </Pressable>
          </View>

          {/* ── System Status ── */}
          <LinearGradient
            colors={['rgba(255,184,0,0.12)', 'rgba(255,184,0,0.03)']}
            style={styles.statusBanner}
          >
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>All systems operational  ·  Phase 1 Auth: </Text>
            <Text style={[styles.statusText, { color: Colors.secondary, fontWeight: '700' }]}>LIVE</Text>
          </LinearGradient>

          {/* ── Platform Metrics ── */}
          <Text style={styles.sectionTitle}>PLATFORM METRICS</Text>
          <View style={styles.metricsGrid}>
            <MetricCard value="—" label="Total Users"   icon="👥" color={Colors.primary}   />
            <MetricCard value="—" label="Videos Today"  icon="🎬" color={Colors.secondary} />
            <MetricCard value="—" label="AI Reports"    icon="🤖" color={Colors.warning}   />
            <MetricCard value="—" label="Verified"      icon="✅" color={Colors.gold}      />
          </View>

          {/* ── Quick Actions ── */}
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((a) => (
              <Pressable
                key={a.label}
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.actionBtnIcon}>{a.icon}</Text>
                <Text style={styles.actionBtnLabel}>{a.label}</Text>
                <Text style={styles.actionBtnNote}>Phase 8</Text>
              </Pressable>
            ))}
          </View>

          {/* ── Admin identity card ── */}
          <View style={styles.identityCard}>
            <Text style={styles.identityLabel}>SIGNED IN AS</Text>
            <Text style={styles.identityEmail}>{email}</Text>
            <Text style={styles.identityRole}>Administrator — Full platform access</Text>
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
  logoutBtn:     { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  logoutText:    { color: Colors.textMuted, fontSize: 12 },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)',
    marginBottom: 28,
  },
  statusDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.secondary, marginRight: 10 },
  statusText: { fontSize: 13, color: Colors.textSecondary },

  sectionTitle: { fontSize: 10, letterSpacing: 2.5, color: Colors.textMuted, fontWeight: '700', marginBottom: 14, marginTop: 8 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  metricCard:  {
    width: '47%', backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  metricIcon:  { fontSize: 22, marginBottom: 6 },
  metricValue: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  metricLabel: { fontSize: 10, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  actionBtn: {
    width: '47%', backgroundColor: Colors.surface, borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  actionBtnIcon:  { fontSize: 26, marginBottom: 8 },
  actionBtnLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  actionBtnNote:  { fontSize: 10, color: Colors.textMuted },

  identityCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  identityLabel: { fontSize: 10, letterSpacing: 2, color: Colors.textMuted, marginBottom: 6 },
  identityEmail: { fontSize: 14, fontWeight: '700', color: Colors.warning, marginBottom: 4 },
  identityRole:  { fontSize: 12, color: Colors.textSecondary },
});
