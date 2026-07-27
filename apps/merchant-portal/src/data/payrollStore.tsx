'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type PayLine = {
  id: string
  description: string
  amount: number
  kind: 'allowance' | 'deduction'
}

export type PayStructure = {
  id: string
  staffId: string
  name: string
  basicSalary: number
  lines: PayLine[]
  active: boolean
}

export type PeriodStatus = 'open' | 'processing' | 'closed'

export type PayPeriod = {
  id: string
  name: string
  year: number
  month: number
  startDate: string
  endDate: string
  paymentDate: string
  status: PeriodStatus
}

export type PayslipStatus = 'draft' | 'approved' | 'paid'

export type Payslip = {
  id: string
  number: string
  periodId: string
  staffId: string
  basicSalary: number
  totalAllowance: number
  totalDeduction: number
  totalSalaryCut: number
  totalShiftEarning: number
  commission: number
  netPay: number
  status: PayslipStatus
  remarks: string
  lines: PayLine[]
}

type PayrollContextValue = {
  structures: PayStructure[]
  periods: PayPeriod[]
  payslips: Payslip[]
  upsertStructure: (input: {
    staffId: string
    name: string
    basicSalary: number
    allowance: number
    deduction: number
  }) => void
  setStructureActive: (id: string, active: boolean) => void
  createPeriod: (input: {
    year: number
    month: number
    paymentDate: string
  }) => string
  generateRun: (
    periodId: string,
    staff: { id: string; name: string }[],
    commissionByStaff: Record<string, number>,
  ) => void
  approvePayslip: (id: string) => void
  markPaid: (id: string) => void
  closePeriod: (id: string) => void
}

const PayrollContext = createContext<PayrollContextValue | null>(null)

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
}

