/**
 * ATHLETIX — Notification Center
 * app/(athlete)/notifications.tsx
 *
 * Features:
 * - Notification list with All/Unread filters
 * - Read/unread indicators
 * - Dynamic Light/Dark theme support
 * - Mark one or all notifications as read
 * - Assessment, verification and shortlist notification types
 * - Pull-to-refresh
 * - Error and loading states
 * - Development-only demo notification
 */

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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

import ThemeToggle from '../../components/ThemeToggle';
import { useNotifications } from '../../hooks/useNotifications';
import { useTheme } from '../../hooks/useTheme';

import {
  NotificationItem,
  NotificationType,
} from '../../services/notificationService';

type NotificationFilter =
  | 'all'
  | 'unread';

function getNotificationIcon(
  type: NotificationType,
): string {
  switch (type) {
    case 'report_ready':
      return '🎯';

    case 'verified':
      return '🏅';

    case 'shortlisted':
      return '⭐';

    case 'verification_pending':
      return '⏳';

    case 'verification_approved':
      return '🛡️';

    case 'verification_rejected':
      return '❌';

    case 'general':
    default:
      return '📣';
  }
}

function getNotificationLabel(
  type: NotificationType,
): string {
  switch (type) {
    case 'report_ready':
      return 'Assessment ready';

    case 'verified':
      return 'Official verification';

    case 'shortlisted':
      return 'Shortlisted';

    case 'verification_pending':
      return 'Verification pending';

    case 'verification_approved':
      return 'Verification approved';

    case 'verification_rejected':
      return 'Verification rejected';

    case 'general':
    default:
      return 'General';
  }
}

