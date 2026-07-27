'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type CommissionRate = {
  staffId: string
  /** Percent of completed booking revenue (0-100) */
  ratePercent: number
}

type ReportsContextValue = {
  rates: CommissionRate[]
  setRate: (staffId: string, ratePercent: number) => void
  getRate: (staffId: string) => number
}

const ReportsContext = createContext<ReportsContextValue | null>(null)

const seedRates: CommissionRate[] = [
  { staffId: 's1', ratePercent: 40 },
  { staffId: 's2', ratePercent: 35 },
  { staffId: 's3', ratePercent: 30 },
]

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [rates, setRates] = useState(seedRates)

  const setRate = useCallback((staffId: string, ratePercent: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(ratePercent * 10) / 10))
    setRates((prev) => {
      const exists = prev.some((r) => r.staffId === staffId)
      if (exists) {
        return prev.map((r) =>
          r.staffId === staffId ? { ...r, ratePercent: clamped } : r,
        )
      }
      return [...prev, { staffId, ratePercent: clamped }]
    })
  }, [])

  const getRate = useCallback(
    (staffId: string) => rates.find((r) => r.staffId === staffId)?.ratePercent ?? 30,
    [rates],
  )

  const value = useMemo(
    () => ({ rates, setRate, getRate }),
    [rates, setRate, getRate],
  )

  return (
    <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>
  )
}

export function useReports() {
  const ctx = useContext(ReportsContext)
  if (!ctx) throw new Error('useReports must be used within ReportsProvider')
  return ctx
}