function monthName(year: number, month: number) {
  return new Intl.DateTimeFormat('en-MY', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function periodDates(year: number, month: number) {
  const last = new Date(year, month, 0).getDate()
  return {
    startDate: `${year}-${pad(month)}-01`,
    endDate: `${year}-${pad(month)}-${pad(last)}`,
  }
}

const seedStructures: PayStructure[] = [
  {
    id: 'ps1',
    staffId: 's1',
    name: 'Hafiz - standard',
    basicSalary: 2800,
    lines: [
      {
        id: 'pl1',
        description: 'Transport allowance',
        amount: 150,
        kind: 'allowance',
      },
      {
        id: 'pl2',
        description: 'Advance recovery',
        amount: 100,
        kind: 'deduction',
      },
    ],
    active: true,
  },
  {
    id: 'ps2',
    staffId: 's2',
    name: 'Ivan - standard',
    basicSalary: 2600,
    lines: [
      {
        id: 'pl3',
        description: 'Transport allowance',
        amount: 150,
        kind: 'allowance',
      },
    ],
    active: true,
  },
  {
    id: 'ps3',
    staffId: 's3',
    name: 'Amir - standard',
    basicSalary: 2400,
    lines: [
      {
        id: 'pl4',
        description: 'Transport allowance',
        amount: 100,
        kind: 'allowance',
      },
    ],
    active: true,
  },
]

const seedPeriods: PayPeriod[] = [
  {
    id: 'pp-jun',
    name: 'June 2026',
    year: 2026,
    month: 6,
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    paymentDate: '2026-07-05',
    status: 'closed',
  },
  {
    id: 'pp-jul',
    name: 'July 2026',
    year: 2026,
    month: 7,
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    paymentDate: '2026-08-05',
    status: 'open',
  },
]

function buildPayslip(
  period: PayPeriod,
  structure: PayStructure,
  commission: number,
  index: number,
): Payslip {
  const allowanceLines = structure.lines.filter((l) => l.kind === 'allowance')
  const deductionLines = structure.lines.filter((l) => l.kind === 'deduction')
  const totalAllowance =
    allowanceLines.reduce((s, l) => s + l.amount, 0) + commission
  const totalDeduction = deductionLines.reduce((s, l) => s + l.amount, 0)
  const totalSalaryCut = 0
  const totalShiftEarning = 0
  const netPay =
    structure.basicSalary +
    totalAllowance +
    totalShiftEarning -
    totalDeduction -
    totalSalaryCut

  const lines: PayLine[] = [
    ...allowanceLines,
    ...(commission > 0
      ? [
          {
            id: uid('comm'),
            description: 'Commission (from Reports)',
            amount: commission,
            kind: 'allowance' as const,
          },
        ]
      : []),
    ...deductionLines,
  ]

  return {
    id: uid('slip'),
    number: `PAY-${period.year}${pad(period.month)}-${pad(index + 1)}`,
    periodId: period.id,
    staffId: structure.staffId,
    basicSalary: structure.basicSalary,
    totalAllowance,
    totalDeduction,
    totalSalaryCut,
    totalShiftEarning,
    commission,
    netPay,
    status: 'draft',
    remarks: '',
    lines,
  }
}

const seedPayslips: Payslip[] = (() => {
  const jun = seedPeriods[0]
  return seedStructures.map((s, i) => {
    const slip = buildPayslip(jun, s, i === 0 ? 420 : i === 1 ? 310 : 180, i)
    return { ...slip, id: `slip-jun-${i}`, status: 'paid' as const }
  })
})()

export function PayrollProvider({ children }: { children: ReactNode }) {
  const [structures, setStructures] = useState(seedStructures)
  const [periods, setPeriods] = useState(seedPeriods)
  const [payslips, setPayslips] = useState(seedPayslips)

  const upsertStructure = useCallback(
    (input: {
      staffId: string
      name: string
      basicSalary: number
      allowance: number
      deduction: number
    }) => {
      setStructures((prev) => {
        const lines: PayLine[] = []
        if (input.allowance > 0) {
          lines.push({
            id: uid('pl'),
            description: 'Allowance',
            amount: input.allowance,
            kind: 'allowance',
          })
        }
        if (input.deduction > 0) {
          lines.push({
            id: uid('pl'),
            description: 'Deduction',
            amount: input.deduction,
            kind: 'deduction',
          })
        }
        const existing = prev.find((s) => s.staffId === input.staffId && s.active)
        if (existing) {
          return prev.map((s) =>
            s.id === existing.id
              ? {
                  ...s,
                  name: input.name || s.name,
                  basicSalary: input.basicSalary,
                  lines,
                }
              : s,
          )
        }
        return [
          ...prev,
          {
            id: uid('ps'),
            staffId: input.staffId,
            name: input.name || 'Structure',
            basicSalary: input.basicSalary,
            lines,
            active: true,
          },
        ]
      })
    },
    [],
  )

  const setStructureActive = useCallback((id: string, active: boolean) => {
    setStructures((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active } : s)),
    )
  }, [])

  const createPeriod = useCallback(
    (input: { year: number; month: number; paymentDate: string }) => {
      const id = uid('pp')
      const { startDate, endDate } = periodDates(input.year, input.month)
      setPeriods((prev) => [
        {
          id,
          name: monthName(input.year, input.month),
          year: input.year,
          month: input.month,
          startDate,
          endDate,
          paymentDate: input.paymentDate,
          status: 'open',
        },
        ...prev,
      ])
      return id
    },
    [],
  )

  const generateRun = useCallback(
    (
      periodId: string,
      staff: { id: string; name: string }[],
      commissionByStaff: Record<string, number>,
    ) => {
      const period = periods.find((p) => p.id === periodId)
      if (!period) return

      const nextSlips: Payslip[] = []
      let i = 0
      for (const member of staff) {
        const structure = structures.find(
          (s) => s.staffId === member.id && s.active,
        )
        if (!structure) continue
        nextSlips.push(
          buildPayslip(
            period,
            structure,
            commissionByStaff[member.id] ?? 0,
            i,
          ),
        )
        i++
      }

      setPayslips((slips) => [
        ...nextSlips,
        ...slips.filter((s) => s.periodId !== periodId),
      ])
      setPeriods((prev) =>
        prev.map((p) =>
          p.id === periodId ? { ...p, status: 'processing' } : p,
        ),
      )
    },
    [periods, structures],
  )

  const approvePayslip = useCallback((id: string) => {
    setPayslips((prev) =>
      prev.map((s) =>
        s.id === id && s.status === 'draft' ? { ...s, status: 'approved' } : s,
      ),
    )
  }, [])

  const markPaid = useCallback((id: string) => {
    setPayslips((prev) =>
      prev.map((s) =>
        s.id === id && (s.status === 'approved' || s.status === 'draft')
          ? { ...s, status: 'paid' }
          : s,
      ),
    )
  }, [])

  const closePeriod = useCallback((id: string) => {
    setPeriods((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'closed' } : p)),
    )
    setPayslips((prev) =>
      prev.map((s) =>
        s.periodId === id && s.status !== 'paid'
          ? { ...s, status: 'paid' }
          : s,
      ),
    )
  }, [])

  const value = useMemo(
    () => ({
      structures,
      periods,
      payslips,
      upsertStructure,
      setStructureActive,
      createPeriod,
      generateRun,
      approvePayslip,
      markPaid,
      closePeriod,
    }),
    [
      structures,
      periods,
      payslips,
      upsertStructure,
      setStructureActive,
      createPeriod,
      generateRun,
      approvePayslip,
      markPaid,
      closePeriod,
    ],
  )

  return (
    <PayrollContext.Provider value={value}>{children}</PayrollContext.Provider>
  )
}

export function usePayroll() {
  const ctx = useContext(PayrollContext)
  if (!ctx) throw new Error('usePayroll must be used within PayrollProvider')
  return ctx
}
