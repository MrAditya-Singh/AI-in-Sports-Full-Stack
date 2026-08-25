/**
 * ATHLETIX — Athlete Dashboard (Phase 1: Auth Shell)
 * app/(athlete)/dashboard.tsx
 *
 * Shows authenticated athlete's name, role badge, and empty-state cards.
 * Phase 2 will populate with real reports and leaderboard data.
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

function StatCard({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <View style={[styles.statCard, { borderColor: `${accent}30` }]}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EmptyCard({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );
}

export default function AthleteDashboard() {
  const { name, email, logout } = useAuth();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const firstName = name?.split(' ')[0] ?? 'Athlete';

  return (
    <LinearGradient colors={['#070B14', '#0A0E1A']} style={styles.gradient}>
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
            <Pressable onPress={logout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Sign out</Text>
            </Pressable>
          </View>

          {/* ── Stats row ── */}
          <View style={styles.statsRow}>
            <StatCard value="—"    label="AI Score"       accent={Colors.secondary} />
            <StatCard value="—"    label="Leaderboard"    accent={Colors.primary}   />
            <StatCard value="—"    label="Submissions"    accent={Colors.warning}   />
          </View>

          {/* ── Section: Reports ── */}
          <Text style={styles.sectionTitle}>MY REPORTS</Text>
          <EmptyCard
            icon="🎯"
            title="No reports yet"
            subtitle="Upload a video to get your first AI performance assessment"
          />

          {/* ── Section: Leaderboard ── */}
          <Text style={styles.sectionTitle}>LEADERBOARD RANK</Text>
          <EmptyCard
            icon="🏆"
            title="Not ranked yet"
            subtitle="Submit a video and get scored to appear on the leaderboard"
          />

          {/* ── CTA: Upload ── */}
          <Pressable style={styles.uploadCta}>
            <LinearGradient
              colors={['#39FF14', '#28CC0F']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.uploadCtaGrad}
            >
              <Text style={styles.uploadCtaText}>🎬  Upload Your First Video</Text>
              <Text style={styles.uploadCtaSub}>Coming in Phase 3</Text>
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
  scroll:   { padding: 24, paddingBottom: 48 },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  greeting:  { fontSize: 14, color: Colors.textSecondary },
  name:      { fontSize: 28, fontWeight: '900', color: Colors.textPrimary, marginVertical: 2 },
  roleBadge: {
    alignSelf: 'flex-start', backgroundColor: `${Colors.secondary}20`,
    borderRadius: 20, borderWidth: 1, borderColor: `${Colors.secondary}50`,
    paddingHorizontal: 10, paddingVertical: 4, marginTop: 4,
  },
  roleBadgeText: { color: Colors.secondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  logoutBtn:     { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  logoutText:    { color: Colors.textMuted, fontSize: 12 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, alignItems: 'center', borderWidth: 1,
  },
  statValue: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: 10, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },

  sectionTitle: { fontSize: 10, letterSpacing: 2.5, color: Colors.textMuted, fontWeight: '700', marginBottom: 12, marginTop: 8 },

  emptyCard: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
    marginBottom: 20, borderStyle: 'dashed',
  },
  emptyIcon:     { fontSize: 36, marginBottom: 10 },
  emptyTitle:    { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  uploadCta:    { borderRadius: 18, overflow: 'hidden', marginTop: 8 },
  uploadCtaGrad:{ padding: 22, alignItems: 'center' },
  uploadCtaText:{ fontSize: 16, fontWeight: '900', color: '#000' },
  uploadCtaSub: { fontSize: 11, color: 'rgba(0,0,0,0.5)', marginTop: 4 },
});
