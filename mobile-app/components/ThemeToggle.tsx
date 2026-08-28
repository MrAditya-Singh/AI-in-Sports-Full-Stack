/**
 * ATHLETIX — ThemeToggle Component
 * components/ThemeToggle.tsx
 *
 * Micro-animated glassmorphism button for quick switching between Dark and Light modes.
 */

import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  style?: ViewStyle;
  showLabel?: boolean;
  compact?: boolean;
}

export default function ThemeToggle({
  style,
  showLabel = false,
  compact = false,
}: ThemeToggleProps) {
  const { isDark, toggleTheme, colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      rotateAnim.setValue(0);
    });

    void toggleTheme();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        compact ? styles.compactContainer : styles.standardContainer,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: isDark ? 'rgba(0, 212, 255, 0.35)' : 'rgba(2, 132, 199, 0.25)',
          shadowColor: isDark ? '#00D4FF' : '#0F172A',
        },
        pressed && styles.pressed,
        style,
      ]}
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      accessibilityRole="button"
    >
      <Animated.View
        style={[
          styles.iconWrap,
          {
            transform: [{ scale: scaleAnim }, { rotate: spin }],
          },
        ]}
      >
        <Text style={styles.iconText}>
          {isDark ? '☀️' : '🌙'}
        </Text>
      </Animated.View>

      {showLabel ? (
        <Text
          style={[
            styles.labelText,
            { color: colors.textSecondary },
          ]}
        >
          {isDark ? 'Light' : 'Dark'}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  compactContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 0,
  },
  standardContainer: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 12,
    gap: 6,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});
