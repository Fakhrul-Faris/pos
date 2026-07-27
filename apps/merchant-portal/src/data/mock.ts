export type VerticalId = 'barbershop' | 'salon' | 'clinic'

export type PortalScreen =
  | 'dashboard'
  | 'calendar'
  | 'bookings'
  | 'customers'
  | 'payments'
  | 'staff'
  | 'services'
  | 'inventory'
  | 'roster'
  | 'leave'
  | 'reports'
  | 'payroll'
  | 'accounting'
  | 'settings'
  | 'help'

export type VerticalLabels = {
  id: VerticalId
  businessName: string
  staffPlural: string
  staffSingular: string
  serviceArea: string
}

export const verticals: Record<VerticalId, VerticalLabels> = {
  barbershop: {
    id: 'barbershop',
    businessName: 'Fade House PJ',
    staffPlural: 'Barbers',
    staffSingular: 'Barber',
    serviceArea: 'Chairs',
  },
  salon: {
    id: 'salon',
    businessName: 'Luna Hair Studio',
    staffPlural: 'Stylists',
    staffSingular: 'Stylist',
    serviceArea: 'Stations',
  },
  clinic: {
    id: 'clinic',
    businessName: 'Klinik Harmoni',
    staffPlural: 'Practitioners',
    staffSingular: 'Practitioner',
    serviceArea: 'Rooms',
  },
}

export type BookingStatus =
  | 'confirmed'
  | 'checked-in'
  | 'in-service'
  | 'completed'
  | 'no-show'
  | 'cancelled'

export type TodayBooking = {
  id: string
  time: string
  customer: string
  services: string
  staff: string
  status: BookingStatus
  amount: number
}

export type StaffOnShift = {
  id: string
  name: string
  status: 'available' | 'busy' | 'break' | 'off'
  nextFree: string | null
  bookingsToday: number
}

export type StaffOverride = 'break' | 'off'

export type DashboardStats = {
  bookings: number
  walkIns: number
  revenue: number
  noShows: number
  queueNumber: number
  waitingCount: number
}

export const dashboardStats: DashboardStats = {
  bookings: 14,
  walkIns: 3,
  revenue: 1840,
  noShows: 1,
  queueNumber: 27,
  waitingCount: 4,
}

export const todayBookings: TodayBooking[] = [
  {
    id: 'b1',
    time: '09:30',
    customer: 'Ahmad R.',
    services: 'Skin fade + beard',
    staff: 'Hafiz',
    status: 'completed',
    amount: 65,
  },
  {
    id: 'b2',
    time: '10:00',
    customer: 'Daniel T.',
    services: 'Haircut',
    staff: 'Ivan',
    status: 'in-service',
    amount: 45,
  },
  {
    id: 'b3',
    time: '10:30',
    customer: 'Walk-in',
    services: 'Kids cut',
    staff: 'Hafiz',
    status: 'checked-in',
    amount: 35,
  },
  {
    id: 'b4',
    time: '11:00',
    customer: 'Marcus L.',
    services: 'Fade + wash',
    staff: 'Ivan',
    status: 'confirmed',
    amount: 55,
  },
  {
    id: 'b5',
    time: '11:30',
    customer: 'Wei J.',
    services: 'Beard trim',
    staff: 'Anyone',
    status: 'confirmed',
    amount: 25,
  },
  {
    id: 'b6',
    time: '12:00',
    customer: 'Sarah K.',
    services: 'Haircut',
    staff: 'Hafiz',
    status: 'no-show',
    amount: 45,
  },
]

export const staffOnShift: StaffOnShift[] = [
  {
    id: 's1',
    name: 'Hafiz',
    status: 'busy',
    nextFree: '10:45',
    bookingsToday: 6,
  },
  {
    id: 's2',
    name: 'Ivan',
    status: 'busy',
    nextFree: '11:15',
    bookingsToday: 5,
  },
  {
    id: 's3',
    name: 'Amir',
    status: 'break',
    nextFree: '11:00',
    bookingsToday: 3,
  },
]

