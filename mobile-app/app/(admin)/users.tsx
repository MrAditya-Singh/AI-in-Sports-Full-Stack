/**
 * ATHLETIX — User Management Screen (Phase 8: FULLY IMPLEMENTED)
 * app/(admin)/users.tsx
 *
 * Features:
 *  - User Directory with Role Filter Pills (All / Athletes / Officials / Admins)
 *  - Role Promotion & Management Action buttons
 *  - Real-time API state update & toast feedback
 *  - Enriched athlete profile specs
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAdmin } from '../../hooks/useAdmin';
import { Colors } from '../../constants/colors';
import { UserProfile } from '../../services/userService';

export default function UserManagementScreen() {
  const router = useRouter();
  const {
    users,
    selectedRoleFilter,
    setSelectedRoleFilter,
    isLoading,
    isUpdatingId,
    changeRole,
    refreshAdmin,
  } = useAdmin();

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRoleChange = async (user: UserProfile, newRole: 'athlete' | 'official' | 'admin') => {
    const success = await changeRole(user.id, newRole);
    if (success) {
      showToast(`Updated ${user.name}'s role to '${newRole.toUpperCase()}'! ⚙️`);
    }
  };

  const renderUserCard = ({ item }: { item: UserProfile }) => {
    const ap     = item.athlete_profile || {};
    const isBusy = isUpdatingId === item.id;

    const roleColors = {
      athlete:  { bg: `${Colors.secondary}20`, border: `${Colors.secondary}50`, text: Colors.secondary },
      official: { bg: `${Colors.primary}20`,   border: `${Colors.primary}50`,   text: Colors.primary },
      admin:    { bg: `${Colors.warning}20`,   border: `${Colors.warning}50`,   text: Colors.warning },
    };

    const cfg = roleColors[item.role] || roleColors.athlete;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatarCircle, { borderColor: cfg.text, backgroundColor: cfg.bg }]}>
            <Text style={[styles.avatarText, { color: cfg.text }]}>
              {(item.name || 'U').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.userName}>{item.name}</Text>
              <View style={[styles.roleBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                <Text style={[styles.roleBadgeText, { color: cfg.text }]}>{item.role.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.joinedText}>Joined: {new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Extended Specs if Athlete */}
        {item.role === 'athlete' && (ap.location || ap.primary_sport) ? (
          <View style={styles.specsRow}>
            {ap.primary_sport ? <Text style={styles.specChip}>Discipline: {ap.primary_sport}</Text> : null}
            {ap.location ? <Text style={styles.specChip}>📍 {ap.location}</Text> : null}
            {ap.experience_level ? <Text style={styles.specChip}>Level: {ap.experience_level}</Text> : null}
          </View>
        ) : null}

        {/* Role Action Buttons */}
        <View style={styles.roleActionRow}>
          <Text style={styles.actionLabel}>CHANGE ROLE:</Text>
          {isBusy ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <View style={styles.btnPillsGroup}>
              {item.role !== 'official' && (
                <Pressable
                  style={[styles.roleBtn, { borderColor: Colors.primary }]}
                  onPress={() => handleRoleChange(item, 'official')}
                >
                  <Text style={[styles.roleBtnText, { color: Colors.primary }]}>+ Official 🏅</Text>
                </Pressable>
              )}
              {item.role !== 'admin' && (
                <Pressable
                  style={[styles.roleBtn, { borderColor: Colors.warning }]}
                  onPress={() => handleRoleChange(item, 'admin')}
                >
                  <Text style={[styles.roleBtnText, { color: Colors.warning }]}>+ Admin ⚙️</Text>
                </Pressable>
              )}
              {item.role !== 'athlete' && (
                <Pressable
                  style={[styles.roleBtn, { borderColor: Colors.secondary }]}
                  onPress={() => handleRoleChange(item, 'athlete')}
                >
                  <Text style={[styles.roleBtnText, { color: Colors.secondary }]}>+ Athlete 🏃</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0A0800', '#0A0E1A', '#0A1020']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>

        {/* Top Bar */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>USER MANAGEMENT 👥</Text>
          <Text style={styles.subtitle}>Directory & Role Governance ({users.length} Users)</Text>
        </View>

        {/* Role Filter Chips */}
        <View style={styles.filterRow}>
          {(['all', 'athlete', 'official', 'admin'] as const).map((r) => {
            const isSel = selectedRoleFilter === r;
            const labels = { all: 'All Users', athlete: '🏃 Athletes', official: '🏅 Officials', admin: '⚙️ Admins' };
            return (
              <Pressable
                key={r}
                style={[styles.filterChip, isSel && styles.activeFilterChip]}
                onPress={() => setSelectedRoleFilter(r)}
              >
                <Text style={[styles.filterText, isSel && styles.activeFilterText]}>
                  {labels[r]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {toast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.warning} />
            <Text style={styles.loadingText}>Fetching user directory...</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUserCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refreshAdmin} tintColor={Colors.warning} />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>No Users Found</Text>
                <Text style={styles.emptySub}>
                  No users match the selected role filter.
                </Text>
              </View>
            }
          />
        )}

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe:     { flex: 1 },

  header:   { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  backBtn:  { marginBottom: 8 },
  backText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  title:    { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  filterRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 16, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  activeFilterChip: { backgroundColor: `${Colors.warning}20`, borderColor: Colors.warning },
  filterText:       { fontSize: 11, color: Colors.textMuted, fontWeight: '700' },
  activeFilterText: { color: Colors.warning },

  toast: {
    marginHorizontal: 20, marginBottom: 12, backgroundColor: `${Colors.secondary}25`,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.secondary, padding: 12, alignItems: 'center',
  },
  toastText: { color: Colors.secondary, fontSize: 12, fontWeight: '800' },

  loadingBox:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, marginTop: 10, fontSize: 13 },

  listContent: { paddingHorizontal: 20, paddingBottom: 32 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '900' },
  userName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  userEmail: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  joinedText: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  roleBadge: {
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1,
  },
  roleBadgeText: { fontSize: 9, fontWeight: '800' },

  specsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  specChip: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    fontSize: 10, color: Colors.textSecondary, borderWidth: 1, borderColor: Colors.border,
  },

  roleActionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  actionLabel: { fontSize: 9, letterSpacing: 1.5, color: Colors.textMuted, fontWeight: '800' },
  btnPillsGroup: { flexDirection: 'row', gap: 6 },
  roleBtn: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  roleBtnText: { fontSize: 10, fontWeight: '700' },

  emptyBox: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginVertical: 20,
  },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
});
