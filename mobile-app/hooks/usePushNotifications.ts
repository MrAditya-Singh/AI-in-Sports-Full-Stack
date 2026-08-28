/**
 * ATHLETIX — usePushNotifications Hook
 * hooks/usePushNotifications.ts
 *
 * Handles:
 * - Push notification permission request
 * - Expo push token registration with backend
 * - Foreground notification display
 * - Notification tap → navigate to notification center
 * - Cleanup on unmount
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import {
  registerPushToken,
} from '../services/notificationService';

// Show notifications even when app is in foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldFlashScreen: false,
  }),
});

/**
 * Registers for Expo push notifications and saves token
 * to the backend. Also handles notification tap navigation.
 *
 * Call this once from root _layout.tsx.
 */
export function usePushNotifications() {
  const router = useRouter();

  const notificationResponseRef =
    useRef<Notifications.Subscription | null>(
      null,
    );

  const notificationReceivedRef =
    useRef<Notifications.Subscription | null>(
      null,
    );

  useEffect(() => {
    // Register for push token.
    void registerForPushNotifications();

    // Listen for notification taps.
    notificationResponseRef.current =
      Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data =
            response.notification.request
              .content.data;

          // Navigate to notification center or
          // a specific route if provided.
          const target =
            typeof data?.route === 'string'
              ? data.route
              : '/(athlete)/notifications';

          router.push(target as any);
        },
      );

    // Listen for foreground notifications (optional logging).
    notificationReceivedRef.current =
      Notifications.addNotificationReceivedListener(
        (_notification) => {
          // Foreground notification received.
          // The handler above will display it automatically.
        },
      );

    return () => {
      if (notificationResponseRef.current) {
        notificationResponseRef.current.remove();
      }

      if (notificationReceivedRef.current) {
        notificationReceivedRef.current.remove();
      }
    };
  }, [router]);
}

/**
 * Requests permission and registers the Expo push token
 * with the backend.
 */
async function registerForPushNotifications(): Promise<void> {
  try {
    // Check and request permissions.
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } =
        await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      // User denied push notifications — not an error.
      return;
    }

    // Android requires a notification channel.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(
        'default',
        {
          name: 'ATHLETIX Notifications',
          importance:
            Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00D4FF',
          sound: 'default',
        },
      );
    }

    // Get Expo push token.
    const projectId =
      Constants.expoConfig?.extra?.eas
        ?.projectId;

    const tokenResponse =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    const pushToken = tokenResponse.data;

    if (pushToken) {
      // Register with backend.
      await registerPushToken(pushToken);
    }
  } catch (error) {
    // Push token registration is non-critical.
    // App continues to work without push notifications.
    console.warn(
      'Push notification registration failed:',
      error,
    );
  }
}
