'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { calendarToday } from './mock'
import {
  attendanceStatusFromClockIn,
  isoToClockHm,
  latestShiftForStaff,
  readShiftsFromBridge,
  SHIFT_BRIDGE_KEY,
  type BridgeShift,
} from '../lib/shiftBridge'

export type ShiftTemplate = {
  id: string
  code: string
  name: string
  start: string
  end: string
  breakMinutes: number
  active: boolean
}

export type ShiftAssignment = {
  id: string
  staffId: string
  date: string
  templateId: string
  published: boolean
  notes: string
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave'

export type AttendanceRecord = {
  id: string
  staffId: string
  date: string
  status: AttendanceStatus
  clockIn: string | null
  clockOut: string | null
  notes: string
}

export type OvertimeRequest = {
  id: string
  staffId: string
  date: string
  start: string
  end: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
}

type RosterContextValue = {
  templates: ShiftTemplate[]
  assignments: ShiftAssignment[]
  attendance: AttendanceRecord[]
  overtime: OvertimeRequest[]
  weekDates: string[]
  assignShift: (staffId: string, date: string, templateId: string) => void
  clearAssignment: (staffId: string, date: string) => void
  publishWeek: () => void
  setAttendance: (
    staffId: string,
    date: string,
    patch: Partial<Omit<AttendanceRecord, 'id' | 'staffId' | 'date'>>,
  ) => void
  addOvertime: (input: Omit<OvertimeRequest, 'id' | 'status'>) => void
  decideOvertime: (id: string, status: 'approved' | 'rejected') => void
  addTemplate: (input: Omit<ShiftTemplate, 'id' | 'active'>) => void
}

const RosterContext = createContext<RosterContextValue | null>(null)

const seedTemplates: ShiftTemplate[] = [
  {
    id: 't-am',
    code: 'AM',
    name: 'Morning',
    start: '10:00',
    end: '15:00',
    breakMinutes: 15,
    active: true,
  },
  {
    id: 't-pm',
    code: 'PM',
    name: 'Afternoon',
    start: '14:00',
    end: '20:00',
    breakMinutes: 20,
    active: true,
  },
  {
    id: 't-full',
    code: 'FULL',
    name: 'Full day',
    start: '10:00',
    end: '20:00',
    breakMinutes: 60,
    active: true,
  },
]

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, '0'),
    String(dt.getDate()).padStart(2, '0'),
  ].join('-')
}

function weekFrom(anchor: string) {
  return Array.from({ length: 7 }, (_, i) => addDays(anchor, i))
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
}

const weekDatesSeed = weekFrom(calendarToday)

const seedAssignments: ShiftAssignment[] = [
  {
    id: 'a1',
    staffId: 's1',
    date: calendarToday,
    templateId: 't-full',
    published: true,
    notes: '',
  },
  {
    id: 'a2',
    staffId: 's2',
    date: calendarToday,
    templateId: 't-am',
    published: true,
    notes: '',
  },
  {
    id: 'a3',
    staffId: 's3',
    date: calendarToday,
    templateId: 't-pm',
    published: true,
    notes: '',
  },
  {
    id: 'a4',
    staffId: 's1',
    date: addDays(calendarToday, 1),
    templateId: 't-full',
    published: false,
    notes: '',
  },
]

/** Base rows without POS clock times — POS bridge fills clock in/out. */
const seedAttendance: AttendanceRecord[] = [
  {
    id: 'att3',
    staffId: 's3',
    date: calendarToday,
    status: 'absent',
    clockIn: null,
    clockOut: null,
    notes: '',
  },
]

const seedOt: OvertimeRequest[] = [
  {
    id: 'ot1',
    staffId: 's3',
    date: calendarToday,
    start: '20:00',
    end: '21:00',
    reason: 'Walk-in rush',
    status: 'pending',
  },
]

const POS_STAFF_IDS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'] as const

