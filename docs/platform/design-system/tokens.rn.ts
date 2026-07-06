/**
 * Miki Design Tokens — React Native
 *
 * Auto-derived from tokens.json (W3C Design Tokens SSOT).
 * Used by: Counter POS (React Native + Expo)
 *
 * Usage:
 *   import { colors, spacing, typography, radius, shadow } from '@miki/tokens';
 *
 * IMPORTANT: Do not edit manually. Regenerate from tokens.json when tokens change.
 * TODO: Build generate script that reads tokens.json and writes this file.
 */

// ── Colors ──────────────────────────────────────────────────────────

export const palette = {
  green: {
    100: '#F0FAF5',
    200: '#E8F9F0',
    300: '#A8E8C8',
    400: '#6DD9A8',
    500: '#38CE87',
    600: '#2FB876',
    700: '#1A7A4C',
    800: '#145C38',
    900: '#0D3D26',
  },
  neutral: {
    50: '#F9F9F8',
    100: '#F6F5F4',
    200: '#DFDCD9',
    300: '#A39E98',
    400: '#78736F',
    ink: '#1C1C1C',
    muted: '#6B6B6B',
    white: '#FFFFFF',
  },
  status: {
    success: '#14832B',
    warning: '#FF6D00',
    error: '#F64932',
  },
  alpha: {
    textStrong: 'rgba(0, 0, 0, 0.95)',
    textNormal: 'rgba(0, 0, 0, 0.90)',
    textMuted: 'rgba(0, 0, 0, 0.54)',
    textDisabled: 'rgba(0, 0, 0, 0.30)',
    border: 'rgba(0, 0, 0, 0.10)',
    borderSubtle: 'rgba(0, 0, 0, 0.05)',
  },
} as const;

export const colors = {
  light: {
    background: {
      page: palette.neutral[50],
      elevated: palette.neutral.white,
      subtle: palette.neutral[100],
      inverse: palette.neutral.ink,
      brand: palette.green[500],
      brandMuted: palette.green[100],
      brandSoft: palette.green[200],
    },
    text: {
      primary: palette.alpha.textStrong,
      secondary: palette.alpha.textMuted,
      inverse: palette.neutral.white,
      brand: palette.green[500],
      link: palette.green[600],
    },
    border: {
      default: palette.alpha.border,
      subtle: palette.alpha.borderSubtle,
      strong: palette.neutral.ink,
    },
    interactive: {
      primary: { bg: palette.green[500], bgHover: palette.green[600], text: palette.neutral.ink },
      secondary: { bg: palette.green[200], bgHover: palette.green[100], text: palette.green[700] },
      tertiary: { bg: palette.neutral.white, bgHover: palette.neutral[100], text: palette.alpha.textStrong },
      ghost: { bg: 'transparent', bgHover: palette.neutral[100], text: palette.alpha.textStrong },
    },
    status: {
      success: palette.status.success,
      warning: palette.status.warning,
      error: palette.status.error,
    },
    badge: {
      available: { bg: palette.green[200], text: palette.green[700] },
      comingSoon: { bg: palette.neutral[100], text: palette.alpha.textMuted },
      bold: { bg: palette.green[500], text: palette.neutral.white },
    },
  },
  dark: {
    background: {
      page: '#1F1F1E',
      elevated: '#2A2A29',
      subtle: '#333332',
      inverse: palette.neutral.white,
      brand: palette.green[500],
      brandMuted: '#1A3D2B',
      brandSoft: '#1F4D35',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.95)',
      secondary: 'rgba(255, 255, 255, 0.54)',
      inverse: palette.neutral.ink,
      brand: palette.green[400],
      link: palette.green[400],
    },
    border: {
      default: 'rgba(255, 255, 255, 0.12)',
      subtle: 'rgba(255, 255, 255, 0.06)',
      strong: palette.neutral.white,
    },
    interactive: {
      primary: { bg: palette.green[500], bgHover: palette.green[600], text: palette.neutral.ink },
      secondary: { bg: '#1F4D35', bgHover: '#1A3D2B', text: palette.green[300] },
      tertiary: { bg: '#2A2A29', bgHover: '#333332', text: 'rgba(255, 255, 255, 0.95)' },
      ghost: { bg: 'transparent', bgHover: '#333332', text: 'rgba(255, 255, 255, 0.95)' },
    },
    status: {
      success: '#34C759',
      warning: '#FF9F0A',
      error: '#FF453A',
    },
    badge: {
      available: { bg: '#1F4D35', text: palette.green[300] },
      comingSoon: { bg: '#333332', text: 'rgba(255, 255, 255, 0.54)' },
      bold: { bg: palette.green[500], text: palette.neutral.ink },
    },
  },
} as const;

// ── Spacing (4px base grid) ─────────────────────────────────────────

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

// ── Typography ──────────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    headline: 'InstrumentSans',      // loaded via expo-font
    headlineFallback: 'Inter',
    body: 'IBMPlexSans',             // loaded via expo-font
    bodyFallback: 'Inter',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 22,
    '3xl': 32,
    '4xl': 42,
    '5xl': 54,
    '6xl': 60,
    '7xl': 76,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.06,
    snug: 1.25,
    card: 1.27,
    normal: 1.5,
    relaxed: 1.625,
  },
  letterSpacing: {
    tightSm: -0.25,
    tightMd: -0.75,
    tightLg: -3.4,
    normal: 0,
  },
} as const;

// ── Radius ──────────────────────────────────────────────────────────

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// ── Shadows (platform-specific — use elevation on Android) ──────────

export const shadow = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 6,
  },
} as const;

// ── Duration & Easing (for Animated / Reanimated) ───────────────────

export const motion = {
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
  spring: {
    snappy: { stiffness: 300, damping: 25, mass: 1.0 },
    gentle: { stiffness: 200, damping: 20, mass: 1.0 },
    light: { stiffness: 300, damping: 25, mass: 0.8 },
  },
} as const;

// ── Layout ──────────────────────────────────────────────────────────

export const layout = {
  maxWidth: { content: 1252, narrow: 720 },
  grid: { columns: 12, gutter: 28 },
  nav: { height: 64 },
  section: { paddingY: 80, paddingX: 24 },
} as const;

// ── Component: Logo ─────────────────────────────────────────────────

export const logo = {
  dot: { size: 12, color: palette.green[500] },
} as const;
