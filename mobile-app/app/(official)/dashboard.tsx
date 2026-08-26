/**
 * ATHLETIX — Official Dashboard (Phase 1: Auth Shell)
 * app/(official)/dashboard.tsx
 *
 * Shows authenticated official's identity with blue-accent theme.
 * Phase 6 will populate with real athlete profiles and shortlisting.
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
import { useScouting } from '../../hooks/useScouting';
import { Colors } from '../../constants/colors';

function ActionCard({
  icon,
  title,
  desc,
  accent,
  onPress,
}: {
  icon: string;
  title: string;
  desc: string;
  accent: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionCard,
        { borderLeftColor: accent, borderLeftWidth: 3 },
        pressed && { opacity: 0.8 },
      ]}
      onPress={onPress}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDesc}>{desc}</Text>
      </View>
      <Text style={[styles.actionArrow, { color: accent }]}>→</Text>
    </Pressable>
  );
}

export default function OfficialDashboard() {
  const router = useRouter();
  const { name, logout } = useAuth();
  const { shortlist, verifications } = useScouting();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const firstName = name?.split(' ')[0] ?? 'Official';

  return (
    <LinearGradient colors={['#070B14', '#0A0E1A', '#0A1020']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={styles.scroll}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Scouting dashboard</Text>
              <Text style={styles.name}>{firstName} 🏅</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>🔵 OFFICIAL</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <NotificationBell routeTarget="/(athlete)/notifications" />
              <Pressable onPress={logout} style={styles.logoutBtn}>
                <Text style={styles.logoutText}>Sign out</Text>
              </Pressable>
            </View>
          </View>

          {/* ── Quick Scouting Portal CTA Banner ── */}
          <Pressable
            onPress={() => router.push('/(official)/review' as any)}
            style={({ pressed }) => [pressed && { opacity: 0.9 }]}
          >
            <LinearGradient
              colors={['rgba(0,212,255,0.2)', 'rgba(0,212,255,0.06)']}
              style={styles.banner}
            >
              <Text style={styles.bannerIcon}>📋</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Open Scouting Portal →</Text>
                <Text style={styles.bannerSub}>Review, verify & shortlist top athletes</Text>
              </View>
            </LinearGradient>
          </Pressable>

          {/* ── Capabilities ── */}
          <Text style={styles.sectionTitle}>SCOUTING ACTIONS</Text>
          <ActionCard
            icon="🔍"
            title="Review Candidate Athletes"
            desc="Browse AI-scored athlete performances by sport & exercise"
            accent={Colors.primary}
            onPress={() => router.push('/(official)/review' as any)}
          />
          <ActionCard
            icon="📋"
            title="Manage Talent Shortlist"
            desc={`View & manage your ${shortlist.length} bookmarked athlete candidates`}
            accent={Colors.warning}
            onPress={() => router.push('/(official)/shortlist' as any)}
          />

          {/* ── Stats row ── */}
          <Text style={styles.sectionTitle}>YOUR SCOUTING STATS</Text>
          <View style={styles.statsRow}>
            {[
              [String(verifications.length), 'Verified', Colors.secondary],
              [String(shortlist.length), 'Shortlisted', Colors.primary],
              ['LIVE', 'Portal', Colors.warning],
            ].map(([v, l, c]) => (
              <View key={l} style={[styles.statCard, { borderColor: `${c}30` }]}>
                <Text style={[styles.statValue, { color: c as string }]}>{v}</Text>
                <Text style={styles.statLabel}>{l}</Text>
              </View>
            ))}
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

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  greeting:  { fontSize: 14, color: Colors.textSecondary },
  name:      { fontSize: 28, fontWeight: '900', color: Colors.textPrimary, marginVertical: 2 },
  roleBadge: {
    alignSelf: 'flex-start', backgroundColor: `${Colors.primary}20`,
    borderRadius: 20, borderWidth: 1, borderColor: `${Colors.primary}50`,
    paddingHorizontal: 10, paddingVertical: 4, marginTop: 4,
  },
  roleBadgeText: { color: Colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  logoutBtn:     { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  logoutText:    { color: Colors.textMuted, fontSize: 12 },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)',
    marginBottom: 28,
  },
  bannerIcon:  { fontSize: 28 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  bannerSub:   { fontSize: 12, color: Colors.textSecondary },

  sectionTitle: { fontSize: 10, letterSpacing: 2.5, color: Colors.textMuted, fontWeight: '700', marginBottom: 12, marginTop: 8 },

  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 18,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  actionIcon:  { fontSize: 24 },
  actionTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginBottom: 3 },
  actionDesc:  { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  actionArrow: { fontSize: 18, fontWeight: '900', marginLeft: 8 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, alignItems: 'center', borderWidth: 1,
  },
  statValue: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: 10, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
});
