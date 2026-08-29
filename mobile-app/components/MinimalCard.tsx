/**
 * ATHLETIX — Neomorphic Stream Card
 * components/MinimalCard.tsx
 *
 * Implements refined Neomorphism:
 * - Dual-layer soft ambient shadows + bevel highlights
 * - Tactile extrusion & micro-compression on press
 * - Seamless integration with the Dual-Tone palette
 */

import React from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface MinimalCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'elevated' | 'sunken' | 'darkBlock';
}

export default function MinimalCard({
  children,
  style,
  contentStyle,
  onPress,
  disabled = false,
  variant = 'elevated',
}: MinimalCardProps) {
  const { colors, isDark } = useTheme();

  const ContainerComponent = onPress ? Pressable : View;

  const cardBg = React.useMemo(() => {
    if (variant === 'darkBlock') {
      return isDark ? '#111726' : '#111111';
    }
    if (variant === 'sunken') {
      return isDark ? 'rgba(0,0,0,0.4)' : '#ECE7DC';
    }
    return isDark ? '#111726' : '#FDFCFA';
  }, [variant, isDark]);

  const cardBorder = React.useMemo(() => {
    if (variant === 'darkBlock') {
      return isDark ? 'rgba(255,255,255,0.1)' : '#111111';
    }
    if (variant === 'sunken') {
      return isDark ? 'rgba(0,0,0,0.6)' : '#DFD9CC';
    }
    return isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)';
  }, [variant, isDark]);

  return (
    <ContainerComponent
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }: { pressed?: boolean } = {}) => [
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
          shadowColor: isDark ? '#000000' : '#B8B0A0',
          shadowOpacity: isDark ? 0.45 : (variant === 'sunken' ? 0.05 : 0.22),
          shadowOffset:
            variant === 'sunken'
              ? { width: 0, height: 1 }
              : { width: 4, height: 8 },
          shadowRadius: variant === 'sunken' ? 4 : 16,
          elevation: isDark ? 5 : (variant === 'sunken' ? 1 : 3),
          transform: pressed ? [{ scale: 0.985 }] : [{ scale: 1 }],
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
    >
      <View style={[styles.content, contentStyle]}>{children}</View>
    </ContainerComponent>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1.2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  content: {
    padding: 18,
  },
});