export type CalendarStaff = {
  id: string
  name: string
  headerClass: string
}

export type CalendarEventType = 'booking' | 'walk-in-block'

export type CalendarEvent = {
  id: string
  staffId: string
  date: string // YYYY-MM-DD
  startMinutes: number
  durationMinutes: number
  customer?: string
  services?: string
  status?: BookingStatus
  type: CalendarEventType
  label?: string
  amount?: number
  staffLabel?: string
  phone?: string
  source?: BookingSource
  notes?: string
  queueNumber?: number
}

export const calendarStaff: CalendarStaff[] = [
  { id: 's1', name: 'Hafiz', headerClass: 'bg-lavender text-paper-white' },
  { id: 's2', name: 'Ivan', headerClass: 'bg-sky text-paper-white' },
  { id: 's3', name: 'Amir', headerClass: 'bg-amber text-carbon' },
]

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Week of Mon 6 Jul - Sun 12 Jul 2026 (today = Tue 7 Jul)
const weekDates = {
  mon: dateKey(2026, 7, 6),
  tue: dateKey(2026, 7, 7),
  wed: dateKey(2026, 7, 8),
  thu: dateKey(2026, 7, 9),
  fri: dateKey(2026, 7, 10),
  sat: dateKey(2026, 7, 11),
  sun: dateKey(2026, 7, 12),
}

