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
  isParty?: boolean
  partySize?: number
  partyMembers?: PartyMember[]
  partyPhase?: PartyPhase
}

export type ServiceOption = {
  id: string
  label: string
  durationMinutes: number
  price: number
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
]

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

// Demo state roughly matching portal day.
export const initialBookings: FloorBooking[] = [
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
    id: 'c6',
    staffId: 's1',
    startMinutes: 10 * 60 + 30,
    durationMinutes: 30,
    customer: 'Walk-in',
    services: 'Kids cut',
    serviceIds: ['kids-cut'],
    status: 'checked-in',
    amount: 35,
    queueNumber: 27,
    source: 'walk-in',
  },
  {
    id: 'p42',
    staffId: 's1',
    startMinutes: 10 * 60 + 15,
    durationMinutes: 90,
    customer: 'Rizal · Party of 3',
    phone: '+60198765432',
    services: 'Party · 3 guests',
    serviceIds: ['haircut'],
    amount: 135,
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
    id: 'c4',
    staffId: 's1',
    startMinutes: 9 * 60 + 30,
    durationMinutes: 60,
    customer: 'Ahmad R.',
    services: 'Skin fade + beard',
    serviceIds: ['fade-beard'],
    status: 'completed',
    amount: 65,
    source: 'online',
  },
]
