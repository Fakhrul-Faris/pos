import { MANAGER_ACTING_ID } from '@/data/mock'

export type BarberTheme = {
  accent: string
  accentHover: string
  surface: string
  muted: string
  soft: string
  border: string
  ring: string
  accentFg: string
  mark: string
}

/** Avatar / chip mark hues — identity only, not booking status. */
export const BARBER_MARKS: Record<string, string> = {
  s1: '#6b67d8',
  s2: '#2563eb',
  s3: '#d97706',
  s4: '#0d9488',
  s5: '#db2777',
  s6: '#7c3aed',
  s7: '#0891b2',
  s8: '#65a30d',
  s9: '#e11d48',
  s10: '#57534e',
  [MANAGER_ACTING_ID]: '#171717',
}

const INK_THEME: Omit<BarberTheme, 'mark'> = {
  accent: '#171717',
  accentHover: '#000000',
  surface: '#fafafa',
  muted: 'rgba(23, 23, 23, 0.04)',
  soft: 'rgba(23, 23, 23, 0.06)',
  border: 'rgba(23, 23, 23, 0.1)',
  ring: 'rgba(23, 23, 23, 0.16)',
  accentFg: '#ffffff',
}

export function resolveBarberThemeKey(staffId: string | null | undefined): string {
  if (staffId && staffId in BARBER_MARKS) return staffId
  return MANAGER_ACTING_ID
}

export function getBarberTheme(staffId: string | null | undefined): BarberTheme {
  const key = resolveBarberThemeKey(staffId)
  return {
    ...INK_THEME,
    mark: BARBER_MARKS[key] ?? BARBER_MARKS[MANAGER_ACTING_ID]!,
  }
}

/** Very light wash for lane / board surfaces — identity, not status. */
export function barberLaneWash(staffId: string | null | undefined): string {
  const mark = getBarberTheme(staffId).mark
  return `color-mix(in srgb, ${mark} 4%, #ffffff)`
}
