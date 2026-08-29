/**
 * ATHLETIX — Bento Grid Container Card
 * components/BentoCard.tsx
 *
 * Features:
 * - Tactile Neomorphic surface with soft dual highlights/shadows
 * - Responsive Bento Grid spans (full width, half width, compact)
 * - Accent glows (cyan, lime, purple, gold)
 * - Press interaction with subtle micro-scale feedback
 */

import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

export type BentoGlowVariant = 'cyan' | 'lime' | 'purple' | 'gold' | 'none';

interface BentoCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  glow?: BentoGlowVariant;
  onPress?: () => void;
  span?: 'full' | 'half' | 'third';
  disabled?: boolean;
}

export default function BentoCard({
  children,
  style,
  contentStyle,
  glow = 'none',
  onPress,
  span = 'full',
  disabled = false,
}: BentoCardProps) {
  const { colors, isDark } = useTheme();

  const glowBorderColor = React.useMemo(() => {
    switch (glow) {
      case 'cyan':
        return isDark ? 'rgba(0, 212, 255, 0.45)' : 'rgba(2, 132, 199, 0.45)';
      case 'lime':
        return isDark ? 'rgba(57, 255, 20, 0.45)' : 'rgba(5, 150, 105, 0.45)';
      case 'purple':
        return isDark ? 'rgba(139, 92, 246, 0.45)' : 'rgba(124, 58, 237, 0.45)';
      case 'gold':
        return isDark ? 'rgba(255, 215, 0, 0.5)' : 'rgba(217, 119, 6, 0.45)';
      default:
        return colors.bentoCardBorder;
    }
  }, [glow, isDark, colors]);

  const glowBg = React.useMemo(() => {
    switch (glow) {
      case 'cyan':
        return colors.bentoGlowCyan;
      case 'lime':
        return colors.bentoGlowLime;
      case 'purple':
        return colors.bentoGlowPurple;
      case 'gold':
        return isDark ? 'rgba(255, 215, 0, 0.08)' : 'rgba(217, 119, 6, 0.06)';
      default:
        return 'transparent';
    }
  }, [glow, colors, isDark]);

  const spanFlexStyle: ViewStyle = React.useMemo(() => {
    if (span === 'half') {
      return { flex: 1, minWidth: 150 };
    }
    if (span === 'third') {
      return { flex: 1, minWidth: 100 };
    }
    return { width: '100%' };
  }, [span]);

  const ContainerComponent = onPress ? Pressable : View;

  return (
    <ContainerComponent
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }: { pressed?: boolean } = {}) => [
        styles.outerContainer,
        spanFlexStyle,
        {
          borderColor: glowBorderColor,
          backgroundColor: colors.bentoCardBg,
          shadowColor: isDark ? '#000' : '#64748B',
          shadowOpacity: isDark ? 0.35 : 0.12,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 14,
          elevation: isDark ? 6 : 3,
          transform: pressed ? [{ scale: 0.985 }] : [{ scale: 1 }],
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255,255,255,0.035)', 'rgba(0,0,0,0.25)']
            : ['rgba(255,255,255,0.85)', 'rgba(240,244,250,0.5)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientOverlay}
      >
        {glow !== 'none' && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: glowBg, pointerEvents: 'none' },
            ]}
          />
        )}
        <View style={[styles.innerContent, contentStyle]}>{children}</View>
      </LinearGradient>
    </ContainerComponent>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: 22,
    borderWidth: 1.2,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientOverlay: {
    flex: 1,
    borderRadius: 21,
    overflow: 'hidden',
  },
  innerContent: {
    padding: 18,
  },
});
