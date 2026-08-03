import { DEMO_RETURNING_PHONE, normalizePhone } from './loyaltyMock'

export const BOOKING_SERVICES = [
  { id: 'haircut', name: 'Haircut', price: 35, durationMin: 30 },
  { id: 'beard', name: 'Beard trim', price: 20, durationMin: 15 },
] as const

export type BookingServiceId = (typeof BOOKING_SERVICES)[number]['id']

export type BookingBarberId = 'ali' | 'siti' | 'ben' | 'anyone'

export type LifecycleStatus =
  | 'BOOKED'
  | 'ARRIVED'
  | 'IN_SERVICE'
  | 'PAID'
  | 'NO_SHOW'
  | 'CANCELLED'

export type BookingMemberSnapshot = {
  name: string
  serviceIds: BookingServiceId[]
}

export type RetrievedBooking = {
  id: string
  queueNumber: number
  /** Set when queue was reissued after an edit that grew party/duration */
  previousQueueNumber?: number
  nickname: string
  phone: string
  barberId: Exclude<BookingBarberId, 'anyone'>
  barberName: string
  timeLabel: string
  /** Minutes from midnight - used to rebuild slot id */
  slotStartMin: number
  dateKey: string
  dateLabel: string
  services: string
  total: number
  partySize: number
  durationMin: number
  members: BookingMemberSnapshot[]
  nowServing: number
  lifecycleStatus: LifecycleStatus
  notes?: string
}

export type LookupDate = {
  key: string
  label: string
  weekday: string
  day: number
}

/** Footprint used for queue reissue comparison */
export type BookingFootprint = {
  partySize: number
  durationMin: number
}

/** Highlighted multi-match demo phone */
export const DEMO_MULTI_PHONE = '0123456789'

export function todayKey(base = new Date()) {
  const y = base.getFullYear()
  const m = String(base.getMonth() + 1).padStart(2, '0')
  const d = String(base.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function buildLookupDates(from = new Date(), count = 7): LookupDate[] {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(from)
    d.setDate(from.getDate() + i)
    const key = todayKey(d)
    return {
      key,
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : weekdays[d.getDay()],
      weekday: weekdays[d.getDay()],
      day: d.getDate(),
    }
  })
}

export function formatBookingDateLabel(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function memberServicesLabel(serviceIds: BookingServiceId[]) {
  return BOOKING_SERVICES.filter((s) => serviceIds.includes(s.id))
    .map((s) => s.name)
    .join(' + ')
}

export function memberDurationMin(serviceIds: BookingServiceId[]) {
  return BOOKING_SERVICES.filter((s) => serviceIds.includes(s.id)).reduce(
    (a, s) => a + s.durationMin,
    0,
  )
}

export function memberSubtotal(serviceIds: BookingServiceId[]) {
  return BOOKING_SERVICES.filter((s) => serviceIds.includes(s.id)).reduce(
    (a, s) => a + s.price,
    0,
  )
}

export function partyDurationMin(members: BookingMemberSnapshot[]) {
  return members.reduce((a, m) => a + memberDurationMin(m.serviceIds), 0)
}

export function partyTotal(members: BookingMemberSnapshot[]) {
  return members.reduce((a, m) => a + memberSubtotal(m.serviceIds), 0)
}

export function partyServicesLabel(members: BookingMemberSnapshot[]) {
  if (members.length === 1) return memberServicesLabel(members[0].serviceIds)
  return members.map((m) => memberServicesLabel(m.serviceIds)).join(' · ')
}

export function canEditBooking(status: LifecycleStatus) {
  return status === 'BOOKED' || status === 'ARRIVED'
}

/** Same gate as edit: customer may cancel before they are in the chair. */
export function canCancelBooking(status: LifecycleStatus) {
  return canEditBooking(status)
}

/** New queue # when party grows or total chair time grows. */
export function needsNewQueueNumber(before: BookingFootprint, after: BookingFootprint) {
  return after.partySize > before.partySize || after.durationMin > before.durationMin
}

/** Demo reissue: #42 → #48 */
export function nextQueueNumber(current: number) {
  return current + 6
}

export function barberNameFromId(id: BookingBarberId) {
  if (id === 'anyone') return 'First available'
  if (id === 'ali') return 'Ali'
  if (id === 'siti') return 'Siti'
  if (id === 'ben') return 'Ben'
  return id
}

export function slotIdFor(dateKey: string, startMin: number) {
  return `${dateKey}-${startMin}`
}

function booking(
  partial: Omit<RetrievedBooking, 'dateLabel' | 'services' | 'total' | 'durationMin'> & {
    dateKey: string
    members: BookingMemberSnapshot[]
  },
): RetrievedBooking {
  const members = partial.members
  return {
    ...partial,
    dateLabel: formatBookingDateLabel(partial.dateKey),
    services: partyServicesLabel(members),
    total: partyTotal(members),
    durationMin: partyDurationMin(members),
  }
}

/**
 * Demo catalogue keyed by phone → dateKey → bookings.
 * Unknown phones / dates return [].
 */
export function lookupBookings(phone: string, dateKey: string): RetrievedBooking[] {
  const key = normalizePhone(phone)
  const today = todayKey()

  if (key === DEMO_RETURNING_PHONE && dateKey === today) {
    return [
      booking({
        id: 'bk-aiman-42',
        queueNumber: 42,
        nickname: 'Aiman',
        phone: key,
        barberId: 'ali',
        barberName: 'Ali',
        timeLabel: '2:30 PM',
        slotStartMin: 14 * 60 + 30,
        dateKey,
        partySize: 1,
        members: [{ name: 'Aiman', serviceIds: ['haircut'] }],
        nowServing: 40,
        lifecycleStatus: 'BOOKED',
      }),
    ]
  }

  if (key === DEMO_MULTI_PHONE && dateKey === today) {
    return [
      booking({
        id: 'bk-multi-18',
        queueNumber: 18,
        nickname: 'Farah',
        phone: key,
        barberId: 'siti',
        barberName: 'Siti',
        timeLabel: '11:00 AM',
        slotStartMin: 11 * 60,
        dateKey,
        partySize: 1,
        members: [{ name: 'Farah', serviceIds: ['haircut', 'beard'] }],
        nowServing: 40,
        lifecycleStatus: 'IN_SERVICE',
      }),
      booking({
        id: 'bk-multi-27',
        queueNumber: 27,
        nickname: 'Farah',
        phone: key,
        barberId: 'ali',
        barberName: 'Ali',
        timeLabel: '4:00 PM',
        slotStartMin: 16 * 60,
        dateKey,
        partySize: 2,
        members: [
          { name: 'Farah', serviceIds: ['haircut'] },
          { name: 'Guest 2', serviceIds: ['beard'] },
        ],
        nowServing: 40,
        lifecycleStatus: 'BOOKED',
      }),
    ]
  }

  return []
}
