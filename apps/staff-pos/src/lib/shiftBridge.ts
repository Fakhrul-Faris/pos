/** Shared POS ↔ merchant portal shift bridge (localStorage mock). */

export const SHIFT_BRIDGE_KEY = 'miki.pos.shifts'

export type ShiftSource = 'POS_START' | 'POS_SWITCH' | 'MANUAL_END' | 'AUTO_EOD'

export type BridgeShift = {
  id: string
  staffId: string
  startedAt: string
  endedAt: string | null
  source: ShiftSource
}

/** Shop open threshold — clock-in after this is "late". */
export const LATE_AFTER_MINUTES = 10 * 60

export function readShiftsFromBridge(): BridgeShift[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(SHIFT_BRIDGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BridgeShift[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeShiftsToBridge(shifts: BridgeShift[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SHIFT_BRIDGE_KEY, JSON.stringify(shifts))
  } catch {
    /* ignore quota */
  }
}

export function isoToLocalDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isoToClockHm(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function clockHmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

export function attendanceStatusFromClockIn(startedAt: string): 'present' | 'late' {
  const hm = isoToClockHm(startedAt)
  return clockHmToMinutes(hm) > LATE_AFTER_MINUTES ? 'late' : 'present'
}

export function isOpenShift(shift: BridgeShift): boolean {
  return shift.endedAt == null
}

/** Latest shift for staff (prefer open), ignoring calendar day — demo maps onto portal today. */
export function latestShiftForStaff(
  shifts: BridgeShift[],
  staffId: string,
): BridgeShift | null {
  const forStaff = shifts.filter((s) => s.staffId === staffId)
  if (forStaff.length === 0) return null
  const open = forStaff.find(isOpenShift)
  if (open) return open
  return forStaff.slice().sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null
}

/** Latest shift per staff for a local calendar date (prefer open). */
export function latestShiftForDate(
  shifts: BridgeShift[],
  staffId: string,
  date: string,
): BridgeShift | null {
  const forDay = shifts.filter(
    (s) => s.staffId === staffId && isoToLocalDate(s.startedAt) === date,
  )
  if (forDay.length === 0) return null
  const open = forDay.find(isOpenShift)
  if (open) return open
  return forDay.slice().sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null
}