function formatNotificationDate(
  dateString: string,
): string {
  try {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Just now';
    }

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    error,
    refreshNotifications,
    markRead,
    markAllRead,
    triggerDemoAlert,
  } = useNotifications();

  const [filter, setFilter] =
    useState<NotificationFilter>('all');

  const [actionLoadingId, setActionLoadingId] =
    useState<string | null>(null);

  const [toast, setToast] =
    useState<string | null>(null);

  const toastTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToast(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(
        (item) => !item.is_read,
      );
    }

    return notifications;
  }, [notifications, filter]);

  const handleMarkAllRead =
    async (): Promise<void> => {
      try {
        setActionLoadingId('all');
        await markAllRead();
        showToast('All notifications marked as read.');
      } catch {
        // Hook error banner handles failure.
      } finally {
        setActionLoadingId(null);
      }
    };

  const handleDemoAlert =
    async (): Promise<void> => {
      try {
        setActionLoadingId('demo');
        await triggerDemoAlert();
        showToast('Test notification created! 🔔');
      } catch {
        // Hook error banner handles failure.
      } finally {
        setActionLoadingId(null);
      }
    };

  const renderNotificationCard = ({
    item,
  }: {
    item: NotificationItem;
  }) => {
    const isActionLoading =
      actionLoadingId === item.id;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: item.is_read
              ? colors.border
              : isDark
              ? 'rgba(0,212,255,0.3)'
              : 'rgba(2,132,199,0.3)',
            shadowColor: colors.cardShadow,
          },
          !item.is_read && {
            backgroundColor: isDark
              ? 'rgba(0,212,255,0.06)'
              : 'rgba(2,132,199,0.06)',
          },
          pressed && !item.is_read && styles.pressedCard,
        ]}
        onPress={() => {
          if (!item.is_read) {
            void markRead(item.id);
          }
          if (
            item.type === 'verified' ||
            item.type === 'verification_pending' ||
            item.type === 'verification_approved' ||
            item.type === 'verification_rejected'
          ) {
            router.push('/(athlete)/verification' as any);
          } else if (item.type === 'report_ready') {
            router.push('/(athlete)/reports' as any);
          }
        }}
        disabled={isActionLoading}
      >
        <View style={styles.cardRow}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: item.is_read
                  ? isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
                  : `${colors.primary}18`,
              },
            ]}
          >
            <Text style={styles.typeIcon}>
              {getNotificationIcon(item.type)}
            </Text>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.labelRow}>
              <Text style={[styles.typeLabel, { color: colors.textMuted }]}>
                {getNotificationLabel(item.type)}
              </Text>

              {!item.is_read ? (
                <Text style={[styles.newLabel, { color: colors.primary }]}>
                  NEW
                </Text>
              ) : null}
            </View>

            <Text
              style={[
                styles.messageText,
                { color: colors.textSecondary },
                !item.is_read && [
                  styles.unreadMessageText,
                  { color: colors.textPrimary },
                ],
              ]}
            >
              {item.message}
            </Text>

            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {formatNotificationDate(item.created_at)}
            </Text>
          </View>

          {isActionLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
            />
          ) : !item.is_read ? (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          ) : (
            <Text style={[styles.readIcon, { color: colors.textMuted }]}>
              ✓
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <LinearGradient
      colors={colors.gradientMain}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.topNavRow}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={[styles.backText, { color: colors.primary }]}>
                ← Back
              </Text>
            </Pressable>

            <ThemeToggle compact />
          </View>

          <View style={styles.headerRow}>
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                NOTIFICATIONS 🔔
              </Text>

              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Assessment, verification and scouting updates
              </Text>
            </View>

            {unreadCount > 0 ? (
              <View
                style={[
                  styles.unreadBadge,
                  {
                    backgroundColor: `${colors.primary}20`,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.unreadBadgeText,
                    { color: colors.primary },
                  ]}
                >
                  {unreadCount > 99
                    ? '99+'
                    : unreadCount}{' '}
                  NEW
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Filters and actions */}
        <View style={styles.controlsRow}>
          <View style={styles.pillGroup}>
            <Pressable
              style={[
                styles.pill,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                filter === 'all' && [
                  styles.activePill,
                  {
                    backgroundColor: `${colors.primary}20`,
                    borderColor: colors.primary,
                  },
                ],
              ]}
              onPress={() => setFilter('all')}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: colors.textMuted },
                  filter === 'all' && [
                    styles.activePillText,
                    { color: colors.primary },
                  ],
                ]}
              >
                All ({notifications.length})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.pill,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                filter === 'unread' && [
                  styles.activePill,
                  {
                    backgroundColor: `${colors.primary}20`,
                    borderColor: colors.primary,
                  },
                ],
              ]}
              onPress={() => setFilter('unread')}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: colors.textMuted },
                  filter === 'unread' && [
                    styles.activePillText,
                    { color: colors.primary },
                  ],
                ]}
              >
                Unread ({unreadCount})
              </Text>
            </Pressable>
          </View>

          <View style={styles.actionGroup}>
            {unreadCount > 0 ? (
              <Pressable
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                  actionLoadingId === 'all' && styles.disabledButton,
                ]}
                onPress={() => void handleMarkAllRead()}
                disabled={actionLoadingId === 'all'}
              >
                {actionLoadingId === 'all' ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                  />
                ) : (
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Mark all read
                  </Text>
                )}
              </Pressable>
            ) : null}

            {/* Development demo trigger */}
            {__DEV__ ? (
              <Pressable
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: `${colors.secondary}15`,
                    borderColor: `${colors.secondary}40`,
                  },
                  actionLoadingId === 'demo' && styles.disabledButton,
                ]}
                onPress={() => void handleDemoAlert()}
                disabled={actionLoadingId === 'demo'}
              >
                {actionLoadingId === 'demo' ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.secondary}
                  />
                ) : (
                  <Text
                    style={[
                      styles.demoButtonText,
                      { color: colors.secondary },
                    ]}
                  >
                    + Demo
                  </Text>
                )}
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Error */}
        {error ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: `${colors.error}15`,
                borderColor: `${colors.error}40`,
              },
            ]}
          >
            <Text style={[styles.errorText, { color: colors.error }]}>
              ⚠ {error}
            </Text>

            <Pressable onPress={() => void refreshNotifications()}>
              <Text style={[styles.retryText, { color: colors.primary }]}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Success toast */}
        {toast ? (
          <View
            style={[
              styles.toast,
              {
                backgroundColor: `${colors.secondary}20`,
                borderColor: colors.secondary,
              },
            ]}
          >
            <Text style={[styles.toastText, { color: colors.secondary }]}>
              {toast}
            </Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Fetching notifications...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotificationCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => void refreshNotifications()}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View
                style={[
                  styles.emptyBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.emptyIcon}>
                  🔕
                </Text>

                <Text
                  style={[
                    styles.emptyTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  {filter === 'unread'
                    ? 'All Caught Up'
                    : 'No Notifications'}
                </Text>

                <Text
                  style={[
                    styles.emptySub,
                    { color: colors.textSecondary },
                  ]}
                >
                  {filter === 'unread'
                    ? 'You have read all your notifications.'
                    : 'Assessment, verification and shortlist updates will appear here.'}
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
  gradient: {
    flex: 1,
  },

  safe: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },

  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  backButton: {
    alignSelf: 'flex-start',
  },

  backText: {
    fontSize: 13,
    fontWeight: '600',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },

  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },

  unreadBadge: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
  },

  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  controlsRow: {
    paddingHorizontal: 20,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },

  pillGroup: {
    flexDirection: 'row',
    gap: 6,
  },

  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },

  activePill: {},

  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  activePillText: {},

  actionGroup: {
    flexDirection: 'row',
    gap: 6,
  },

  actionButton: {
    minHeight: 34,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionButtonText: {
    fontSize: 10,
    fontWeight: '700',
  },

  demoButtonText: {
    fontSize: 10,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.6,
  },

  errorBanner: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  errorText: {
    fontSize: 12,
    flex: 1,
  },

  retryText: {
    fontSize: 12,
    fontWeight: '800',
  },

  toast: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },

  toastText: {
    fontSize: 12,
    fontWeight: '800',
  },

  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },

  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  pressedCard: {
    opacity: 0.8,
  },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },

  typeIcon: {
    fontSize: 22,
  },

  cardContent: {
    flex: 1,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 3,
  },

  typeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  newLabel: {
    fontSize: 8,
    fontWeight: '900',
  },

  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },

  unreadMessageText: {
    fontWeight: '700',
  },

  timeText: {
    fontSize: 10,
    marginTop: 5,
  },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  readIcon: {
    fontSize: 13,
  },

  emptyBox: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    marginVertical: 20,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },

  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});