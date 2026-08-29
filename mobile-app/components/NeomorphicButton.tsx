/**
 * ATHLETIX — Neomorphic Interactive Button
 * components/NeomorphicButton.tsx
 *
 * Features:
 * - Tactile Embossed & Debossed states
 * - Gradient brand fills (Primary Cyan, Secondary Lime, Accent Purple, Dark Glass)
 * - Micro-interaction scale feedback
 * - Built-in ActivityIndicator
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'glass' | 'danger';

interface NeomorphicButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: string | React.ReactNode;
  iconRight?: string | React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: 'sm' | 'md' | 'lg';
}

export default function NeomorphicButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  style,
  textStyle,
  size = 'md',
}: NeomorphicButtonProps) {
  const { colors, isDark } = useTheme();

  const gradientColors = React.useMemo((): [string, string] => {
    if (!isDark) {
      if (variant === 'glass') {
        return ['#FFFFFF', '#F7F4EE'];
      }
      return ['#111111', '#1A1A1A'];
    }
    switch (variant) {
      case 'primary':
        return ['#00D4FF', '#0099BB'];
      case 'secondary':
        return ['#39FF14', '#28CC0F'];
      case 'accent':
        return ['#8B5CF6', '#6D28D9'];
      case 'danger':
        return ['#FF4444', '#CC1111'];
      case 'glass':
      default:
        return ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'];
    }
  }, [variant, isDark]);

  const textColor = React.useMemo(() => {
    if (!isDark) {
      return variant === 'glass' ? '#111111' : '#F7F4EE';
    }
    if (variant === 'glass') {
      return colors.textPrimary;
    }
    if (variant === 'secondary') {
      return '#0A0E1A'; // High contrast black on bright neon lime
    }
    return '#FFFFFF';
  }, [variant, isDark, colors]);

  const paddingVertical = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const paddingHorizontal = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.baseButton,
        {
          opacity: disabled ? 0.45 : 1,
          transform: pressed && !disabled ? [{ scale: 0.98 }] : [{ scale: 1 }],
          shadowColor: isDark ? '#000000' : (variant === 'glass' ? '#B8B0A0' : '#111111'),
          shadowOpacity: isDark ? 0.4 : 0.25,
          shadowOffset: { width: 2, height: 6 },
          shadowRadius: 12,
          elevation: isDark ? 5 : 3,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          {
            paddingVertical,
            paddingHorizontal,
            borderColor:
              variant === 'glass'
                ? colors.border
                : isDark
                ? 'rgba(255,255,255,0.2)'
                : '#111111',
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <View style={styles.contentRow}>
            {typeof icon === 'string' ? (
              <Text style={[styles.iconText, { color: textColor }]}>{icon}</Text>
            ) : (
              icon
            )}
            <Text
              style={[
                styles.buttonText,
                { color: textColor, fontSize },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {typeof iconRight === 'string' ? (
              <Text style={[styles.iconText, { color: textColor }]}>{iconRight}</Text>
            ) : (
              iconRight
            )}
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  iconText: {
    fontSize: 16,
  },
});