function mergeAttendanceFromShifts(
  base: AttendanceRecord[],
  shifts: BridgeShift[],
  date: string,
): AttendanceRecord[] {
  let next = [...base]
  for (const staffId of POS_STAFF_IDS) {
    // Demo: portal "today" is a frozen calendar date; map any POS shift onto that row.
    const shift = latestShiftForStaff(shifts, staffId)
    if (!shift) continue
    const clockIn = isoToClockHm(shift.startedAt)
    const clockOut = shift.endedAt ? isoToClockHm(shift.endedAt) : null
    const status = attendanceStatusFromClockIn(shift.startedAt)
    const existing = next.find((a) => a.staffId === staffId && a.date === date)
    if (existing) {
      next = next.map((a) =>
        a.id === existing.id
          ? {
              ...a,
              status,
              clockIn,
              clockOut,
              notes: a.notes.includes('POS') ? a.notes : a.notes || 'From POS',
            }
          : a,
      )
    } else {
      next.push({
        id: uid('att'),
        staffId,
        date,
        status,
        clockIn,
        clockOut,
        notes: 'From POS',
      })
    }
  }
  return next
}

export function RosterProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState(seedTemplates)
  const [assignments, setAssignments] = useState(seedAssignments)
  const [attendance, setAttendanceState] = useState(seedAttendance)
  const [overtime, setOvertime] = useState(seedOt)
  const weekDates = weekDatesSeed

  const hydrateFromPos = useCallback(() => {
    const shifts = readShiftsFromBridge()
    setAttendanceState((prev) => mergeAttendanceFromShifts(prev, shifts, calendarToday))
  }, [])

  useEffect(() => {
    hydrateFromPos()
    const onStorage = (e: StorageEvent) => {
      if (e.key === SHIFT_BRIDGE_KEY || e.key === null) hydrateFromPos()
    }
    window.addEventListener('storage', onStorage)
    const poll = window.setInterval(hydrateFromPos, 2000)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.clearInterval(poll)
    }
  }, [hydrateFromPos])

  const assignShift = useCallback((staffId: string, date: string, templateId: string) => {
    setAssignments((prev) => {
      const without = prev.filter((a) => !(a.staffId === staffId && a.date === date))
      return [
        ...without,
        {
          id: uid('a'),
          staffId,
          date,
          templateId,
          published: false,
          notes: '',
        },
      ]
    })
  }, [])

  const clearAssignment = useCallback((staffId: string, date: string) => {
    setAssignments((prev) =>
      prev.filter((a) => !(a.staffId === staffId && a.date === date)),
    )
  }, [])

  const publishWeek = useCallback(() => {
    const set = new Set(weekDates)
    setAssignments((prev) =>
      prev.map((a) => (set.has(a.date) ? { ...a, published: true } : a)),
    )
  }, [weekDates])

  const setAttendance = useCallback(
    (
      staffId: string,
      date: string,
      patch: Partial<Omit<AttendanceRecord, 'id' | 'staffId' | 'date'>>,
    ) => {
      setAttendanceState((prev) => {
        const existing = prev.find((a) => a.staffId === staffId && a.date === date)
        if (existing) {
          return prev.map((a) =>
            a.id === existing.id ? { ...a, ...patch } : a,
          )
        }
        return [
          ...prev,
          {
            id: uid('att'),
            staffId,
            date,
            status: 'present',
            clockIn: null,
            clockOut: null,
            notes: '',
            ...patch,
          },
        ]
      })
    },
    [],
  )

  const addOvertime = useCallback((input: Omit<OvertimeRequest, 'id' | 'status'>) => {
    setOvertime((prev) => [
      { ...input, id: uid('ot'), status: 'pending' },
      ...prev,
    ])
  }, [])

  const decideOvertime = useCallback((id: string, status: 'approved' | 'rejected') => {
    setOvertime((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
  }, [])

  const addTemplate = useCallback((input: Omit<ShiftTemplate, 'id' | 'active'>) => {
    setTemplates((prev) => [
      ...prev,
      { ...input, id: uid('t'), active: true },
    ])
  }, [])

  const value = useMemo(
    () => ({
      templates,
      assignments,
      attendance,
      overtime,
      weekDates,
      assignShift,
      clearAssignment,
      publishWeek,
      setAttendance,
      addOvertime,
      decideOvertime,
      addTemplate,
    }),
    [
      templates,
      assignments,
      attendance,
      overtime,
      weekDates,
      assignShift,
      clearAssignment,
      publishWeek,
      setAttendance,
      addOvertime,
      decideOvertime,
      addTemplate,
    ],
  )

  return (
    <RosterContext.Provider value={value}>{children}</RosterContext.Provider>
  )
}

export function useRoster() {
  const ctx = useContext(RosterContext)
  if (!ctx) throw new Error('useRoster must be used within RosterProvider')
  return ctx
}
