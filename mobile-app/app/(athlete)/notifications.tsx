/**
 * ATHLETIX — Notification Center Screen (Phase 7: FULLY IMPLEMENTED)
 * app/(athlete)/notifications.tsx
 *
 * Features:
 *  - Categorized Notification Cards with custom icons & unread indicators
 *  - Mark as read & Mark All as Read actions
 *  - Simulate Live Push Alert trigger for demoing
 *  - Filter by All vs Unread
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

import { useNotifications } from '../../hooks/useNotifications';
import { Colors } from '../../constants/colors';
import { NotificationItem, NotificationType } from '../../services/notificationService';

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    refreshNotifications,
    markRead,
    markAllRead,
    triggerDemoAlert,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [toast, setToast]   = useState<string | null>(null);

  const filteredList = notifications.filter((n) => (filter === 'unread' ? !n.is_read : true));

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'report_ready': return '🎯';
      case 'verified':     return '🏅';
      case 'shortlisted':  return '⭐';
      default:             return '📣';
    }
  };

  const handleSimulateAlert = async () => {
    await triggerDemoAlert();
    setToast('Live push notification simulated! 🔔');
    setTimeout(() => setToast(null), 3000);
  };

  const renderNotificationCard = ({ item }: { item: NotificationItem }) => {
    const icon = getNotificationIcon(item.type);
    return (
      <Pressable
        style={[styles.card, !item.is_read && styles.unreadCard]}
        onPress={() => markRead(item.id)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.typeIcon}>{icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.messageText, !item.is_read && styles.unreadMessageText]}>
              {item.message}
            </Text>
            <Text style={styles.timeText}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}  ·  {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
      </Pressable>
    );
  };

  return (
    <LinearGradient colors={['#070B14', '#0A0E1A', '#0D1525']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>

        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
            <Text style={styles.headerTitle}>NOTIFICATIONS 🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount} NEW</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions & Filters */}
        <View style={styles.controlsRow}>
          {/* Filters */}
          <View style={styles.pillGroup}>
            <Pressable
              style={[styles.pill, filter === 'all' && styles.activePill]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.pillText, filter === 'all' && styles.activePillText]}>
                All ({notifications.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.pill, filter === 'unread' && styles.activePill]}
              onPress={() => setFilter('unread')}
            >
              <Text style={[styles.pillText, filter === 'unread' && styles.activePillText]}>
                Unread ({unreadCount})
              </Text>
            </Pressable>
          </View>

          {/* Action Buttons */}
          <View style={styles.btnGroup}>
            {unreadCount > 0 && (
              <Pressable style={styles.actionBtn} onPress={markAllRead}>
                <Text style={styles.actionBtnText}>Mark All Read 🧹</Text>
              </Pressable>
            )}
            <Pressable style={[styles.actionBtn, styles.demoBtn]} onPress={handleSimulateAlert}>
              <Text style={[styles.actionBtnText, { color: Colors.secondary }]}>+ Demo Alert 🔔</Text>
            </Pressable>
          </View>
        </View>

        {toast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching notifications...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredList}
            keyExtractor={(item) => item.id}
            renderItem={renderNotificationCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={refreshNotifications} tintColor={Colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🔕</Text>
                <Text style={styles.emptyTitle}>No Notifications</Text>
                <Text style={styles.emptySub}>
                  {filter === 'unread'
                    ? "You've read all your notifications! Great job keeping up."
                    : 'You will receive alerts here when your AI reports are ready, or when an official verifies your performance.'}
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

  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:  { marginRight: 6 },
  backText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  unreadBadge: {
    backgroundColor: `${Colors.primary}20`, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.primary,
  },
  unreadBadgeText: { color: Colors.primary, fontSize: 10, fontWeight: '800' },

  controlsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 14, flexWrap: 'wrap', gap: 8,
  },
  pillGroup: { flexDirection: 'row', gap: 6 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  activePill: { backgroundColor: `${Colors.primary}20`, borderColor: Colors.primary },
  pillText: { fontSize: 11, color: Colors.textMuted, fontWeight: '700' },
  activePillText: { color: Colors.primary },

  btnGroup: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: Colors.border,
  },
  demoBtn: { backgroundColor: `${Colors.secondary}15`, borderColor: `${Colors.secondary}40` },
  actionBtnText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },

  toast: {
    marginHorizontal: 20, marginBottom: 12, backgroundColor: `${Colors.secondary}25`,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.secondary, padding: 12, alignItems: 'center',
  },
  toastText: { color: Colors.secondary, fontSize: 12, fontWeight: '800' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, marginTop: 10, fontSize: 13 },

  listContent: { paddingHorizontal: 20, paddingBottom: 32 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  unreadCard: {
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
    borderColor: 'rgba(0, 212, 255, 0.25)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  typeIcon:   { fontSize: 24 },
  messageText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 19 },
  unreadMessageText: { color: Colors.textPrimary, fontWeight: '700' },
  timeText: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },

  unreadDot: {
    width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.primary, marginLeft: 6,
  },

  emptyBox: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginVertical: 20,
  },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
});
