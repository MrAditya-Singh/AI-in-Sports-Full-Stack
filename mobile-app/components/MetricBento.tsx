/**
 * ATHLETIX — Metric Bento Widget
 * components/MetricBento.tsx
 *
 * Compact 1x1 or 2x1 data widget for quick analytics, reps, scores, and streaks.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BentoCard, { BentoGlowVariant } from './BentoCard';
import { useTheme } from '../hooks/useTheme';

interface MetricBentoProps {
  label: string;
  value: string | number;
  icon: string;
  subtitle?: string;
  badge?: string;
  glow?: BentoGlowVariant;
  onPress?: () => void;
  span?: 'full' | 'half' | 'third';
}

export default function MetricBento({
  label,
  value,
  icon,
  subtitle,
  badge,
  glow = 'none',
  onPress,
  span = 'half',
}: MetricBentoProps) {
  const { colors, isDark } = useTheme();

  return (
    <BentoCard glow={glow} onPress={onPress} span={span}>
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.04)',
            },
          ]}
        >
          <Text style={styles.icon}>{icon}</Text>
        </View>
        {badge ? (
          <View
            style={[
              styles.badgeContainer,
              {
                backgroundColor: isDark
                  ? 'rgba(0, 212, 255, 0.15)'
                  : 'rgba(2, 132, 199, 0.12)',
                borderColor: isDark
                  ? 'rgba(0, 212, 255, 0.3)'
                  : 'rgba(2, 132, 199, 0.25)',
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: isDark ? colors.primary : colors.primaryDark },
              ]}
            >
              {badge}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text
          style={[styles.label, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text style={[styles.value, { color: colors.textPrimary }]}>
          {value}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </BentoCard>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  body: {
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
