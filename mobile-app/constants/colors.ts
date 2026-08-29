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
  borderGlow:       'rgba(0, 212, 255, 0.4)',

  // ── Neomorphic & Bento Tokens ─────────────────────────────────────────────
  neoLightHighlight:'rgba(255, 255, 255, 0.07)',
  neoDarkShadow:    'rgba(0, 0, 0, 0.7)',
  neoEmbossBorder:  'rgba(255, 255, 255, 0.08)',
  bentoCardBg:      '#111726',
  bentoCardBorder:  '#1C253B',
  bentoHeaderBg:    'rgba(19, 25, 41, 0.85)',
  bentoGlowCyan:    'rgba(0, 212, 255, 0.12)',
  bentoGlowLime:    'rgba(57, 255, 20, 0.12)',
  bentoGlowPurple:  'rgba(139, 92, 246, 0.14)',

  // ── Transparent overlays & Gradients ──────────────────────────────────────
  overlay:          'rgba(0, 212, 255, 0.08)',
  overlayStrong:    'rgba(0, 0, 0, 0.65)',
  gradientMain:     ['#0A0E1A', '#0D1527', '#0A0E1A'] as readonly [string, string, string],
  gradientCard:     ['#111726', '#161F33'] as readonly [string, string],
  gradientHero:     ['rgba(0, 212, 255, 0.15)', 'rgba(57, 255, 20, 0.04)'] as readonly [string, string],
  gradientBento:    ['#131929', '#0E1424'] as readonly [string, string],
  cardShadow:       'rgba(0, 0, 0, 0.45)',
} as const;

export const LightColors = {
  // ── Backgrounds (Minimalist Ivory Cream) ──────────────────────────────────
  background:       '#F7F4EE',  // warm minimalist cream from image
  backgroundSecondary: '#EFECE4',
  surface:          '#FFFFFF',  // pure card surface
  surfaceElevated:  '#EBE7DD',  // elevated soft layer
  surfaceGlass:     'rgba(247, 244, 238, 0.92)',

  // ── Brand (Jet Black / Charcoal) ──────────────────────────────────────────
  primary:          '#111111',  // deep matte obsidian black
  primaryDark:      '#000000',
  primaryLight:     '#2A2A2A',
  primaryGlow:      'rgba(17, 17, 17, 0.15)',
  secondary:        '#111111',  // minimalist unified black
  secondaryDark:    '#000000',
  secondaryGlow:    'rgba(17, 17, 17, 0.1)',
  accent:           '#111111',

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimary:      '#111111',  // pure jet black
  textSecondary:    '#55524B',  // warm charcoal mid-tone
  textMuted:        '#8E8A80',  // muted stone label
  textInverse:      '#F7F4EE',  // cream on black

  // ── Status (Minimalist High-Contrast) ──────────────────────────────────────
  success:          '#111111',
  warning:          '#111111',
  error:            '#111111',
  info:             '#111111',

  // ── Leaderboard Podium ───────────────────────────────────────────────────
  gold:             '#111111',
  silver:           '#55524B',
  bronze:           '#8E8A80',

  // ── Borders / Dividers ────────────────────────────────────────────────────
  border:           '#E4DFD3',
  borderLight:      '#ECE8DE',
  borderFocused:    '#111111',
  borderGlow:       'rgba(17, 17, 17, 0.25)',

  // ── Neomorphic & Stream Card Tokens ───────────────────────────────────────
  neoLightHighlight:'rgba(255, 255, 255, 0.95)',
  neoDarkShadow:    'rgba(17, 17, 17, 0.08)',
  neoEmbossBorder:  'rgba(17, 17, 17, 0.06)',
  bentoCardBg:      '#FFFFFF',
  bentoCardBorder:  '#E4DFD3',
  bentoHeaderBg:    'rgba(247, 244, 238, 0.95)',
  bentoGlowCyan:    'rgba(17, 17, 17, 0.04)',
  bentoGlowLime:    'rgba(17, 17, 17, 0.04)',
  bentoGlowPurple:  'rgba(17, 17, 17, 0.04)',

  // ── Transparent overlays & Gradients ──────────────────────────────────────
  overlay:          'rgba(17, 17, 17, 0.04)',
  overlayStrong:    'rgba(17, 17, 17, 0.85)',
  gradientMain:     ['#F7F4EE', '#F7F4EE', '#F7F4EE'] as readonly [string, string, string],
  gradientCard:     ['#FFFFFF', '#FAF8F3'] as readonly [string, string],
  gradientHero:     ['rgba(17, 17, 17, 0.05)', 'rgba(17, 17, 17, 0.02)'] as readonly [string, string],
  gradientBento:    ['#FFFFFF', '#FAF8F3'] as readonly [string, string],
  cardShadow:       'rgba(17, 17, 17, 0.06)',
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
