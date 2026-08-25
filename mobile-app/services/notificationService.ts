/**
 * ATHLETIX — Notification Service (Phase 7)
 * services/notificationService.ts
 *
 * API calls for fetching and managing user push & in-app notifications.
 */

import api from './api';

export type NotificationType = 'report_ready' | 'verified' | 'shortlisted' | 'general';

export interface NotificationItem {
  id:         string;
  user_id:    string;
  message:    string;
  type:       NotificationType;
  is_read:    boolean;
  created_at: string;
}

export interface NotificationResponseData {
  unread_count:  number;
  notifications: NotificationItem[];
}

/** Fetches user's notification list and unread count */
export async function getNotifications(): Promise<NotificationResponseData> {
  const response = await api.get('/notifications');
  return response.data.data;
}

/** Marks a single notification as read */
export async function markNotificationAsRead(id: string): Promise<void> {
  await api.put(`/notifications/${id}/read`);
}

/** Marks all notifications as read */
export async function markAllNotificationsAsRead(): Promise<void> {
  await api.put('/notifications/read-all');
}

/** Triggers a test notification (useful for testing & demo) */
export async function sendTestNotification(message?: string, type?: string): Promise<void> {
  await api.post('/notifications/test', {
    message: message ?? 'Your AI performance report is ready! 🎯',
    type_str: type ?? 'report_ready',
  });
}
