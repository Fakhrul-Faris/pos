'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  calendarEvents as initialEvents,
  calendarEventToBookingRecord,
  calendarToday,
  eventToTodayBooking,
  minutesToTimeLabel,
  type BookingRecord,
  type BookingSource,
  type BookingStatus,
  type CalendarEvent,
  type PaymentMethod,
  type StaffOnShift,
  type StaffOverride,
  type TodayBooking,
  todayTransactions as initialTransactions,
  type Transaction,
} from './mock'
import { getServicesSnapshot } from './servicesStore'

function bufferForServicesLabel(services?: string) {
  if (!services) return 0
  const catalog = getServicesSnapshot()
  const exact = catalog.find((s) => s.label === services)
  if (exact) return exact.bufferMinutes
  const partial = catalog.find((s) => services.includes(s.label))
  return partial?.bufferMinutes ?? 0
}

function slotEnd(startMinutes: number, durationMinutes: number, bufferMinutes = 0) {
  return startMinutes + durationMinutes + bufferMinutes
}

export type NewBookingInput = {
  customer: string
  phone: string
  serviceId: string
  staffName: string
  date: string
  startMinutes: number
  source: BookingSource
  notes?: string
}

export type NewBookingDefaults = Partial<NewBookingInput>

export type MerchantPlan = 'starter' | 'growth' | 'pro'

export type PlanEntitlements = {
  staffLimit: number
}

export type StaffMember = {
  id: string
  name: string
  headerClass: string
}

export type BookingConflict = {
  conflictingBooking: BookingRecord
  conflictStartMinutes: number
  conflictEndMinutes: number
}

export type StaffRosterMember = {
  id: string
  name: string
  headerClass: string
  status: StaffOnShift['status']
  bookingsToday: number
  completedToday: number
  nextFree: string | null
  currentBooking: BookingRecord | null
  upcomingBooking: BookingRecord | null
}

export type QueueTicket = {
  queueNumber: number
  booking: BookingRecord
}

export type QueueState = {
  nowServing: QueueTicket | null
  nowServingAll: QueueTicket[]
  waiting: QueueTicket[]
  inChair: QueueTicket[]
  waitingCount: number
  avgWaitMinutes: number
  longestWaitMinutes: number
}

export type TransactionSummary = {
  gross: number
  fees: number
  net: number
  count: number
  pending: number
}

type BookingsContextValue = {
  events: CalendarEvent[]
  demoNowMinutes: number
  plan: MerchantPlan
  entitlements: PlanEntitlements
  staff: StaffMember[]
  staffOverrides: Record<string, StaffOverride>
  getAllRecords: () => BookingRecord[]
  getTodayBookings: () => TodayBooking[]
  getRecordById: (id: string) => BookingRecord | null
  findBookingConflict: (params: {
    staffId: string
    date: string
    startMinutes: number
    durationMinutes: number
    bufferMinutes?: number
    ignoreBookingId?: string
  }) => BookingConflict | null
  suggestNextAvailableStart: (params: {
    staffId: string
    date: string
    startMinutes: number
    durationMinutes: number
    bufferMinutes?: number
  }) => number | null
  findAnyAvailableStaffId: (params: {
    date: string
    startMinutes: number
    durationMinutes: number
    bufferMinutes?: number
  }) => string | null
  getStaffRoster: () => StaffRosterMember[]
  getStaffOnShift: () => StaffOnShift[]
  getQueueState: () => QueueState
  transactions: Transaction[]
  getTransactionSummary: () => TransactionSummary
  getReceiptTransactionId: (bookingId: string) => string | null
  updateStatus: (id: string, status: BookingStatus) => void
  completeWithPayment: (id: string, method: PaymentMethod) => string | null
  addBooking: (input: NewBookingInput) => BookingRecord
  updateBooking: (params: {
    bookingId: string
    staffName: string
    date: string
    startMinutes: number
    serviceId: string
  }) => BookingRecord | null
  setStaffOverride: (staffId: string, override: StaffOverride | null) => void
  addStaff: (name: string) => { ok: true; staff: StaffMember } | { ok: false; reason: 'quota' }
  renameStaff: (id: string, name: string) => void
  removeStaff: (id: string) => { ok: true } | { ok: false; reason: 'has_bookings' | 'min_one' }
  upgradePlan: (plan: MerchantPlan) => void
  setDemoNowMinutes: (minutes: number) => void
  refundTransaction: (transactionId: string) => void
}

