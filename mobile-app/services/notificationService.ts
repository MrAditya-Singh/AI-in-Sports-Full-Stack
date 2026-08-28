/**
 * ATHLETIX — Notification Service
 * services/notificationService.ts
 *
 * Handles notification list, unread count, mark-as-read,
 * mark-all-read and development test notifications.
 */

import api from './api';

export type NotificationType =
  | 'report_ready'
  | 'verified'
  | 'shortlisted'
  | 'verification_pending'
  | 'verification_approved'
  | 'verification_rejected'
  | 'general';

export interface NotificationItem {
  id: string;
  user_id: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface NotificationResponseData {
  unread_count: number;
  notifications: NotificationItem[];
}

export interface MarkReadResult {
  message: string;
  notification_id: string;
  already_read: boolean;
}

export interface MarkAllReadResult {
  message: string;
  updated_count: number;
}

const VALID_NOTIFICATION_TYPES: ReadonlySet<NotificationType> =
  new Set<NotificationType>([
    'report_ready',
    'verified',
    'shortlisted',
    'verification_pending',
    'verification_approved',
    'verification_rejected',
    'general',
  ]);

/**
 * Backend notification object ko safely validate aur normalize karta hai.
 */
function normalizeNotification(
  raw: unknown,
): NotificationItem | null {
  if (
    typeof raw !== 'object' ||
    raw === null
  ) {
    return null;
  }

  const item = raw as Record<string, unknown>;

  if (
    typeof item.id !== 'string' ||
    typeof item.user_id !== 'string' ||
    typeof item.message !== 'string' ||
    typeof item.created_at !== 'string'
  ) {
    return null;
  }

  const rawType =
    typeof item.type === 'string'
      ? item.type
      : 'general';

  const type: NotificationType =
    VALID_NOTIFICATION_TYPES.has(
      rawType as NotificationType,
    )
      ? (rawType as NotificationType)
      : 'general';

  return {
    id: item.id,
    user_id: item.user_id,
    message: item.message,
    type,
    is_read: item.is_read === true,
    created_at: item.created_at,
  };
}

/**
 * Authenticated user's notification list aur total unread count fetch karta hai.
 */
export async function getNotifications(
  limit = 50,
): Promise<NotificationResponseData> {
  const safeLimit = Math.min(
    100,
    Math.max(1, Math.floor(limit)),
  );

  const response = await api.get(
    '/notifications',
    {
      params: {
        limit: safeLimit,
      },
    },
  );

  const data = response.data?.data;
  const rawNotifications = data?.notifications;

  const notifications =
    Array.isArray(rawNotifications)
      ? rawNotifications
          .map(normalizeNotification)
          .filter(
            (
              item,
            ): item is NotificationItem =>
              item !== null,
          )
      : [];

  const parsedUnreadCount = Number(
    data?.unread_count,
  );

  const unreadCount =
    Number.isFinite(parsedUnreadCount)
      ? Math.max(0, parsedUnreadCount)
      : notifications.filter(
          (item) => !item.is_read,
        ).length;

  return {
    unread_count: unreadCount,
    notifications,
  };
}

/**
 * One owned notification ko read mark karta hai.
 */
export async function markNotificationAsRead(
  notificationId: string,
): Promise<MarkReadResult> {
  const cleanedId = notificationId.trim();

  if (!cleanedId) {
    throw new Error(
      'Notification ID is required.',
    );
  }

  const response = await api.put(
    `/notifications/${encodeURIComponent(
      cleanedId,
    )}/read`,
  );

  const data = response.data?.data;

  return {
    message:
      typeof data?.message === 'string'
        ? data.message
        : 'Notification marked as read.',

    notification_id:
      typeof data?.notification_id === 'string'
        ? data.notification_id
        : cleanedId,

    already_read:
      data?.already_read === true,
  };
}

/**
 * Current user's all unread notifications ko read mark karta hai.
 */
export async function markAllNotificationsAsRead():
Promise<MarkAllReadResult> {
  const response = await api.put(
    '/notifications/read-all',
  );

  const data = response.data?.data;
  const parsedUpdatedCount = Number(
    data?.updated_count,
  );

  return {
    message:
      typeof data?.message === 'string'
        ? data.message
        : 'All notifications marked as read.',

    updated_count:
      Number.isFinite(parsedUpdatedCount)
        ? Math.max(0, parsedUpdatedCount)
        : 0,
  };
}

/**
 * Development environment me test notification generate karta hai.
 */
export async function sendTestNotification(
  message = 'Your AI performance report is ready!',
  type: NotificationType = 'general',
): Promise<NotificationItem> {
  const cleanedMessage = message.trim();

  if (!cleanedMessage) {
    throw new Error(
      'Notification message cannot be blank.',
    );
  }

  const response = await api.post(
    '/notifications/test',
    {
      message: cleanedMessage,
      type_str: type,
    },
  );

  const rawNotification =
    response.data?.data?.notification;

  const notification =
    normalizeNotification(rawNotification);

  if (!notification) {
    throw new Error(
      'Backend returned an invalid notification.',
    );
  }

  return notification;
}

/**
 * Expo push token ko backend pe register karta hai.
 */
export async function registerPushToken(
  token: string,
): Promise<void> {
  const cleaned = token.trim();

  if (!cleaned) {
    return;
  }

  await api.post('/push-tokens', {
    token: cleaned,
    platform: 'expo',
  });
}

/**
 * Logout ke time push token backend se remove karta hai.
 */
export async function unregisterPushToken(
  token: string,
): Promise<void> {
  const cleaned = token.trim();

  if (!cleaned) {
    return;
  }

  await api.delete('/push-tokens', {
    data: { token: cleaned },
  });
}