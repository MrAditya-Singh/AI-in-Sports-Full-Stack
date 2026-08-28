/**
 * ATHLETIX — Design System Colors & Multi-Theme Engine
 * constants/colors.ts
 *
 * Provides curated, vibrant palettes for Dark and Light modes:
 * - Dark Mode: Deep obsidian navy (#0A0E1A) with electric cyan (#00D4FF) and neon lime (#39FF14).
 * - Light Mode: Clean slate (#F8FAFC) with vibrant sapphire (#0284C7), emerald (#059669), and high-contrast text.
 */

export const DarkColors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  background:       '#0A0E1A',  // deep navy — app background
  backgroundSecondary: '#0E1526', // secondary containers
  surface:          '#131929',  // cards, modals
  surfaceElevated:  '#1C2539',  // elevated surfaces, drawers
  surfaceGlass:     'rgba(19, 25, 41, 0.75)',

  // ── Brand ─────────────────────────────────────────────────────────────────
  primary:          '#00D4FF',  // electric blue — primary actions, CTAs
  primaryDark:      '#0099BB',  // pressed / active state
  primaryLight:     '#5CE1E6',
  primaryGlow:      'rgba(0, 212, 255, 0.25)',
  secondary:        '#39FF14',  // neon green — success, scores, rep counts
  secondaryDark:    '#28CC0F',
  secondaryGlow:    'rgba(57, 255, 20, 0.22)',
  accent:           '#8B5CF6',  // electric purple

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimary:      '#FFFFFF',
  textSecondary:    '#A0AABF',
  textMuted:        '#5C6680',
  textInverse:      '#0A0E1A',

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
  borderLight:      '#263550',
  borderFocused:    '#00D4FF',

  // ── Transparent overlays & Gradients ──────────────────────────────────────
  overlay:          'rgba(0, 212, 255, 0.08)',
  overlayStrong:    'rgba(0, 0, 0, 0.65)',
  gradientMain:     ['#0A0E1A', '#0D1527', '#0A0E1A'] as readonly [string, string, string],
  gradientCard:     ['#131929', '#172033'] as readonly [string, string],
  gradientHero:     ['rgba(0, 212, 255, 0.15)', 'rgba(57, 255, 20, 0.04)'] as readonly [string, string],
  cardShadow:       'rgba(0, 0, 0, 0.45)',
} as const;

export const LightColors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  background:       '#F4F6FB',  // soft crisp slate
  backgroundSecondary: '#EAEFF8',
  surface:          '#FFFFFF',  // pure white cards
  surfaceElevated:  '#F0F4FA',  // soft elevated card layers
  surfaceGlass:     'rgba(255, 255, 255, 0.85)',

  // ── Brand ─────────────────────────────────────────────────────────────────
  primary:          '#0284C7',  // vivid electric sapphire
  primaryDark:      '#0369A1',
  primaryLight:     '#38BDF8',
  primaryGlow:      'rgba(2, 132, 199, 0.2)',
  secondary:        '#059669',  // vibrant emerald green
  secondaryDark:    '#047857',
  secondaryGlow:    'rgba(5, 150, 105, 0.18)',
  accent:           '#7C3AED',  // vibrant royal purple

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimary:      '#0F172A',  // high contrast deep slate
  textSecondary:    '#475569',  // readable mid slate
  textMuted:        '#8492A6',  // muted labels
  textInverse:      '#FFFFFF',

  // ── Status ────────────────────────────────────────────────────────────────
  success:          '#059669',
  warning:          '#D97706',
  error:            '#DC2626',
  info:             '#0284C7',

  // ── Leaderboard ───────────────────────────────────────────────────────────
  gold:             '#D97706',
  silver:           '#64748B',
  bronze:           '#B45309',

  // ── Borders / Dividers ────────────────────────────────────────────────────
  border:           '#E2E8F0',
  borderLight:      '#EDF2F7',
  borderFocused:    '#0284C7',

  // ── Transparent overlays & Gradients ──────────────────────────────────────
  overlay:          'rgba(2, 132, 199, 0.08)',
  overlayStrong:    'rgba(15, 23, 42, 0.4)',
  gradientMain:     ['#F4F6FB', '#EAEFF8', '#F4F6FB'] as readonly [string, string, string],
  gradientCard:     ['#FFFFFF', '#F8FAFC'] as readonly [string, string],
  gradientHero:     ['rgba(2, 132, 199, 0.12)', 'rgba(5, 150, 105, 0.08)'] as readonly [string, string],
  cardShadow:       'rgba(15, 23, 42, 0.08)',
} as const;

export type ThemeColors = {
  [K in keyof typeof DarkColors]: (typeof DarkColors)[K] extends readonly [infer A, infer B, ...(infer Rest)]
    ? readonly [string, string, ...string[]]
    : (typeof DarkColors)[K] extends readonly [infer A, infer B]
    ? readonly [string, string]
    : string;
};

export type ThemeMode = 'dark' | 'light' | 'system';

export function getThemeColors(isDark: boolean): ThemeColors {
  return (isDark ? DarkColors : LightColors) as unknown as ThemeColors;
}

// Default export is DarkColors for backward compatibility across existing static styles
export const Colors = DarkColors;
export type ColorKey = keyof typeof DarkColors;
