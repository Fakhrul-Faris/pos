'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type DayHours = {
  day: string
  open: string
  close: string
  closed: boolean
}

export type WalkInBlock = {
  id: string
  day: string
  start: string
  end: string
  label: string
}

export type PlanTier = 'trial' | 'lite' | 'ocelot' | 'mantis' | 'patriot'

export type ShopSettings = {
  organizationName: string
  brandName: string
  branchName: string
  address: string
  phone: string
  email: string
  timezone: string
  hours: DayHours[]
  allowPickStaff: boolean
  allowPartyBookings: boolean
  autoNoShowMinutes: number
  earlyArrivalGraceMinutes: number
  enableQueue: boolean
  qrPaymentAllowed: boolean
  walkInBlocks: WalkInBlock[]
  shopQrUrl: string
  counterQrUrl: string
  plan: PlanTier
  trialEndsAt: string
  billingCycle: 'monthly' | 'annual'
  ownerName: string
  ownerEmail: string
  payoutBankMasked: string
}

const defaultHours: DayHours[] = [
  { day: 'Mon', open: '10:00', close: '20:00', closed: false },
  { day: 'Tue', open: '10:00', close: '20:00', closed: false },
  { day: 'Wed', open: '10:00', close: '20:00', closed: false },
  { day: 'Thu', open: '10:00', close: '20:00', closed: false },
  { day: 'Fri', open: '10:00', close: '21:00', closed: false },
  { day: 'Sat', open: '09:00', close: '21:00', closed: false },
  { day: 'Sun', open: '10:00', close: '18:00', closed: true },
]

const seed: ShopSettings = {
  organizationName: 'Fade House Sdn Bhd',
  brandName: 'Fade House',
  branchName: 'Fade House PJ',
  address: '12 Jalan SS2/24, Petaling Jaya',
  phone: '+60 3-1234 5678',
  email: 'pj@fadehouse.my',
  timezone: 'Asia/Kuala_Lumpur',
  hours: defaultHours,
  allowPickStaff: true,
  allowPartyBookings: true,
  autoNoShowMinutes: 15,
  earlyArrivalGraceMinutes: 10,
  enableQueue: true,
  qrPaymentAllowed: true,
  walkInBlocks: [
    {
      id: 'wb1',
      day: 'Sat',
      start: '12:00',
      end: '14:00',
      label: 'Peak walk-in only',
    },
  ],
  shopQrUrl: 'https://book.miki.my/fade-house-pj',
  counterQrUrl: 'https://book.miki.my/fade-house-pj/retrieve',
  plan: 'trial',
  trialEndsAt: '2026-08-05',
  billingCycle: 'monthly',
  ownerName: 'Ahmad Kamal',
  ownerEmail: 'ahmad@fadehouse.my',
  payoutBankMasked: 'Maybank ·••• 4410',
}

export const PLAN_LABELS: Record<PlanTier, string> = {
  trial: 'Ocelot trial',
  lite: 'Ocelot Lite',
  ocelot: 'Ocelot',
  mantis: 'Mantis',
  patriot: 'Patriot',
}

/** Seat caps; keep in sync with bookingsStore.planEntitlements via upgradePlan */
export function merchantPlanForTier(
  plan: PlanTier,
): 'starter' | 'growth' | 'pro' {
  if (plan === 'mantis' || plan === 'patriot') return 'pro'
  if (plan === 'ocelot') return 'growth'
  return 'starter'
}

export const PLAN_PRICES: Record<PlanTier, string> = {
  trial: 'RM0 (14 days)',
  lite: 'RM0',
  ocelot: 'RM109/mo',
  mantis: 'RM199/mo',
  patriot: 'RM349/mo',
}

type SettingsContextValue = {
  settings: ShopSettings
  update: (patch: Partial<ShopSettings>) => void
  setHours: (day: string, patch: Partial<DayHours>) => void
  addWalkInBlock: (block: Omit<WalkInBlock, 'id'>) => void
  removeWalkInBlock: (id: string) => void
  setPlan: (plan: PlanTier) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ShopSettings>(seed)

  const update = useCallback((patch: Partial<ShopSettings>) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  const setHours = useCallback((day: string, patch: Partial<DayHours>) => {
    setSettings((s) => ({
      ...s,
      hours: s.hours.map((h) => (h.day === day ? { ...h, ...patch } : h)),
    }))
  }, [])

  const addWalkInBlock = useCallback((block: Omit<WalkInBlock, 'id'>) => {
    setSettings((s) => ({
      ...s,
      walkInBlocks: [
        ...s.walkInBlocks,
        { ...block, id: `wb-${Date.now()}` },
      ],
    }))
  }, [])

  const removeWalkInBlock = useCallback((id: string) => {
    setSettings((s) => ({
      ...s,
      walkInBlocks: s.walkInBlocks.filter((b) => b.id !== id),
    }))
  }, [])

  const setPlan = useCallback((plan: PlanTier) => {
    setSettings((s) => ({ ...s, plan }))
  }, [])

  const value = useMemo(
    () => ({
      settings,
      update,
      setHours,
      addWalkInBlock,
      removeWalkInBlock,
      setPlan,
    }),
    [settings, update, setHours, addWalkInBlock, removeWalkInBlock, setPlan],
  )

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  )
}

export function useShopSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useShopSettings must be used within SettingsProvider')
  return ctx
}