const BookingsContext = createContext<BookingsContextValue | null>(null)

let nextId = 100
let nextQueueNumber = 28
let nextStaffId = 4
let nextTxnId = 9
let nextTxnRef = 88429

function createEventId() {
  nextId += 1
  return `c${nextId}`
}

function eventToRecord(event: CalendarEvent, staffById: Record<string, string>) {
  return calendarEventToBookingRecord(event, staffById[event.staffId] ?? 'Anyone')
}

function planEntitlements(plan: MerchantPlan): PlanEntitlements {
  if (plan === 'starter') return { staffLimit: 2 }
  if (plan === 'growth') return { staffLimit: 4 }
  return { staffLimit: 10 }
}

const defaultStaff: StaffMember[] = [
  { id: 's1', name: 'Hafiz', headerClass: 'bg-lavender text-paper-white' },
  { id: 's2', name: 'Ivan', headerClass: 'bg-sky text-paper-white' },
  { id: 's3', name: 'Amir', headerClass: 'bg-amber text-carbon' },
]

const staffColors = [
  'bg-lavender text-paper-white',
  'bg-sky text-paper-white',
  'bg-amber text-carbon',
  'bg-mint-wash text-mint',
  'bg-mist text-carbon',
  'bg-[#fff4e0] text-amber',
] as const

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>(() => [...initialEvents])
  const [demoNowMinutes, setDemoNowMinutes] = useState(10 * 60 + 45)
  const [plan, setPlan] = useState<MerchantPlan>('starter')
  const [staff, setStaff] = useState<StaffMember[]>(() => [...defaultStaff])
  const [staffOverrides, setStaffOverrides] = useState<Record<string, StaffOverride>>({
    s3: 'break',
  })
  const [transactions, setTransactions] = useState<Transaction[]>(() => [...initialTransactions])
  const [receiptByBookingId, setReceiptByBookingId] = useState<Record<string, string>>({})

  const entitlements = useMemo(() => planEntitlements(plan), [plan])

  const staffById = useMemo(() => Object.fromEntries(staff.map((s) => [s.id, s.name])), [staff])

  const staffIdByName = useMemo(
    () => Object.fromEntries(staff.map((s) => [s.name, s.id])),
    [staff],
  )

  const bookingRecordsById = useMemo(() => {
    const map = new Map<string, BookingRecord>()
    for (const e of events) {
      if (e.type !== 'booking') continue
      const record = eventToRecord(e, staffById)
      if (record) map.set(record.id, record)
    }
    return map
  }, [events, staffById])

  const getAllRecords = useCallback(() => {
    return events
      .filter((e) => e.type === 'booking')
      .map((e) => eventToRecord(e, staffById))
      .filter((r): r is BookingRecord => r !== null)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startMinutes - b.startMinutes)
  }, [events, staffById])

  const getTodayBookings = useCallback(() => {
    return events
      .map((e) => eventToTodayBooking(e, staffById[e.staffId] ?? 'Anyone'))
      .filter((b): b is TodayBooking => b !== null)
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [events, staffById])

  const getRecordById = useCallback(
    (id: string) => getAllRecords().find((r) => r.id === id) ?? null,
    [getAllRecords],
  )

  const findBookingConflict = useCallback(
    ({
      staffId,
      date,
      startMinutes,
      durationMinutes,
      bufferMinutes = 0,
      ignoreBookingId,
    }: {
      staffId: string
      date: string
      startMinutes: number
      durationMinutes: number
      bufferMinutes?: number
      ignoreBookingId?: string
    }): BookingConflict | null => {
      const endMinutes = slotEnd(startMinutes, durationMinutes, bufferMinutes)
      for (const e of events) {
        if (e.type !== 'booking') continue
        if (e.staffId !== staffId) continue
        if (e.date !== date) continue
        if (ignoreBookingId && e.id === ignoreBookingId) continue

        const eStart = e.startMinutes
        const eEnd = slotEnd(
          e.startMinutes,
          e.durationMinutes,
          bufferForServicesLabel(e.services),
        )
        const overlaps = startMinutes < eEnd && endMinutes > eStart
        if (!overlaps) continue

        const record = bookingRecordsById.get(e.id) ?? eventToRecord(e, staffById)
        if (!record) continue
        return {
          conflictingBooking: record,
          conflictStartMinutes: eStart,
          conflictEndMinutes: eEnd,
        }
      }
      return null
    },
    [events, bookingRecordsById, staffById],
  )

  const suggestNextAvailableStart = useCallback(
    ({
      staffId,
      date,
      startMinutes,
      durationMinutes,
      bufferMinutes = 0,
    }: {
      staffId: string
      date: string
      startMinutes: number
      durationMinutes: number
      bufferMinutes?: number
    }) => {
      const openMinutes = 9 * 60
      const closeMinutes = 20 * 60
      const step = 15
      const span = durationMinutes + bufferMinutes
      let t = Math.max(openMinutes, startMinutes)
      while (t + span <= closeMinutes) {
        const conflict = findBookingConflict({
          staffId,
          date,
          startMinutes: t,
          durationMinutes,
          bufferMinutes,
        })
        if (!conflict) return t
        t += step
      }
      return null
    },
    [findBookingConflict],
  )

  const findAnyAvailableStaffId = useCallback(
    ({
      date,
      startMinutes,
      durationMinutes,
      bufferMinutes = 0,
    }: {
      date: string
      startMinutes: number
      durationMinutes: number
      bufferMinutes?: number
    }) => {
      for (const member of staff) {
        const conflict = findBookingConflict({
          staffId: member.id,
          date,
          startMinutes,
          durationMinutes,
          bufferMinutes,
        })
        if (!conflict) return member.id
      }
      return null
    },
    [findBookingConflict, staff],
  )

  const getStaffRoster = useCallback((): StaffRosterMember[] => {
    return staff.map((member) => {
      const todayEvents = events
        .filter((e) => e.type === 'booking' && e.date === calendarToday && e.staffId === member.id)
        .sort((a, b) => a.startMinutes - b.startMinutes)

      const bookingsToday = todayEvents.length
      const completedToday = todayEvents.filter((e) => e.status === 'completed').length
      const inService = todayEvents.find((e) => e.status === 'in-service')
      const upcoming = todayEvents.find(
        (e) => e.status === 'confirmed' && e.startMinutes > demoNowMinutes,
      )

      const override = staffOverrides[member.id]
      let status: StaffOnShift['status'] = 'available'
      if (override === 'break') status = 'break'
      else if (override === 'off') status = 'off'
      else if (inService) status = 'busy'

      let nextFree: string | null = null
      if (inService) {
        nextFree = minutesToTimeLabel(inService.startMinutes + inService.durationMinutes)
      } else if (upcoming) {
        nextFree = minutesToTimeLabel(upcoming.startMinutes)
      } else if (status === 'available') {
        nextFree = 'Now'
      }

      return {
        id: member.id,
        name: member.name,
        headerClass: member.headerClass,
        status,
        bookingsToday,
        completedToday,
        nextFree,
        currentBooking: inService ? eventToRecord(inService, staffById) : null,
        upcomingBooking: upcoming ? eventToRecord(upcoming, staffById) : null,
      }
    })
  }, [events, staff, staffById, staffOverrides, demoNowMinutes])

  const getStaffOnShift = useCallback((): StaffOnShift[] => {
    return getStaffRoster().map((member) => ({
      id: member.id,
      name: member.name,
      status: member.status,
      nextFree: member.nextFree === 'Now' ? null : member.nextFree,
      bookingsToday: member.bookingsToday,
    }))
  }, [getStaffRoster])

  const getQueueState = useCallback((): QueueState => {
    const todayRecords = getAllRecords().filter((b) => b.date === calendarToday)
    const withQueue = todayRecords.filter(
      (b) => b.status === 'checked-in' || b.status === 'in-service',
    )

    const ticket = (booking: BookingRecord): QueueTicket | null => {
      const event = events.find((e) => e.id === booking.id)
      if (!event?.queueNumber) return null
      return { queueNumber: event.queueNumber, booking }
    }

    const waiting = withQueue
      .filter((b) => b.status === 'checked-in')
      .sort((a, b) => (events.find((e) => e.id === a.id)?.queueNumber ?? 0) - (events.find((e) => e.id === b.id)?.queueNumber ?? 0))
      .map(ticket)
      .filter((t): t is QueueTicket => t !== null)

    const inChair = withQueue
      .filter((b) => b.status === 'in-service')
      .sort((a, b) => (events.find((e) => e.id === a.id)?.queueNumber ?? 0) - (events.find((e) => e.id === b.id)?.queueNumber ?? 0))
      .map(ticket)
      .filter((t): t is QueueTicket => t !== null)

    const nowServing = inChair[0] ?? waiting[0] ?? null

    const waitDurations = waiting.map((w) => {
      const bookedStart = w.booking.startMinutes
      const waited = Math.max(0, demoNowMinutes - bookedStart)
      return Math.round(waited)
    })

    return {
      nowServing,
      nowServingAll: inChair,
      waiting,
      inChair,
      waitingCount: waiting.length,
      avgWaitMinutes: waitDurations.length
        ? Math.round(waitDurations.reduce((a, b) => a + b, 0) / waitDurations.length)
        : 0,
      longestWaitMinutes: waitDurations.length ? Math.max(...waitDurations) : 0,
    }
  }, [events, getAllRecords, demoNowMinutes])

  const getReceiptTransactionId = useCallback(
    (bookingId: string) => receiptByBookingId[bookingId] ?? null,
    [receiptByBookingId],
  )

  const getTransactionSummary = useCallback((): TransactionSummary => {
    const gross = transactions.reduce((sum, t) => sum + t.gross, 0)
    const fees = transactions.reduce((sum, t) => sum + t.fee, 0)
    const net = transactions.reduce((sum, t) => sum + t.net, 0)
    const pending = transactions.filter((t) => t.status === 'pending').length
    return { gross, fees, net, count: transactions.length, pending }
  }, [transactions])

  const updateStatus = useCallback((id: string, status: BookingStatus) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id || e.type !== 'booking') return e
        if (status === 'checked-in' && !e.queueNumber) {
          const queueNumber = nextQueueNumber
          nextQueueNumber += 1
          return { ...e, status, queueNumber }
        }
        return { ...e, status }
      }),
    )
  }, [])

  const completeWithPayment = useCallback(
    (id: string, method: PaymentMethod) => {
      const record = getRecordById(id)
      if (!record) return null

      setEvents((prev) =>
        prev.map((e) =>
          e.id === id && e.type === 'booking' ? { ...e, status: 'completed' as const } : e,
        ),
      )

      const fee = method === 'hitpay' ? Math.round(record.amount * 0.02 * 100) / 100 : 0
      const net = Math.max(0, record.amount - fee)
      const txn: Transaction = {
        id: `t${nextTxnId}`,
        time: minutesToTimeLabel(record.startMinutes),
        ref: `TXN-${nextTxnRef}`,
        customer: record.customer,
        method,
        gross: record.amount,
        fee,
        net,
        status: method === 'hitpay' ? 'completed' : 'completed',
        staff: record.staffName,
      }
      nextTxnId += 1
      nextTxnRef += 1

      setTransactions((prev) => [txn, ...prev])
      setReceiptByBookingId((prev) => ({ ...prev, [id]: txn.id }))

      return txn.id
    },
    [getRecordById],
  )

  const addBooking = useCallback(
    (input: NewBookingInput) => {
      const catalog = getServicesSnapshot()
      const service = catalog.find((s) => s.id === input.serviceId) ?? catalog[0]
      const staffId =
        input.staffName === 'Anyone'
          ? findAnyAvailableStaffId({
              date: input.date,
              startMinutes: input.startMinutes,
              durationMinutes: service.durationMinutes,
              bufferMinutes: service.bufferMinutes,
            }) ??
            staff[0]?.id ??
            's1'
          : staffIdByName[input.staffName] ?? staff[0]?.id ?? 's1'
      const assignedName = staffById[staffId] ?? input.staffName
      const event: CalendarEvent = {
        id: createEventId(),
        staffId,
        date: input.date,
        startMinutes: input.startMinutes,
        durationMinutes: service.durationMinutes,
        customer: input.customer,
        services: service.label,
        status: 'confirmed',
        type: 'booking',
        amount: service.price,
        staffLabel: input.staffName === 'Anyone' || input.staffName === assignedName ? undefined : input.staffName,
        phone: input.phone || undefined,
        source: input.source,
        notes: input.notes,
      }

      setEvents((prev) => [...prev, event])
      return calendarEventToBookingRecord(event, staffById[staffId] ?? input.staffName)!
    },
    [staff, staffById, staffIdByName, findAnyAvailableStaffId],
  )

  const updateBooking = useCallback(
    ({
      bookingId,
      staffName,
      date,
      startMinutes,
      serviceId,
    }: {
      bookingId: string
      staffName: string
      date: string
      startMinutes: number
      serviceId: string
    }) => {
      const existing = events.find((e) => e.type === 'booking' && e.id === bookingId)
      if (!existing || existing.type !== 'booking') return null

      const catalog = getServicesSnapshot()
      const service = catalog.find((s) => s.id === serviceId) ?? catalog[0]
      const staffId =
        staffName === 'Anyone'
          ? findAnyAvailableStaffId({
              date,
              startMinutes,
              durationMinutes: service.durationMinutes,
              bufferMinutes: service.bufferMinutes,
            }) ??
            staff[0]?.id ??
            existing.staffId
          : staffIdByName[staffName] ?? staff[0]?.id ?? existing.staffId

      const assignedName = staffById[staffId] ?? staffName

      const next: CalendarEvent = {
        ...existing,
        staffId,
        date,
        startMinutes,
        durationMinutes: service.durationMinutes,
        services: service.label,
        amount: service.price,
        staffLabel: staffName === 'Anyone' || staffName === assignedName ? undefined : staffName,
      }

      // Keep queue number when rescheduling/reassigning.
      setEvents((prev) => prev.map((e) => (e.id === bookingId ? next : e)))
      return calendarEventToBookingRecord(next, staffById[staffId] ?? staffName)
    },
    [events, staff, staffById, staffIdByName, findAnyAvailableStaffId],
  )

  const addStaff = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return { ok: false as const, reason: 'quota' as const }
      if (staff.length >= entitlements.staffLimit) return { ok: false as const, reason: 'quota' as const }

      const id = `s${nextStaffId}`
      nextStaffId += 1

      const headerClass = staffColors[staff.length % staffColors.length]
      const member: StaffMember = { id, name: trimmed, headerClass }
      setStaff((prev) => [...prev, member])
      return { ok: true as const, staff: member }
    },
    [entitlements.staffLimit, staff.length],
  )

  const upgradePlan = useCallback((next: MerchantPlan) => setPlan(next), [])

  const renameStaff = useCallback((id: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, name: trimmed } : s)))
  }, [])

  const removeStaff = useCallback(
    (id: string) => {
      if (staff.length <= 1) return { ok: false as const, reason: 'min_one' as const }
      const hasBookings = events.some((e) => e.type === 'booking' && e.staffId === id)
      if (hasBookings) return { ok: false as const, reason: 'has_bookings' as const }
      setStaff((prev) => prev.filter((s) => s.id !== id))
      setStaffOverrides((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      return { ok: true as const }
    },
    [events, staff.length],
  )

  const refundTransaction = useCallback((transactionId: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id !== transactionId) return t
        return {
          ...t,
          status: 'refunded',
          net: 0,
        }
      }),
    )
  }, [])

  const setStaffOverride = useCallback((staffId: string, override: StaffOverride | null) => {
    setStaffOverrides((prev) => {
      const next = { ...prev }
      if (override) next[staffId] = override
      else delete next[staffId]
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      events,
      demoNowMinutes,
      plan,
      entitlements,
      staff,
      staffOverrides,
      getAllRecords,
      getTodayBookings,
      getRecordById,
      findBookingConflict,
      suggestNextAvailableStart,
      findAnyAvailableStaffId,
      getStaffRoster,
      getStaffOnShift,
      getQueueState,
      transactions,
      getTransactionSummary,
      getReceiptTransactionId,
      updateStatus,
      completeWithPayment,
      addBooking,
      updateBooking,
      setStaffOverride,
      addStaff,
      renameStaff,
      removeStaff,
      upgradePlan,
      setDemoNowMinutes,
      refundTransaction,
    }),
    [
      events,
      demoNowMinutes,
      plan,
      entitlements,
      staff,
      staffOverrides,
      getAllRecords,
      getTodayBookings,
      getRecordById,
      findBookingConflict,
      suggestNextAvailableStart,
      findAnyAvailableStaffId,
      getStaffRoster,
      getStaffOnShift,
      getQueueState,
      transactions,
      getTransactionSummary,
      getReceiptTransactionId,
      updateStatus,
      completeWithPayment,
      addBooking,
      updateBooking,
      setStaffOverride,
      addStaff,
      renameStaff,
      removeStaff,
      upgradePlan,
      setDemoNowMinutes,
      refundTransaction,
    ],
  )

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>
}

export function useBookings() {
  const ctx = useContext(BookingsContext)
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider')
  return ctx
}
