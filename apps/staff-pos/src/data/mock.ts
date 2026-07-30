export type BookingStatus =
  | 'confirmed'
  | 'checked-in'
  | 'in-service'
  | 'completed'
  | 'no-show'
  | 'cancelled'

export type PaymentMethod = 'cash' | 'duitnow' | 'hitpay' | 'hitpay-card'

export type StaffMember = {
  id: string
  name: string
  headerClass: string
}

export type StaffStatus = 'available' | 'busy' | 'break' | 'off'

export const MANAGER_ACTING_ID = 'manager'

export function actingLabel(staffId: string, staffList: StaffMember[]): string {
  if (staffId === MANAGER_ACTING_ID) return 'Manager'
  return staffList.find((s) => s.id === staffId)?.name ?? 'Barber'
}

export type PartyMemberStatus = 'expected' | 'waiting' | 'in-chair' | 'done' | 'no-show'

export type PartyPhase = 'booked' | 'arrived' | 'assigning' | 'in-service' | 'ready-pay'

export type PartyMember = {
  id: string
  name: string
  services: string
  serviceIds: string[]
  amount: number
  staffId: string
  status: PartyMemberStatus
}

export type ServiceOption = {
  id: string
  label: string
  durationMinutes: number
  price: number
}

export type ProductOption = {
  id: string
  label: string
  price: number
}

export type RetailLineItem = {
  id: string
  productId: string
  label: string
  amount: number
}

export type FloorBooking = {
  id: string
  queueNumber?: number
  staffId: string
  startMinutes: number
  durationMinutes: number
  customer: string
  phone?: string
  services: string
  serviceIds: string[]
  amount: number
  status: BookingStatus
  source: 'online' | 'walk-in'
  actualServiceIds?: string[]
  retailItems?: RetailLineItem[]
  isParty?: boolean
  partySize?: number
  partyMembers?: PartyMember[]
  partyPhase?: PartyPhase
}

export const staff: StaffMember[] = [
  { id: 's1', name: 'Hafiz', headerClass: 'bg-lavender text-paper-white' },
  { id: 's2', name: 'Ivan', headerClass: 'bg-sky text-paper-white' },
  { id: 's3', name: 'Amir', headerClass: 'bg-amber text-carbon' },
]

export const serviceOptions: ServiceOption[] = [
  { id: 'haircut', label: 'Haircut', durationMinutes: 45, price: 45 },
  { id: 'skin-fade', label: 'Skin fade', durationMinutes: 60, price: 55 },
  { id: 'fade-beard', label: 'Skin fade + beard', durationMinutes: 60, price: 65 },
  { id: 'beard-trim', label: 'Beard trim', durationMinutes: 25, price: 25 },
  { id: 'kids-cut', label: 'Kids cut', durationMinutes: 30, price: 35 },
  { id: 'wash-cut', label: 'Wash + cut', durationMinutes: 50, price: 55 },
  { id: 'senior-cut', label: 'Senior cut', durationMinutes: 35, price: 35 },
  { id: 'buzz', label: 'Buzz cut', durationMinutes: 20, price: 30 },
]

export const productOptions: ProductOption[] = [
  { id: 'pomade', label: 'Clay pomade', price: 48 },
  { id: 'spray', label: 'Sea salt spray', price: 42 },
  { id: 'wax', label: 'Matte wax', price: 38 },
  { id: 'oil', label: 'Beard oil', price: 55 },
  { id: 'shampoo', label: 'Daily shampoo', price: 68 },
  { id: 'conditioner', label: 'Leave-in conditioner', price: 72 },
  { id: 'comb', label: 'Wide-tooth comb', price: 28 },
]

/** Manager-painted walk-in-only windows — online booking cannot take these (spec § Walk-in slots). */
export type WalkInBlock = {
  id: string
  startMinutes: number
  endMinutes: number
  label: string
}

export const initialWalkInBlocks: WalkInBlock[] = [
  {
    id: 'wb-peak-am',
    startMinutes: 10 * 60 + 45,
    endMinutes: 12 * 60,
    label: 'Peak walk-in',
  },
  {
    id: 'wb-lunch',
    startMinutes: 12 * 60,
    endMinutes: 14 * 60,
    label: 'Lunch rush walk-in',
  },
]

/** Demo manager PIN for acting as Manager (void/refund / manager mode). */
export const MANAGER_PIN = '2468'

