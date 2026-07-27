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

export type LeaveCategory = 'annual' | 'medical' | 'unpaid' | 'other'

export type LeaveType = {
  id: string
  name: string
  category: LeaveCategory
  maxDaysPerYear: number
  active: boolean
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type LeaveApplication = {
  id: string
  staffId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: LeaveStatus
  appliedAt: string
  decidedAt: string | null
  remarks: string
}

type LeaveContextValue = {
  leaveTypes: LeaveType[]
  applications: LeaveApplication[]
  addType: (input: Omit<LeaveType, 'id' | 'active'>) => void
  toggleType: (id: string) => void
  apply: (input: {
    staffId: string
    leaveTypeId: string
    startDate: string
    endDate: string
    reason: string
  }) => void
  decide: (id: string, status: 'approved' | 'rejected', remarks?: string) => void
  cancel: (id: string) => void
}

const LeaveContext = createContext<LeaveContextValue | null>(null)

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
}

function daysBetween(start: string, end: string) {
  const [ys, ms, ds] = start.split('-').map(Number)
  const [ye, me, de] = end.split('-').map(Number)
  const a = new Date(ys, ms - 1, ds)
  const b = new Date(ye, me - 1, de)
  const diff = Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000))
  return Math.max(1, diff + 1)
}

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, '0'),
    String(dt.getDate()).padStart(2, '0'),
  ].join('-')
}

const seedTypes: LeaveType[] = [
  {
    id: 'lt-annual',
    name: 'Annual leave',
    category: 'annual',
    maxDaysPerYear: 14,
    active: true,
  },
  {
    id: 'lt-medical',
    name: 'Medical leave',
    category: 'medical',
    maxDaysPerYear: 14,
    active: true,
  },
  {
    id: 'lt-unpaid',
    name: 'Unpaid leave',
    category: 'unpaid',
    maxDaysPerYear: 30,
    active: true,
  },
]

const seedApps: LeaveApplication[] = [
  {
    id: 'la1',
    staffId: 's2',
    leaveTypeId: 'lt-annual',
    startDate: addDays(calendarToday, 5),
    endDate: addDays(calendarToday, 6),
    totalDays: 2,
    reason: 'Family trip',
    status: 'pending',
    appliedAt: calendarToday,
    decidedAt: null,
    remarks: '',
  },
  {
    id: 'la2',
    staffId: 's3',
    leaveTypeId: 'lt-medical',
    startDate: addDays(calendarToday, -2),
    endDate: addDays(calendarToday, -1),
    totalDays: 2,
    reason: 'Flu',
    status: 'approved',
    appliedAt: addDays(calendarToday, -3),
    decidedAt: addDays(calendarToday, -3),
    remarks: 'MC attached (mock)',
  },
]

export function LeaveProvider({ children }: { children: ReactNode }) {
  const [leaveTypes, setLeaveTypes] = useState(seedTypes)
  const [applications, setApplications] = useState(seedApps)

  const addType = useCallback((input: Omit<LeaveType, 'id' | 'active'>) => {
    setLeaveTypes((prev) => [...prev, { ...input, id: uid('lt'), active: true }])
  }, [])

  const toggleType = useCallback((id: string) => {
    setLeaveTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t)),
    )
  }, [])

  const apply = useCallback(
    (input: {
      staffId: string
      leaveTypeId: string
      startDate: string
      endDate: string
      reason: string
    }) => {
      const totalDays = daysBetween(input.startDate, input.endDate)
      setApplications((prev) => [
        {
          id: uid('la'),
          ...input,
          totalDays,
          status: 'pending',
          appliedAt: calendarToday,
          decidedAt: null,
          remarks: '',
        },
        ...prev,
      ])
    },
    [],
  )

  const decide = useCallback(
    (id: string, status: 'approved' | 'rejected', remarks = '') => {
      setApplications((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status,
                decidedAt: calendarToday,
                remarks: remarks || a.remarks,
              }
            : a,
        ),
      )
    },
    [],
  )

  const cancel = useCallback((id: string) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === id && a.status === 'pending'
          ? { ...a, status: 'cancelled' }
          : a,
      ),
    )
  }, [])

  const value = useMemo(
    () => ({
      leaveTypes,
      applications,
      addType,
      toggleType,
      apply,
      decide,
      cancel,
    }),
    [leaveTypes, applications, addType, toggleType, apply, decide, cancel],
  )

  return (
    <LeaveContext.Provider value={value}>{children}</LeaveContext.Provider>
  )
}

export function useLeave() {
  const ctx = useContext(LeaveContext)
  if (!ctx) throw new Error('useLeave must be used within LeaveProvider')
  return ctx
}
