/**
 * ATHLETIX — NotificationBell Component (Phase 7)
 * components/NotificationBell.tsx
 *
 * Interactive bell icon with an unread badge indicator counter (`🔴 3`).
 * Clicking the bell opens the Notification Center screen.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useNotifications } from '../hooks/useNotifications';
import { Colors } from '../constants/colors';

export default function NotificationBell({ routeTarget }: { routeTarget?: string }) {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const handlePress = () => {
    if (routeTarget) {
      router.push(routeTarget as any);
    } else {
      router.push('/(athlete)/notifications' as any);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.75 }]}
      onPress={handlePress}
    >
      <Text style={styles.bellIcon}>🔔</Text>

      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8, borderRadius: 12, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border, position: 'relative',
    justifyContent: 'center', alignItems: 'center', minWidth: 40, minHeight: 40,
  },
  bellIcon: { fontSize: 18 },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.error, borderRadius: 10,
    minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, borderWidth: 1.5, borderColor: Colors.background,
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
});