export function serviceLabelFromIds(ids: string[]) {
  return ids
    .map((id) => serviceOptions.find((s) => s.id === id)?.label ?? id)
    .join(' + ')
}

export function serviceAmountFromIds(ids: string[]) {
  return ids.reduce((sum, id) => sum + (serviceOptions.find((s) => s.id === id)?.price ?? 0), 0)
}

export function serviceDurationFromIds(ids: string[]) {
  return ids.reduce((sum, id) => sum + (serviceOptions.find((s) => s.id === id)?.durationMinutes ?? 0), 0)
}

/**
 * Demo clock is ~10:45am. Seed covers:
 * in-chair · waiting · late · upcoming · completed · party phases · retail on bill
 */
export const initialBookings: FloorBooking[] = [
  // —— Morning completed (My Day / revenue) ——
  {
    id: 'c1',
    staffId: 's1',
    startMinutes: 9 * 60,
    durationMinutes: 45,
    customer: 'Farid H.',
    phone: '+60111222333',
    services: 'Haircut',
    serviceIds: ['haircut'],
    status: 'completed',
    amount: 45,
    source: 'online',
  },
  {
    id: 'c2',
    staffId: 's2',
    startMinutes: 9 * 60,
    durationMinutes: 60,
    customer: 'Jason K.',
    phone: '+60133445566',
    services: 'Skin fade',
    serviceIds: ['skin-fade'],
    status: 'completed',
    amount: 103,
    source: 'online',
    retailItems: [
      { id: 'r-c2-1', productId: 'pomade', label: 'Clay pomade', amount: 48 },
    ],
  },
  {
    id: 'c3',
    staffId: 's3',
    startMinutes: 9 * 60 + 15,
    durationMinutes: 25,
    customer: 'Omar S.',
    services: 'Beard trim',
    serviceIds: ['beard-trim'],
    status: 'completed',
    amount: 25,
    source: 'walk-in',
  },
  {
    id: 'c4',
    staffId: 's1',
    startMinutes: 9 * 60 + 30,
    durationMinutes: 60,
    customer: 'Ahmad R.',
    phone: '+60145566778',
    services: 'Skin fade + beard',
    serviceIds: ['fade-beard'],
    status: 'completed',
    amount: 65,
    source: 'online',
  },
  {
    id: 'c4b',
    staffId: 's2',
    startMinutes: 9 * 60 + 45,
    durationMinutes: 45,
    customer: 'Lee W.',
    services: 'Wash + cut',
    serviceIds: ['wash-cut'],
    status: 'completed',
    amount: 55,
    source: 'online',
  },

  // —— In chair now (~10:45) ——
  {
    id: 'c5',
    staffId: 's2',
    startMinutes: 10 * 60,
    durationMinutes: 45,
    customer: 'Daniel T.',
    phone: '+60123456789',
    services: 'Haircut',
    serviceIds: ['haircut'],
    status: 'in-service',
    amount: 45,
    queueNumber: 26,
    source: 'online',
  },
  {
    id: 'c9',
    staffId: 's1',
    startMinutes: 10 * 60 + 15,
    durationMinutes: 60,
    customer: 'Hakim N.',
    phone: '+60187654321',
    services: 'Skin fade',
    serviceIds: ['skin-fade'],
    status: 'in-service',
    amount: 55,
    queueNumber: 28,
    source: 'online',
  },
  {
    id: 'c10',
    staffId: 's3',
    startMinutes: 10 * 60 + 20,
    durationMinutes: 45,
    customer: 'Arif Z.',
    phone: '+60199887766',
    services: 'Haircut',
    serviceIds: ['haircut'],
    actualServiceIds: ['haircut', 'beard-trim'],
    status: 'in-service',
    amount: 70,
    queueNumber: 29,
    source: 'walk-in',
  },

  // —— Waiting queue ——
  {
    id: 'c6',
    staffId: 's1',
    startMinutes: 10 * 60 + 30,
    durationMinutes: 30,
    customer: 'Noah (walk-in)',
    services: 'Kids cut',
    serviceIds: ['kids-cut'],
    status: 'checked-in',
    amount: 35,
    queueNumber: 27,
    source: 'walk-in',
  },
  {
    id: 'c11',
    staffId: 's2',
    startMinutes: 10 * 60 + 40,
    durationMinutes: 45,
    customer: 'Bryan C.',
    phone: '+60123334455',
    services: 'Haircut',
    serviceIds: ['haircut'],
    status: 'checked-in',
    amount: 45,
    queueNumber: 30,
    source: 'online',
  },
  {
    id: 'c12',
    staffId: 's3',
    startMinutes: 10 * 60 + 45,
    durationMinutes: 20,
    customer: 'Sam (walk-in)',
    services: 'Buzz cut',
    serviceIds: ['buzz'],
    status: 'checked-in',
    amount: 30,
    queueNumber: 31,
    source: 'walk-in',
  },
  {
    id: 'c13',
    staffId: 's1',
    startMinutes: 11 * 60,
    durationMinutes: 45,
    customer: 'Irfan M.',
    phone: '+60156677889',
    services: 'Wash + cut',
    serviceIds: ['wash-cut'],
    status: 'checked-in',
    amount: 55,
    queueNumber: 32,
    source: 'online',
  },

  // —— Late (confirmed, started ≥15m ago) ——
  {
    id: 'c14',
    staffId: 's2',
    startMinutes: 10 * 60,
    durationMinutes: 45,
    customer: 'Missing — Ken',
    phone: '+60167788990',
    services: 'Haircut',
    serviceIds: ['haircut'],
    status: 'confirmed',
    amount: 45,
    source: 'online',
  },
  {
    id: 'c15',
    staffId: 's3',
    startMinutes: 10 * 60 + 15,
    durationMinutes: 35,
    customer: 'Missing — Priya',
    services: 'Senior cut',
    serviceIds: ['senior-cut'],
    status: 'confirmed',
    amount: 35,
    source: 'online',
  },

  // —— Upcoming ——
  {
    id: 'c7',
    staffId: 's2',
    startMinutes: 11 * 60,
    durationMinutes: 55,
    customer: 'Marcus L.',
    phone: '+60112233445',
    services: 'Skin fade',
    serviceIds: ['skin-fade'],
    status: 'confirmed',
    amount: 55,
    source: 'online',
  },
  {
    id: 'c8',
    staffId: 's3',
    startMinutes: 11 * 60 + 30,
    durationMinutes: 25,
    customer: 'Wei J.',
    services: 'Beard trim',
    serviceIds: ['beard-trim'],
    status: 'confirmed',
    amount: 25,
    source: 'online',
  },
  {
    id: 'c16',
    staffId: 's1',
    startMinutes: 11 * 60 + 45,
    durationMinutes: 60,
    customer: 'Dinesh P.',
    phone: '+60178899001',
    services: 'Skin fade + beard',
    serviceIds: ['fade-beard'],
    status: 'confirmed',
    amount: 65,
    source: 'online',
  },
  {
    id: 'c17',
    staffId: 's2',
    startMinutes: 12 * 60,
    durationMinutes: 45,
    customer: 'Tom H.',
    services: 'Haircut',
    serviceIds: ['haircut'],
    status: 'confirmed',
    amount: 45,
    source: 'online',
  },
  {
    id: 'c18',
    staffId: 's3',
    startMinutes: 12 * 60 + 15,
    durationMinutes: 50,
    customer: 'Yusuf A.',
    phone: '+60121112233',
    services: 'Wash + cut',
    serviceIds: ['wash-cut'],
    status: 'confirmed',
    amount: 55,
    source: 'online',
  },
  {
    id: 'c19',
    staffId: 's1',
    startMinutes: 13 * 60,
    durationMinutes: 30,
    customer: 'Kids — Mia',
    services: 'Kids cut',
    serviceIds: ['kids-cut'],
    status: 'confirmed',
    amount: 35,
    source: 'online',
  },
  {
    id: 'c20',
    staffId: 's2',
    startMinutes: 13 * 60 + 30,
    durationMinutes: 60,
    customer: 'Ethan B.',
    services: 'Skin fade',
    serviceIds: ['skin-fade'],
    status: 'confirmed',
    amount: 55,
    source: 'online',
  },

  // —— Parties ——
  {
    id: 'p42',
    staffId: 's1',
    startMinutes: 14 * 60,
    durationMinutes: 90,
    customer: 'Rizal · Party of 3',
    phone: '+60198765432',
    services: 'Party · 3 guests',
    serviceIds: ['haircut'],
    amount: 145,
    status: 'confirmed',
    source: 'online',
    isParty: true,
    partySize: 3,
    partyPhase: 'booked',
    partyMembers: [
      {
        id: 'pm1',
        name: 'Abu',
        services: 'Haircut',
        serviceIds: ['haircut'],
        amount: 45,
        staffId: 's1',
        status: 'expected',
      },
      {
        id: 'pm2',
        name: 'Asif',
        services: 'Skin fade',
        serviceIds: ['skin-fade'],
        amount: 55,
        staffId: 's2',
        status: 'expected',
      },
      {
        id: 'pm3',
        name: 'Guest 3',
        services: 'Haircut',
        serviceIds: ['haircut'],
        amount: 45,
        staffId: 's1',
        status: 'expected',
      },
    ],
  },
  {
    id: 'p50',
    staffId: 's2',
    startMinutes: 10 * 60 + 30,
    durationMinutes: 75,
    customer: 'Brothers · Party of 2',
    phone: '+60134445566',
    services: 'Party · 2 guests',
    serviceIds: ['haircut'],
    amount: 90,
    status: 'in-service',
    queueNumber: 33,
    source: 'walk-in',
    isParty: true,
    partySize: 2,
    partyPhase: 'in-service',
    partyMembers: [
      {
        id: 'pm4',
        name: 'Ryan',
        services: 'Haircut',
        serviceIds: ['haircut'],
        amount: 45,
        staffId: 's2',
        status: 'in-chair',
      },
      {
        id: 'pm5',
        name: 'Kyle',
        services: 'Haircut',
        serviceIds: ['haircut'],
        amount: 45,
        staffId: 's3',
        status: 'waiting',
      },
    ],
  },
  {
    id: 'p51',
    staffId: 's1',
    startMinutes: 9 * 60 + 45,
    durationMinutes: 60,
    customer: 'Office group · Party of 2',
    phone: '+60145556677',
    services: 'Party · 2 guests',
    serviceIds: ['haircut'],
    amount: 100,
    status: 'in-service',
    queueNumber: 24,
    source: 'online',
    isParty: true,
    partySize: 2,
    partyPhase: 'ready-pay',
    partyMembers: [
      {
        id: 'pm6',
        name: 'Ben',
        services: 'Haircut',
        serviceIds: ['haircut'],
        amount: 45,
        staffId: 's1',
        status: 'done',
      },
      {
        id: 'pm7',
        name: 'Chris',
        services: 'Skin fade',
        serviceIds: ['skin-fade'],
        amount: 55,
        staffId: 's2',
        status: 'done',
      },
    ],
  },
]

