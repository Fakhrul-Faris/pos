'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { calendarToday } from './mock'

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

const seedAttendance: AttendanceRecord[] = [
  {
    id: 'att1',
    staffId: 's1',
    date: calendarToday,
    status: 'present',
    clockIn: '09:55',
    clockOut: null,
    notes: '',
  },
  {
    id: 'att2',
    staffId: 's2',
    date: calendarToday,
    status: 'late',
    clockIn: '10:18',
    clockOut: null,
    notes: 'Traffic',
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

export function RosterProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState(seedTemplates)
  const [assignments, setAssignments] = useState(seedAssignments)
  const [attendance, setAttendanceState] = useState(seedAttendance)
  const [overtime, setOvertime] = useState(seedOt)
  const weekDates = weekDatesSeed

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
