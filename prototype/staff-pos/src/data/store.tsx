import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  initialBookings,
  serviceAmountFromIds,
  serviceDurationFromIds,
  serviceLabelFromIds,
  serviceOptions,
  staff,
  type BookingStatus,
  type FloorBooking,
  type PartyMember,
  type PartyMemberStatus,
  type PartyPhase,
  type PaymentMethod,
  type ServiceOption,
  type StaffMember,
  type StaffStatus,
} from './mock'

export type FloorLane = {
  staff: StaffMember
  staffStatus: StaffStatus
  now: FloorBooking[]
  waiting: FloorBooking[]
  upcoming: FloorBooking[]
  done: FloorBooking[]
  parties: FloorBooking[]
}

export type PaymentLineItem = {
  id: string
  label: string
  sublabel?: string
  amount: number
}

export type Transaction = {
  id: string
  time: string
  ref: string
  customer: string
  method: PaymentMethod
  gross: number
  fee: number
  net: number
  staffName: string
  bookingId: string
  receiptUrl: string
}

export type OverlapWarning = {
  nextCustomer: string
  nextStartMinutes: number
  overflowMinutes: number
}

export type ReassignOption = {
  staffId: string
  name: string
  available: boolean
  reason?: string
}

type StoreValue = {
  demoNowMinutes: number
  setDemoNowMinutes: (m: number) => void
  staff: StaffMember[]
  bookings: FloorBooking[]
  lanes: FloorLane[]
  transactions: Transaction[]
  actingStaffId: string
  setActingStaffId: (id: string) => void
  loggedIn: boolean
  login: () => void
  logout: () => void
  isOffline: boolean
  pendingSyncCount: number
  setOffline: (offline: boolean) => void
  start: (bookingId: string) => void
  checkIn: (bookingId: string) => void
  markNoShow: (bookingId: string) => void
  cancelBooking: (bookingId: string) => void
  reassignBarber: (bookingId: string, staffId: string) => { ok: boolean; reason?: string }
  getReassignOptions: (bookingId: string) => ReassignOption[]
  addService: (bookingId: string, serviceId: string) => OverlapWarning | null
  getOverlapWarning: (bookingId: string) => OverlapWarning | null
  confirmPartyArrival: (
    bookingId: string,
    memberStatuses: Record<string, 'here' | 'no-show'>,
  ) => void
  assignPartyMemberStaff: (bookingId: string, memberId: string, staffId: string) => void
  startPartyMember: (bookingId: string, memberId: string) => void
  completePartyMember: (bookingId: string, memberId: string) => void
  markPartyMemberNoShow: (bookingId: string, memberId: string) => void
  markReadyForPayment: (bookingId: string) => void
  getPaymentLineItems: (bookingId: string) => PaymentLineItem[]
  completeWithPayment: (
    bookingId: string,
    method: PaymentMethod,
  ) => { txnId: string; receiptUrl: string } | null
  addWalkIn: (params: {
    customer: string
    serviceId: string
    staffId: string
    phone?: string
  }) => FloorBooking
  getBookingById: (id: string) => FloorBooking | null
  setStaffOverride: (staffId: string, status: Extract<StaffStatus, 'break' | 'off'> | null) => void
  getMyDayStats: (staffId: string) => { cuts: number; revenue: number }
  isLateBooking: (booking: FloorBooking) => boolean
}

const Ctx = createContext<StoreValue | null>(null)

let nextQueue = 28
let nextBookingId = 100
let nextTxnId = 1
let nextTxnRef = 91000