/** Seeded paid tickets for My Day / recent transactions. */
export const initialTransactions: {
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
}[] = [
  {
    id: 'txn-c1',
    time: '9:45am',
    ref: 'RCPT-c1',
    customer: 'Farid H.',
    method: 'cash',
    gross: 45,
    fee: 0,
    net: 45,
    staffName: 'Hafiz',
    bookingId: 'c1',
    receiptUrl: 'https://miki.app/r/c1',
  },
  {
    id: 'txn-c2',
    time: '10:05am',
    ref: 'RCPT-c2',
    customer: 'Jason K.',
    method: 'hitpay',
    gross: 105.06,
    fee: 2.06,
    net: 103,
    staffName: 'Ivan',
    bookingId: 'c2',
    receiptUrl: 'https://miki.app/r/c2',
  },
  {
    id: 'txn-c3',
    time: '9:50am',
    ref: 'RCPT-c3',
    customer: 'Omar S.',
    method: 'cash',
    gross: 25,
    fee: 0,
    net: 25,
    staffName: 'Amir',
    bookingId: 'c3',
    receiptUrl: 'https://miki.app/r/c3',
  },
  {
    id: 'txn-c4',
    time: '10:35am',
    ref: 'RCPT-c4',
    customer: 'Ahmad R.',
    method: 'hitpay-card',
    gross: 66.3,
    fee: 1.3,
    net: 65,
    staffName: 'Hafiz',
    bookingId: 'c4',
    receiptUrl: 'https://miki.app/r/c4',
  },
  {
    id: 'txn-c4b',
    time: '10:40am',
    ref: 'RCPT-c4b',
    customer: 'Lee W.',
    method: 'duitnow',
    gross: 55,
    fee: 0,
    net: 55,
    staffName: 'Ivan',
    bookingId: 'c4b',
    receiptUrl: 'https://miki.app/r/c4b',
  },
]
