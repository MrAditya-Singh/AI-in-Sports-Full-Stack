/**
 * ATHLETIX — useNotifications Custom Hook (Phase 7)
 * hooks/useNotifications.ts
 *
 * Manages live notification list, unread count badge, mark as read,
 * and auto-refresh polling every 20 seconds.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  sendTestNotification,
  NotificationItem,
} from '../services/notificationService';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount]     = useState<number>(0);
  const [isLoading, setIsLoading]         = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing]   = useState<boolean>(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      // Graceful error fallback
    } finally {
      if (!silent) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Poll for new notifications every 20 seconds
    const interval = setInterval(() => load(true), 20_000);
    return () => clearInterval(interval);
  }, [load]);

  const markRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    await markNotificationAsRead(id).catch(() => load(true));
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead().catch(() => load(true));
  };

  const triggerDemoAlert = async () => {
    await sendTestNotification();
    await load(true);
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    refreshNotifications: () => {
      setIsRefreshing(true);
      load(true);
    },
    markRead,
    markAllRead,
    triggerDemoAlert,
  };
}