export const calendarEvents: CalendarEvent[] = [
  // Monday
  {
    id: 'c1',
    staffId: 's1',
    date: weekDates.mon,
    startMinutes: 9 * 60,
    durationMinutes: 60,
    customer: 'Marcus L.',
    services: 'Skin fade',
    status: 'completed',
    type: 'booking',
    amount: 55,
  },
  {
    id: 'c2',
    staffId: 's2',
    date: weekDates.mon,
    startMinutes: 10 * 60 + 30,
    durationMinutes: 45,
    customer: 'Wei J.',
    services: 'Haircut',
    status: 'completed',
    type: 'booking',
    amount: 45,
  },
  {
    id: 'c3',
    staffId: 's3',
    date: weekDates.mon,
    startMinutes: 14 * 60,
    durationMinutes: 30,
    customer: 'Sarah K.',
    services: 'Beard trim',
    status: 'completed',
    type: 'booking',
    amount: 25,
  },
  // Tuesday (today)
  {
    id: 'c4',
    staffId: 's1',
    date: weekDates.tue,
    startMinutes: 9 * 60 + 30,
    durationMinutes: 60,
    customer: 'Ahmad R.',
    services: 'Skin fade + beard',
    status: 'completed',
    type: 'booking',
    amount: 65,
  },
  {
    id: 'c5',
    staffId: 's2',
    date: weekDates.tue,
    startMinutes: 10 * 60,
    durationMinutes: 45,
    customer: 'Daniel T.',
    services: 'Haircut',
    status: 'in-service',
    type: 'booking',
    amount: 45,
    queueNumber: 26,
  },
  {
    id: 'c6',
    staffId: 's1',
    date: weekDates.tue,
    startMinutes: 10 * 60 + 30,
    durationMinutes: 30,
    customer: 'Walk-in',
    services: 'Kids cut',
    status: 'checked-in',
    type: 'booking',
    amount: 35,
    queueNumber: 27,
  },
  {
    id: 'c7',
    staffId: 's2',
    date: weekDates.tue,
    startMinutes: 11 * 60,
    durationMinutes: 55,
    customer: 'Marcus L.',
    services: 'Fade + wash',
    status: 'confirmed',
    type: 'booking',
    amount: 55,
  },
  {
    id: 'c8',
    staffId: 's3',
    date: weekDates.tue,
    startMinutes: 11 * 60 + 30,
    durationMinutes: 25,
    customer: 'Wei J.',
    services: 'Beard trim',
    status: 'confirmed',
    type: 'booking',
    amount: 25,
  },
  {
    id: 'c9',
    staffId: 's1',
    date: weekDates.tue,
    startMinutes: 12 * 60,
    durationMinutes: 45,
    customer: 'Sarah K.',
    services: 'Haircut',
    status: 'no-show',
    type: 'booking',
    amount: 45,
  },
  {
    id: 'c10',
    staffId: 's3',
    date: weekDates.tue,
    startMinutes: 14 * 60,
    durationMinutes: 60,
    customer: 'Daniel T.',
    services: 'Fade + beard',
    status: 'confirmed',
    type: 'booking',
    amount: 65,
  },
  // Wednesday
  {
    id: 'c11',
    staffId: 's1',
    date: weekDates.wed,
    startMinutes: 9 * 60,
    durationMinutes: 45,
    customer: 'Ahmad R.',
    services: 'Haircut',
    status: 'confirmed',
    type: 'booking',
    amount: 45,
  },
  {
    id: 'c12',
    staffId: 's2',
    date: weekDates.wed,
    startMinutes: 10 * 60,
    durationMinutes: 60,
    customer: 'Marcus L.',
    services: 'Skin fade',
    status: 'confirmed',
    type: 'booking',
    amount: 55,
  },
  {
    id: 'c13',
    staffId: 's3',
    date: weekDates.wed,
    startMinutes: 11 * 60 + 30,
    durationMinutes: 30,
    customer: 'Walk-in',
    services: 'Kids cut',
    status: 'confirmed',
    type: 'booking',
    amount: 35,
  },
  // Thursday
  {
    id: 'c14',
    staffId: 's1',
    date: weekDates.thu,
    startMinutes: 15 * 60,
    durationMinutes: 45,
    customer: 'Wei J.',
    services: 'Haircut',
    status: 'confirmed',
    type: 'booking',
    amount: 45,
  },
  {
    id: 'c15',
    staffId: 's2',
    date: weekDates.thu,
    startMinutes: 16 * 60,
    durationMinutes: 30,
    customer: 'Sarah K.',
    services: 'Beard trim',
    status: 'confirmed',
    type: 'booking',
    amount: 25,
  },
  // Friday
  {
    id: 'c16',
    staffId: 's1',
    date: weekDates.fri,
    startMinutes: 9 * 60 + 30,
    durationMinutes: 60,
    customer: 'Daniel T.',
    services: 'Fade + wash',
    status: 'confirmed',
    type: 'booking',
    amount: 55,
  },
  {
    id: 'c17',
    staffId: 's3',
    date: weekDates.fri,
    startMinutes: 13 * 60,
    durationMinutes: 45,
    customer: 'Ahmad R.',
    services: 'Haircut',
    status: 'confirmed',
    type: 'booking',
    amount: 45,
  },
  // Saturday - walk-in blocks (peak hours)
  {
    id: 'w1',
    staffId: 's1',
    date: weekDates.sat,
    startMinutes: 12 * 60,
    durationMinutes: 120,
    type: 'walk-in-block',
    label: 'Walk-in only',
  },
  {
    id: 'w2',
    staffId: 's2',
    date: weekDates.sat,
    startMinutes: 12 * 60,
    durationMinutes: 120,
    type: 'walk-in-block',
    label: 'Walk-in only',
  },
  {
    id: 'w3',
    staffId: 's3',
    date: weekDates.sat,
    startMinutes: 12 * 60,
    durationMinutes: 120,
    type: 'walk-in-block',
    label: 'Walk-in only',
  },
  {
    id: 'c18',
    staffId: 's1',
    date: weekDates.sat,
    startMinutes: 9 * 60,
    durationMinutes: 45,
    customer: 'Marcus L.',
    services: 'Haircut',
    status: 'confirmed',
    type: 'booking',
    amount: 45,
  },
  // Sunday - lighter day
  {
    id: 'c19',
    staffId: 's2',
    date: weekDates.sun,
    startMinutes: 10 * 60,
    durationMinutes: 60,
    customer: 'Wei J.',
    services: 'Skin fade',
    status: 'confirmed',
    type: 'booking',
    amount: 55,
  },
]

