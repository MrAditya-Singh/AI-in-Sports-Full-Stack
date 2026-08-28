/**
 * ATHLETIX — useNotifications Hook
 * hooks/useNotifications.ts
 *
 * Handles:
 * - Notification list
 * - Unread count
 * - Auto-refresh polling
 * - Mark one/all as read
 * - Optimistic updates with rollback
 * - User-friendly errors
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationItem,
  sendTestNotification,
} from '../services/notificationService';

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    typeof error === 'object' &&
    error !== null
  ) {
    const value = error as {
      userMessage?: string;
      message?: string;
    };

    return (
      value.userMessage ??
      value.message ??
      fallback
    );
  }

  return fallback;
}

export function useNotifications() {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [actionLoadingId, setActionLoadingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const mountedRef = useRef(true);

  /**
   * Latest notifications fetch karta hai.
   */
  const load = useCallback(
    async (silent = false): Promise<void> => {
      if (!silent) {
        setIsLoading(true);
      }

      setError(null);

      try {
        const data =
          await getNotifications();

        if (!mountedRef.current) {
          return;
        }

        setNotifications(
          data.notifications,
        );

        setUnreadCount(
          data.unread_count,
        );
      } catch (caughtError: unknown) {
        if (!mountedRef.current) {
          return;
        }

        setError(
          getErrorMessage(
            caughtError,
            'Could not load notifications.',
          ),
        );
      } finally {
        if (mountedRef.current) {
          if (!silent) {
            setIsLoading(false);
          }

          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  /**
   * Initial load and polling every 20 seconds.
   */
  useEffect(() => {
    mountedRef.current = true;

    void load();

    const intervalId = setInterval(
      () => {
        void load(true);
      },
      20_000,
    );

    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [load]);

  /**
   * Pull-to-refresh.
   */
  const refreshNotifications =
    useCallback(async (): Promise<void> => {
      setIsRefreshing(true);
      await load(true);
    }, [load]);

  /**
   * Marks one unread notification as read.
   */
  const markRead = useCallback(
    async (
      notificationId: string,
    ): Promise<void> => {
      const notification =
        notifications.find(
          (item) =>
            item.id === notificationId,
        );

      // Missing/already-read notification par kuch nahi karna.
      if (
        !notification ||
        notification.is_read
      ) {
        return;
      }

      setActionLoadingId(
        notificationId,
      );

      setError(null);

      // Optimistic update.
      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (item) =>
              item.id === notificationId
                ? {
                  ...item,
                  is_read: true,
                }
                : item,
          ),
      );

      setUnreadCount(
        (currentCount) =>
          Math.max(
            0,
            currentCount - 1,
          ),
      );

      try {
        await markNotificationAsRead(
          notificationId,
        );
      } catch (caughtError: unknown) {
        setError(
          getErrorMessage(
            caughtError,
            'Could not mark notification as read.',
          ),
        );

        // Server state fetch karke optimistic update rollback.
        await load(true);
      } finally {
        if (mountedRef.current) {
          setActionLoadingId(null);
        }
      }
    },
    [
      load,
      notifications,
    ],
  );

  /**
   * Marks all unread notifications as read.
   */
  const markAllRead =
    useCallback(async (): Promise<void> => {
      if (unreadCount === 0) {
        return;
      }

      const previousNotifications =
        notifications;

      const previousUnreadCount =
        unreadCount;

      setActionLoadingId('all');
      setError(null);

      // Optimistic update.
      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (item) => ({
              ...item,
              is_read: true,
            }),
          ),
      );

      setUnreadCount(0);

      try {
        await markAllNotificationsAsRead();
      } catch (caughtError: unknown) {
        setError(
          getErrorMessage(
            caughtError,
            'Could not mark all notifications as read.',
          ),
        );

        // Rollback.
        setNotifications(
          previousNotifications,
        );

        setUnreadCount(
          previousUnreadCount,
        );

        await load(true);
      } finally {
        if (mountedRef.current) {
          setActionLoadingId(null);
        }
      }
    }, [
      load,
      notifications,
      unreadCount,
    ]);

  /**
   * Creates development test notification.
   */
  const triggerDemoAlert =
    useCallback(async (): Promise<void> => {
      setActionLoadingId('demo');
      setError(null);

      try {
        const createdNotification =
          await sendTestNotification(
            'Your AI performance report is ready!',
            'report_ready',
          );

        setNotifications(
          (currentNotifications) => [
            createdNotification,
            ...currentNotifications.filter(
              (item) =>
                item.id !==
                createdNotification.id,
            ),
          ],
        );

        if (!createdNotification.is_read) {
          setUnreadCount(
            (currentCount) =>
              currentCount + 1,
          );
        }
      } catch (caughtError: unknown) {
        setError(
          getErrorMessage(
            caughtError,
            'Could not create test notification.',
          ),
        );

        throw caughtError;
      } finally {
        if (mountedRef.current) {
          setActionLoadingId(null);
        }
      }
    }, []);

  return {
    notifications,
    unreadCount,

    isLoading,
    isRefreshing,
    actionLoadingId,
    error,

    refreshNotifications,
    markRead,
    markAllRead,
    triggerDemoAlert,
  };
}