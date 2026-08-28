/**
 * ATHLETIX — Notification Bell
 * components/NotificationBell.tsx
 *
 * Features:
 * - Opens Notification Center
 * - Shows unread notification count
 * - Dynamic light/dark theme styling
 * - Includes accessibility labels
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifications } from '../hooks/useNotifications';
import { useTheme } from '../hooks/useTheme';

export interface NotificationBellProps {
  routeTarget?: string;
}

export default function NotificationBell({
  routeTarget = '/(athlete)/notifications',
}: NotificationBellProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const {
    unreadCount,
    isLoading,
    error,
  } = useNotifications();

  const badgeText =
    unreadCount > 99
      ? '99+'
      : String(unreadCount);

  const accessibilityLabel =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : 'Notifications, no unread notifications';

  const handlePress = () => {
    router.push(routeTarget as any);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: isDark ? colors.border : 'rgba(15, 23, 42, 0.12)',
          shadowColor: isDark ? '#000000' : '#0F172A',
        },
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens the notification center"
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={colors.primary}
        />
      ) : (
        <Text style={styles.bellIcon}>
          🔔
        </Text>
      )}

      {!isLoading && unreadCount > 0 ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.error,
              borderColor: colors.background,
            },
          ]}
        >
          <Text style={styles.badgeText}>
            {badgeText}
          </Text>
        </View>
      ) : null}

      {!isLoading && error ? (
        <View
          style={[
            styles.errorDot,
            {
              backgroundColor: colors.warning,
              borderColor: colors.background,
            },
          ]}
        >
          <Text style={styles.errorDotText}>
            !
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    minWidth: 42,
    minHeight: 42,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },

  bellIcon: {
    fontSize: 18,
  },

  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },

  errorDot: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorDotText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: '900',
  },
});