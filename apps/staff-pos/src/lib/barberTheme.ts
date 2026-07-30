import { MANAGER_ACTING_ID } from '@/data/mock'

export type BarberThemeKey = 's1' | 's2' | 's3' | typeof MANAGER_ACTING_ID

export type BarberTheme = {
  accent: string
  accentHover: string
  surface: string
  muted: string
  soft: string
  border: string
  ring: string
  accentFg: string
}

/** Identity accents per acting barber — not booking status colors. */
export const BARBER_THEMES: Record<BarberThemeKey, BarberTheme> = {
  s1: {
    accent: '#918df6',
    accentHover: '#7a75e8',
    surface: '#ebe9fe',
    muted: 'rgba(145, 141, 246, 0.1)',
    soft: 'rgba(145, 141, 246, 0.15)',
    border: 'rgba(145, 141, 246, 0.3)',
    ring: 'rgba(145, 141, 246, 0.4)',
    accentFg: '#ffffff',
  },
  s2: {
    accent: '#2c78fc',
    accentHover: '#1a65e8',
    surface: '#e8f1ff',
    muted: 'rgba(44, 120, 252, 0.1)',
    soft: 'rgba(44, 120, 252, 0.15)',
    border: 'rgba(44, 120, 252, 0.3)',
    ring: 'rgba(44, 120, 252, 0.4)',
    accentFg: '#ffffff',
  },
  s3: {
    accent: '#ffa600',
    accentHover: '#e69500',
    surface: '#fff4e0',
    muted: 'rgba(255, 166, 0, 0.12)',
    soft: 'rgba(255, 166, 0, 0.18)',
    border: 'rgba(255, 166, 0, 0.35)',
    ring: 'rgba(255, 166, 0, 0.45)',
    accentFg: '#181925',
  },
  [MANAGER_ACTING_ID]: {
    accent: '#181925',
    accentHover: '#2a2b38',
    surface: '#f0f0f2',
    muted: 'rgba(24, 25, 37, 0.06)',
    soft: 'rgba(24, 25, 37, 0.1)',
    border: 'rgba(24, 25, 37, 0.15)',
    ring: 'rgba(24, 25, 37, 0.2)',
    accentFg: '#ffffff',
  },
}

export function resolveBarberThemeKey(staffId: string | null | undefined): BarberThemeKey {
  if (staffId === 's1' || staffId === 's2' || staffId === 's3') return staffId
  return MANAGER_ACTING_ID
}

export function getBarberTheme(staffId: string | null | undefined): BarberTheme {
  return BARBER_THEMES[resolveBarberThemeKey(staffId)]
}
