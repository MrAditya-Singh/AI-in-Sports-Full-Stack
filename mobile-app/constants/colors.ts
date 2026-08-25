/**
 * ATHLETIX — Design System Colors
 * constants/colors.ts
 *
 * Dark-first palette. Electric blue + neon green accents on deep navy.
 * Used by all screens and components — no ad-hoc color strings anywhere else.
 */

export const Colors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  background:       '#0A0E1A',  // deep navy — app background
  surface:          '#131929',  // cards, modals
  surfaceElevated:  '#1C2539',  // elevated surfaces, drawers

  // ── Brand ─────────────────────────────────────────────────────────────────
  primary:          '#00D4FF',  // electric blue — primary actions, CTAs
  primaryDark:      '#0099BB',  // pressed / active state
  secondary:        '#39FF14',  // neon green — success, scores, rep counts
  secondaryDark:    '#28CC0F',

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimary:      '#FFFFFF',
  textSecondary:    '#A0AABF',
  textMuted:        '#5C6680',

  // ── Status ────────────────────────────────────────────────────────────────
  success:          '#39FF14',
  warning:          '#FFB800',
  error:            '#FF4444',
  info:             '#00D4FF',

  // ── Leaderboard ───────────────────────────────────────────────────────────
  gold:             '#FFD700',
  silver:           '#C0C0C0',
  bronze:           '#CD7F32',

  // ── Borders / Dividers ────────────────────────────────────────────────────
  border:           '#1E2A40',
  borderFocused:    '#00D4FF',

  // ── Transparent overlays ──────────────────────────────────────────────────
  overlay:          'rgba(0, 212, 255, 0.08)',
  overlayStrong:    'rgba(0, 0, 0, 0.6)',
} as const;

export type ColorKey = keyof typeof Colors;