function minutesToTimeLabel(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function getServiceIds(booking: FloorBooking) {
  return booking.actualServiceIds ?? booking.serviceIds
}

function getBookingDuration(booking: FloorBooking) {
  return serviceDurationFromIds(getServiceIds(booking))
}

function bumpPending(setter: React.Dispatch<React.SetStateAction<number>>, isOffline: boolean) {
  if (isOffline) setter((n) => n + 1)
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [demoNowMinutes, setDemoNowMinutes] = useState(10 * 60 + 45)
  const [bookings, setBookings] = useState<FloorBooking[]>(() => [...initialBookings])
  const [staffOverrides, setStaffOverrides] = useState<Record<string, Extract<StaffStatus, 'break' | 'off'>>>({
    s3: 'break',
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loggedIn, setLoggedIn] = useState(false)
  const [actingStaffId, setActingStaffId] = useState(staff[0]?.id ?? 's1')
  const [isOffline, setIsOffline] = useState(false)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)

  const mutateBookings = useCallback(
    (updater: (prev: FloorBooking[]) => FloorBooking[]) => {
      setBookings(updater)
      bumpPending(setPendingSyncCount, isOffline)
    },
    [isOffline],
  )

  const lanes = useMemo(() => {
    const byStaff = new Map<string, FloorBooking[]>()
    for (const b of bookings) {
      const list = byStaff.get(b.staffId) ?? []
      list.push(b)
      byStaff.set(b.staffId, list)
    }

    function sortByTime(a: FloorBooking, b: FloorBooking) {
      return a.startMinutes - b.startMinutes
    }

    return staff.map((s) => {
      const list = (byStaff.get(s.id) ?? []).slice().sort(sortByTime)
      const parties = list.filter((b) => b.isParty && b.status !== 'completed' && b.status !== 'cancelled')
      const solo = list.filter((b) => !b.isParty)
      const done = solo.filter((b) => b.status === 'completed')
      const now = solo.filter((b) => b.status === 'in-service')
      const waiting = solo
        .filter((b) => b.status === 'checked-in')
        .slice()
        .sort((a, b) => (a.queueNumber ?? 0) - (b.queueNumber ?? 0))
      const upcoming = solo.filter(
        (b) => b.status === 'confirmed' && b.startMinutes >= demoNowMinutes,
      )

      const override = staffOverrides[s.id]
      const staffStatus: StaffStatus =
        override ? override : now.length > 0 ? 'busy' : 'available'

      return { staff: s, staffStatus, now, waiting, upcoming, done, parties }
    })
  }, [bookings, demoNowMinutes, staffOverrides])

  const getBookingById = useCallback(
    (id: string) => bookings.find((b) => b.id === id) ?? null,
    [bookings],
  )

  const isLateBooking = useCallback(
    (booking: FloorBooking) =>
      booking.status === 'confirmed' && demoNowMinutes - booking.startMinutes >= 15,
    [demoNowMinutes],
  )

  const setStatus = useCallback(
    (bookingId: string, next: BookingStatus) => {
      mutateBookings((prev) =>
        prev.map((b) => {
          if (b.id !== bookingId) return b
          if (next === 'checked-in' && !b.queueNumber) {
            const q = nextQueue
            nextQueue += 1
            return { ...b, status: next, queueNumber: q }
          }
          return { ...b, status: next }
        }),
      )
    },
    [mutateBookings],
  )

  const start = useCallback((bookingId: string) => setStatus(bookingId, 'in-service'), [setStatus])
  const checkIn = useCallback((bookingId: string) => setStatus(bookingId, 'checked-in'), [setStatus])

  const markNoShow = useCallback(
    (bookingId: string) => setStatus(bookingId, 'no-show'),
    [setStatus],
  )

  const cancelBooking = useCallback(
    (bookingId: string) => setStatus(bookingId, 'cancelled'),
    [setStatus],
  )

  const findOverlap = useCallback(
    (booking: FloorBooking, durationMinutes: number): OverlapWarning | null => {
      const end = booking.startMinutes + durationMinutes
      const next = bookings
        .filter(
          (b) =>
            b.id !== booking.id &&
            b.staffId === booking.staffId &&
            b.status !== 'cancelled' &&
            b.status !== 'no-show' &&
            b.status !== 'completed' &&
            b.startMinutes >= booking.startMinutes,
        )
        .sort((a, b) => a.startMinutes - b.startMinutes)[0]
      if (!next) return null
      if (end > next.startMinutes) {
        return {
          nextCustomer: next.customer,
          nextStartMinutes: next.startMinutes,
          overflowMinutes: end - next.startMinutes,
        }
      }
      return null
    },
    [bookings],
  )

  const getOverlapWarning = useCallback(
    (bookingId: string) => {
      const booking = getBookingById(bookingId)
      if (!booking) return null
      return findOverlap(booking, getBookingDuration(booking))
    },
    [findOverlap, getBookingById],
  )

  const getReassignOptions = useCallback(
    (bookingId: string): ReassignOption[] => {
      const booking = getBookingById(bookingId)
      if (!booking) return []
      return staff.map((s) => {
        if (s.id === booking.staffId) {
          return { staffId: s.id, name: s.name, available: false, reason: 'Current barber' }
        }
        const override = staffOverrides[s.id]
        if (override === 'off') {
          return { staffId: s.id, name: s.name, available: false, reason: 'Off shift' }
        }
        if (override === 'break') {
          return { staffId: s.id, name: s.name, available: false, reason: 'On break' }
        }
        const hypothetical = { ...booking, staffId: s.id }
        const overlap = findOverlap(hypothetical, getBookingDuration(booking))
        if (overlap) {
          return { staffId: s.id, name: s.name, available: false, reason: 'Slot conflict' }
        }
        return { staffId: s.id, name: s.name, available: true }
      })
    },
    [findOverlap, getBookingById, staffOverrides],
  )

  const reassignBarber = useCallback(
    (bookingId: string, staffId: string) => {
      const booking = getBookingById(bookingId)
      if (!booking) return { ok: false, reason: 'Booking not found' }
      if (booking.status === 'in-service') {
        return { ok: false, reason: 'Cannot reassign while in chair' }
      }
      const option = getReassignOptions(bookingId).find((o) => o.staffId === staffId)
      if (!option?.available) {
        return { ok: false, reason: option?.reason ?? 'Unavailable' }
      }
      mutateBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, staffId } : b)),
      )
      return { ok: true }
    },
    [getBookingById, getReassignOptions, mutateBookings],
  )

  const addService = useCallback(
    (bookingId: string, serviceId: string) => {
      const booking = getBookingById(bookingId)
      if (!booking || booking.isParty) return null
      const currentIds = getServiceIds(booking)
      if (currentIds.includes(serviceId)) return null
      const nextIds = [...currentIds, serviceId]
      const durationMinutes = serviceDurationFromIds(nextIds)
      const amount = serviceAmountFromIds(nextIds)
      const warning = findOverlap(booking, durationMinutes)
      mutateBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                actualServiceIds: nextIds,
                services: serviceLabelFromIds(nextIds),
                durationMinutes,
                amount,
              }
            : b,
        ),
      )
      return warning
    },
    [findOverlap, getBookingById, mutateBookings],
  )

  const confirmPartyArrival = useCallback(
    (bookingId: string, memberStatuses: Record<string, 'here' | 'no-show'>) => {
      mutateBookings((prev) =>
        prev.map((b) => {
          if (b.id !== bookingId || !b.partyMembers) return b
          const members: PartyMember[] = b.partyMembers.map((m) => {
            const choice = memberStatuses[m.id]
            if (choice === 'no-show') return { ...m, status: 'no-show' as PartyMemberStatus }
            if (choice === 'here') return { ...m, status: 'waiting' as PartyMemberStatus }
            return m
          })
          const arrived = members.filter((m) => m.status === 'waiting')
          const queueNumber = arrived.length > 0 ? nextQueue++ : b.queueNumber
          return {
            ...b,
            partyMembers: members,
            partyPhase: 'arrived' as PartyPhase,
            queueNumber,
            status: 'checked-in' as BookingStatus,
          }
        }),
      )
    },
    [mutateBookings],
  )

  const assignPartyMemberStaff = useCallback(
    (bookingId: string, memberId: string, staffId: string) => {
      mutateBookings((prev) =>
        prev.map((b) => {
          if (b.id !== bookingId || !b.partyMembers) return b
          return {
            ...b,
            partyPhase: 'assigning' as PartyPhase,
            partyMembers: b.partyMembers.map((m) =>
              m.id === memberId ? { ...m, staffId } : m,
            ),
          }
        }),
      )
    },
    [mutateBookings],
  )

  const updatePartyMemberStatus = useCallback(
    (bookingId: string, memberId: string, status: PartyMemberStatus) => {
      mutateBookings((prev) =>
        prev.map((b) => {
          if (b.id !== bookingId || !b.partyMembers) return b
          const members = b.partyMembers.map((m) =>
            m.id === memberId ? { ...m, status } : m,
          )
          const active = members.filter((m) => m.status !== 'no-show' && m.status !== 'expected')
          const allDone = active.length > 0 && active.every((m) => m.status === 'done')
          const anyInChair = members.some((m) => m.status === 'in-chair')
          const partyPhase: PartyPhase = allDone
            ? 'ready-pay'
            : anyInChair
              ? 'in-service'
              : (b.partyPhase ?? 'assigning')
          return { ...b, partyMembers: members, partyPhase }
        }),
      )
    },
    [mutateBookings],
  )

  const startPartyMember = useCallback(
    (bookingId: string, memberId: string) => {
      updatePartyMemberStatus(bookingId, memberId, 'in-chair')
    },
    [updatePartyMemberStatus],
  )

  const completePartyMember = useCallback(
    (bookingId: string, memberId: string) => {
      updatePartyMemberStatus(bookingId, memberId, 'done')
    },
    [updatePartyMemberStatus],
  )

  const markPartyMemberNoShow = useCallback(
    (bookingId: string, memberId: string) => {
      updatePartyMemberStatus(bookingId, memberId, 'no-show')
    },
    [updatePartyMemberStatus],
  )

  const markReadyForPayment = useCallback(
    (bookingId: string) => {
      const booking = getBookingById(bookingId)
      if (!booking) return
      if (booking.isParty) {
        mutateBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, partyPhase: 'ready-pay' as PartyPhase } : b,
          ),
        )
        return
      }
      setStatus(bookingId, 'in-service')
    },
    [getBookingById, mutateBookings, setStatus],
  )

  const getPaymentLineItems = useCallback(
    (bookingId: string): PaymentLineItem[] => {
      const booking = getBookingById(bookingId)
      if (!booking) return []
      if (booking.isParty && booking.partyMembers) {
        return booking.partyMembers
          .filter((m) => m.status === 'done')
          .map((m) => ({
            id: m.id,
            label: m.name,
            sublabel: `${m.services} · ${staff.find((s) => s.id === m.staffId)?.name ?? '—'}`,
            amount: m.amount,
          }))
      }
      const ids = getServiceIds(booking)
      return ids.map((id) => {
        const svc = serviceOptions.find((s) => s.id === id)!
        return {
          id,
          label: svc.label,
          sublabel: staff.find((s) => s.id === booking.staffId)?.name,
          amount: svc.price,
        }
      })
    },
    [getBookingById],
  )

  const completeWithPayment = useCallback(
    (bookingId: string, method: PaymentMethod) => {
      const booking = getBookingById(bookingId)
      if (!booking) return null

      const lineItems = getPaymentLineItems(bookingId)
      const gross = lineItems.reduce((sum, li) => sum + li.amount, 0)
      const isHitPay = method === 'hitpay' || method === 'hitpay-card'
      const fee = isHitPay ? Math.round(gross * 0.02 * 100) / 100 : 0
      const customerPays = gross + fee
      const net = gross

      mutateBookings((prev) =>
        prev.map((b) => {
          if (b.id !== bookingId) return b
          if (b.isParty) {
            return { ...b, status: 'completed' as BookingStatus, partyPhase: 'ready-pay' as PartyPhase }
          }
          return { ...b, status: 'completed' as BookingStatus }
        }),
      )

      const staffName = staff.find((s) => s.id === booking.staffId)?.name ?? '—'
      const txnId = `txn_${nextTxnId}`
      const ref = `RCPT-${nextTxnRef}`
      const receiptUrl = `https://miki.app/r/${ref}`
      nextTxnId += 1
      nextTxnRef += 1

      const txn: Transaction = {
        id: txnId,
        time: minutesToTimeLabel(demoNowMinutes),
        ref,
        customer: booking.customer,
        method,
        gross: customerPays,
        fee,
        net,
        staffName,
        bookingId,
        receiptUrl,
      }
      setTransactions((prev) => [txn, ...prev])
      bumpPending(setPendingSyncCount, isOffline)
      return { txnId, receiptUrl }
    },
    [demoNowMinutes, getBookingById, getPaymentLineItems, isOffline, mutateBookings],
  )

  const addWalkIn = useCallback(
    ({
      customer,
      serviceId,
      staffId,
      phone,
    }: {
      customer: string
      serviceId: string
      staffId: string
      phone?: string
    }) => {
      const service = serviceOptions.find((s) => s.id === serviceId) ?? serviceOptions[0]
      nextBookingId += 1
      const booking: FloorBooking = {
        id: `w${nextBookingId}`,
        staffId,
        startMinutes: demoNowMinutes,
        durationMinutes: service.durationMinutes,
        customer: customer.trim() || 'Walk-in',
        phone: phone?.trim() || undefined,
        services: service.label,
        serviceIds: [service.id],
        amount: service.price,
        status: 'checked-in',
        queueNumber: nextQueue++,
        source: 'walk-in',
      }
      mutateBookings((prev) => [booking, ...prev])
      return booking
    },
    [demoNowMinutes, mutateBookings],
  )

  const setStaffOverride = useCallback(
    (staffId: string, status: Extract<StaffStatus, 'break' | 'off'> | null) => {
      setStaffOverrides((prev) => {
        const next = { ...prev }
        if (status) next[staffId] = status
        else delete next[staffId]
        return next
      })
    },
    [],
  )

  const login = useCallback(() => {
    setLoggedIn(true)
    setActingStaffId(staff[0]?.id ?? 's1')
  }, [])

  const logout = useCallback(() => {
    setLoggedIn(false)
  }, [])

  const setOffline = useCallback((offline: boolean) => {
    setIsOffline(offline)
    if (!offline) setPendingSyncCount(0)
  }, [])

  const getMyDayStats = useCallback(
    (staffId: string) => {
      const cuts = bookings.filter(
        (b) =>
          b.status === 'completed' &&
          !b.isParty &&
          b.staffId === staffId,
      ).length
      const partyCuts = bookings
        .filter((b) => b.isParty && b.partyMembers)
        .flatMap((b) => b.partyMembers!)
        .filter((m) => m.staffId === staffId && m.status === 'done').length
      const revenue = transactions
        .filter((t) => {
          const b = bookings.find((bk) => bk.id === t.bookingId)
          return b?.staffId === staffId
        })
        .reduce((sum, t) => sum + t.net, 0)
      return { cuts: cuts + partyCuts, revenue }
    },
    [bookings, transactions],
  )

  const value: StoreValue = {
    demoNowMinutes,
    setDemoNowMinutes,
    staff,
    bookings,
    lanes,
    transactions,
    actingStaffId,
    setActingStaffId,
    loggedIn,
    login,
    logout,
    isOffline,
    pendingSyncCount,
    setOffline,
    start,
    checkIn,
    markNoShow,
    cancelBooking,
    reassignBarber,
    getReassignOptions,
    addService,
    getOverlapWarning,
    confirmPartyArrival,
    assignPartyMemberStaff,
    startPartyMember,
    completePartyMember,
    markPartyMemberNoShow,
    markReadyForPayment,
    getPaymentLineItems,
    completeWithPayment,
    addWalkIn,
    getBookingById,
    setStaffOverride,
    getMyDayStats,
    isLateBooking,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used within StoreProvider')
  return v
}

export type { ServiceOption }