export const calendarWeekStart = weekDates.mon

export const calendarToday = weekDates.tue

export type BookingSource = 'online' | 'walk-in' | 'phone'

export type BookingRecord = {
  id: string
  ref: string
  customer: string
  phone: string
  services: string
  staffName: string
  date: string
  startMinutes: number
  durationMinutes: number
  status: BookingStatus
  amount: number
  source: BookingSource
  notes?: string
}

const customerMeta: Record<string, { phone: string; source: BookingSource; notes?: string }> = {
  'Ahmad R.': { phone: '+60 12-345 6789', source: 'online', notes: 'Prefers skin fade #2 guard.' },
  'Daniel T.': { phone: '+60 17-882 1044', source: 'online' },
  'Walk-in': { phone: '-', source: 'walk-in' },
  'Marcus L.': { phone: '+60 19-223 4410', source: 'online', notes: 'Regular - books Ivan when possible.' },
  'Wei J.': { phone: '+60 16-778 9021', source: 'phone' },
  'Sarah K.': { phone: '+60 11-445 2200', source: 'online' },
}

function bookingRef(id: string) {
  return `BK${id.replace(/^[bc]/, '').toUpperCase()}`
}

function parseTimeLabel(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return 9 * 60
  const hours = Number(match[1])
  const minutes = Number(match[2])
  return hours * 60 + minutes
}

export function calendarEventToBookingRecord(
  event: CalendarEvent,
  staffName: string,
): BookingRecord | null {
  if (event.type !== 'booking' || !event.customer || !event.status) return null
  const meta = customerMeta[event.customer] ?? {
    phone: '+60 12-000 0000',
    source: 'online' as const,
  }
  return {
    id: event.id,
    ref: bookingRef(event.id),
    customer: event.customer,
    phone: event.phone ?? meta.phone,
    services: event.services ?? '',
    staffName: event.staffLabel ?? staffName,
    date: event.date,
    startMinutes: event.startMinutes,
    durationMinutes: event.durationMinutes,
    status: event.status,
    amount: event.amount ?? 45,
    source: event.source ?? meta.source,
    notes: event.notes ?? meta.notes,
  }
}

export function todayBookingToRecord(booking: TodayBooking): BookingRecord {
  const meta = customerMeta[booking.customer] ?? {
    phone: '+60 12-000 0000',
    source: 'online' as const,
  }
  return {
    id: booking.id,
    ref: bookingRef(booking.id),
    customer: booking.customer,
    phone: meta.phone,
    services: booking.services,
    staffName: booking.staff,
    date: calendarToday,
    startMinutes: parseTimeLabel(booking.time),
    durationMinutes: 45,
    status: booking.status,
    amount: booking.amount,
    source: meta.source,
    notes: meta.notes,
  }
}

export function getAllBookingRecords(): BookingRecord[] {
  const staffById = Object.fromEntries(calendarStaff.map((s) => [s.id, s.name]))
  return calendarEvents
    .filter((e) => e.type === 'booking')
    .map((e) => calendarEventToBookingRecord(e, staffById[e.staffId] ?? 'Anyone'))
    .filter((r): r is BookingRecord => r !== null)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startMinutes - b.startMinutes)
}

export const bookingStaffOptions = ['All', ...calendarStaff.map((s) => s.name), 'Anyone'] as const

export type ServiceOption = {
  id: string
  label: string
  durationMinutes: number
  /** Buffer after service (minutes) */
  bufferMinutes: number
  price: number
  category: string
  active: boolean
}

