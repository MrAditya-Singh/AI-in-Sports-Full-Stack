/**
 * ATHLETIX — Innovative Vector Icon System
 * components/InnovativeIcon.tsx
 *
 * Replaces traditional emojis with sleek, futuristic, minimalist vector icons
 * powered by @expo/vector-icons (Feather, Ionicons, MaterialCommunityIcons).
 */

import React from 'react';
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export type InnovativeIconName =
  | 'pulse'
  | 'activity'
  | 'camera'
  | 'video'
  | 'shield-check'
  | 'shield'
  | 'trophy'
  | 'medal'
  | 'award'
  | 'target'
  | 'zap'
  | 'user'
  | 'settings'
  | 'logout'
  | 'bar-chart'
  | 'trending-up'
  | 'file-text'
  | 'arrow-right'
  | 'arrow-left'
  | 'arrow-up-right'
  | 'check-circle'
  | 'alert-circle'
  | 'clock'
  | 'plus'
  | 'trash'
  | 'crosshair'
  | 'layers'
  | 'cpu'
  | 'sparkles'
  | 'dumbell'
  | 'run'
  | 'refresh';

interface InnovativeIconProps {
  name: InnovativeIconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function InnovativeIcon({
  name,
  size = 20,
  color,
  style,
  containerStyle,
}: InnovativeIconProps) {
  const { colors } = useTheme();
  const iconColor = color || colors.textPrimary;

  const renderIcon = () => {
    switch (name) {
      case 'pulse':
        return <Ionicons name="pulse-outline" size={size} color={iconColor} style={style} />;
      case 'activity':
        return <Feather name="activity" size={size} color={iconColor} style={style} />;
      case 'camera':
        return <Feather name="camera" size={size} color={iconColor} style={style} />;
      case 'video':
        return <Feather name="video" size={size} color={iconColor} style={style} />;
      case 'shield-check':
        return <Ionicons name="shield-checkmark-outline" size={size} color={iconColor} style={style} />;
      case 'shield':
        return <Ionicons name="shield-outline" size={size} color={iconColor} style={style} />;
      case 'trophy':
        return <Ionicons name="trophy-outline" size={size} color={iconColor} style={style} />;
      case 'medal':
        return <Ionicons name="medal-outline" size={size} color={iconColor} style={style} />;
      case 'award':
        return <Feather name="award" size={size} color={iconColor} style={style} />;
      case 'target':
        return <Feather name="target" size={size} color={iconColor} style={style} />;
      case 'zap':
        return <Ionicons name="flash-outline" size={size} color={iconColor} style={style} />;
      case 'user':
        return <Feather name="user" size={size} color={iconColor} style={style} />;
      case 'settings':
        return <Feather name="sliders" size={size} color={iconColor} style={style} />;
      case 'logout':
        return <Feather name="log-out" size={size} color={iconColor} style={style} />;
      case 'bar-chart':
        return <Feather name="bar-chart-2" size={size} color={iconColor} style={style} />;
      case 'trending-up':
        return <Feather name="trending-up" size={size} color={iconColor} style={style} />;
      case 'file-text':
        return <Feather name="file-text" size={size} color={iconColor} style={style} />;
      case 'arrow-right':
        return <Feather name="arrow-right" size={size} color={iconColor} style={style} />;
      case 'arrow-left':
        return <Feather name="arrow-left" size={size} color={iconColor} style={style} />;
      case 'arrow-up-right':
        return <Feather name="arrow-up-right" size={size} color={iconColor} style={style} />;
      case 'check-circle':
        return <Ionicons name="checkmark-circle-outline" size={size} color={iconColor} style={style} />;
      case 'alert-circle':
        return <Ionicons name="alert-circle-outline" size={size} color={iconColor} style={style} />;
      case 'clock':
        return <Feather name="clock" size={size} color={iconColor} style={style} />;
      case 'plus':
        return <Feather name="plus" size={size} color={iconColor} style={style} />;
      case 'trash':
        return <Feather name="trash-2" size={size} color={iconColor} style={style} />;
      case 'crosshair':
        return <Feather name="crosshair" size={size} color={iconColor} style={style} />;
      case 'layers':
        return <Feather name="layers" size={size} color={iconColor} style={style} />;
      case 'cpu':
        return <Feather name="cpu" size={size} color={iconColor} style={style} />;
      case 'sparkles':
        return <Ionicons name="sparkles-outline" size={size} color={iconColor} style={style} />;
      case 'dumbell':
        return <MaterialCommunityIcons name="dumbbell" size={size} color={iconColor} style={style} />;
      case 'run':
        return <MaterialCommunityIcons name="run-fast" size={size} color={iconColor} style={style} />;
      case 'refresh':
        return <Feather name="refresh-cw" size={size} color={iconColor} style={style} />;
      default:
        return <Feather name="circle" size={size} color={iconColor} style={style} />;
    }
  };

  if (containerStyle) {
    return <View style={containerStyle}>{renderIcon()}</View>;
  }

  return renderIcon();
}