export const serviceOptions: ServiceOption[] = [
  { id: 'haircut', label: 'Haircut', durationMinutes: 45, bufferMinutes: 5, price: 45, category: 'Cuts', active: true },
  { id: 'skin-fade', label: 'Skin fade', durationMinutes: 60, bufferMinutes: 5, price: 55, category: 'Cuts', active: true },
  { id: 'fade-beard', label: 'Skin fade + beard', durationMinutes: 60, bufferMinutes: 10, price: 65, category: 'Combos', active: true },
  { id: 'fade-wash', label: 'Fade + wash', durationMinutes: 55, bufferMinutes: 5, price: 55, category: 'Combos', active: true },
  { id: 'beard-trim', label: 'Beard trim', durationMinutes: 25, bufferMinutes: 5, price: 25, category: 'Grooming', active: true },
  { id: 'kids-cut', label: 'Kids cut', durationMinutes: 30, bufferMinutes: 5, price: 35, category: 'Cuts', active: true },
]

export function staffNameToId(name: string): string {
  if (name === 'Anyone') return calendarStaff[0].id
  return calendarStaff.find((s) => s.name === name)?.id ?? calendarStaff[0].id
}

export function minutesToTimeLabel(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function minutesToDisplayTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
}

export function eventToTodayBooking(event: CalendarEvent, staffName: string): TodayBooking | null {
  if (event.type !== 'booking' || event.date !== calendarToday || !event.customer || !event.status) {
    return null
  }
  return {
    id: event.id,
    time: minutesToTimeLabel(event.startMinutes),
    customer: event.customer,
    services: event.services ?? '',
    staff: event.staffLabel ?? staffName,
    status: event.status,
    amount: event.amount ?? 45,
  }
}

export type PaymentMethod = 'cash' | 'duitnow' | 'hitpay'

export type TransactionStatus = 'completed' | 'pending' | 'refunded' | 'failed'

export type Transaction = {
  id: string
  time: string
  ref: string
  customer: string
  method: PaymentMethod
  gross: number
  fee: number
  net: number
  status: TransactionStatus
  staff: string
}

export const todayTransactions: Transaction[] = [
  {
    id: 't1',
    time: '09:42',
    ref: 'TXN-88421',
    customer: 'Ahmad R.',
    method: 'hitpay',
    gross: 65,
    fee: 1.3,
    net: 63.7,
    status: 'completed',
    staff: 'Hafiz',
  },
  {
    id: 't2',
    time: '10:18',
    ref: 'TXN-88422',
    customer: 'Walk-in',
    method: 'cash',
    gross: 35,
    fee: 0,
    net: 35,
    status: 'completed',
    staff: 'Hafiz',
  },
  {
    id: 't3',
    time: '10:55',
    ref: 'TXN-88423',
    customer: 'Daniel T.',
    method: 'duitnow',
    gross: 45,
    fee: 0,
    net: 45,
    status: 'pending',
    staff: 'Ivan',
  },
  {
    id: 't4',
    time: '11:05',
    ref: 'TXN-88424',
    customer: 'Marcus L.',
    method: 'hitpay',
    gross: 55,
    fee: 1.1,
    net: 53.9,
    status: 'completed',
    staff: 'Ivan',
  },
  {
    id: 't5',
    time: '11:38',
    ref: 'TXN-88425',
    customer: 'Wei J.',
    method: 'cash',
    gross: 25,
    fee: 0,
    net: 25,
    status: 'completed',
    staff: 'Amir',
  },
  {
    id: 't6',
    time: '12:10',
    ref: 'TXN-88426',
    customer: 'Sarah K.',
    method: 'hitpay',
    gross: 45,
    fee: 0,
    net: 0,
    status: 'refunded',
    staff: 'Hafiz',
  },
  {
    id: 't7',
    time: '13:22',
    ref: 'TXN-88427',
    customer: 'Walk-in',
    method: 'duitnow',
    gross: 40,
    fee: 0,
    net: 40,
    status: 'completed',
    staff: 'Amir',
  },
  {
    id: 't8',
    time: '14:05',
    ref: 'TXN-88428',
    customer: 'Daniel T.',
    method: 'hitpay',
    gross: 65,
    fee: 1.3,
    net: 63.7,
    status: 'failed',
    staff: 'Amir',
  },
]

export const transactionSummary = {
  gross: 375,
  fees: 3.7,
  net: 326.6,
  count: 8,
  pending: 1,
}
