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

export type AccountType =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'expense'

export type NormalBalance = 'debit' | 'credit'

export type GlAccount = {
  id: string
  code: string
  name: string
  type: AccountType
  normalBalance: NormalBalance
  description: string
  active: boolean
}

export type JournalStatus = 'draft' | 'posted' | 'void'

export type JournalLine = {
  id: string
  accountId: string
  description: string
  debit: number
  credit: number
}

export type JournalEntry = {
  id: string
  number: string
  date: string
  description: string
  reference: string
  status: JournalStatus
  lines: JournalLine[]
  postedAt: string | null
}

type AccountingContextValue = {
  accounts: GlAccount[]
  journals: JournalEntry[]
  addAccount: (input: Omit<GlAccount, 'id' | 'active'>) => void
  toggleAccount: (id: string) => void
  addJournal: (input: {
    date: string
    description: string
    reference: string
    lines: Omit<JournalLine, 'id'>[]
  }) => string | null
  postJournal: (id: string) => void
  voidJournal: (id: string) => void
  accountBalances: () => {
    accountId: string
    debit: number
    credit: number
    balance: number
  }[]
}

const AccountingContext = createContext<AccountingContextValue | null>(null)

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
}

const seedAccounts: GlAccount[] = [
  {
    id: 'a-1000',
    code: '1000',
    name: 'Cash on hand',
    type: 'asset',
    normalBalance: 'debit',
    description: 'Till & petty cash',
    active: true,
  },
  {
    id: 'a-1100',
    code: '1100',
    name: 'Bank - operating',
    type: 'asset',
    normalBalance: 'debit',
    description: 'Business current account',
    active: true,
  },
  {
    id: 'a-1200',
    code: '1200',
    name: 'Accounts receivable',
    type: 'asset',
    normalBalance: 'debit',
    description: '',
    active: true,
  },
  {
    id: 'a-2000',
    code: '2000',
    name: 'Accounts payable',
    type: 'liability',
    normalBalance: 'credit',
    description: '',
    active: true,
  },
  {
    id: 'a-2100',
    code: '2100',
    name: 'HitPay clearing',
    type: 'liability',
    normalBalance: 'credit',
    description: 'Pending settlements',
    active: true,
  },
  {
    id: 'a-3000',
    code: '3000',
    name: 'Owner equity',
    type: 'equity',
    normalBalance: 'credit',
    description: '',
    active: true,
  },
  {
    id: 'a-4000',
    code: '4000',
    name: 'Service revenue',
    type: 'revenue',
    normalBalance: 'credit',
    description: 'Cuts & treatments',
    active: true,
  },
  {
    id: 'a-4100',
    code: '4100',
    name: 'Retail revenue',
    type: 'revenue',
    normalBalance: 'credit',
    description: 'Product sales',
    active: true,
  },
  {
    id: 'a-5000',
    code: '5000',
    name: 'COGS - retail',
    type: 'expense',
    normalBalance: 'debit',
    description: '',
    active: true,
  },
  {
    id: 'a-5100',
    code: '5100',
    name: 'Payroll expense',
    type: 'expense',
    normalBalance: 'debit',
    description: 'Local payroll only',
    active: true,
  },
  {
    id: 'a-5200',
    code: '5200',
    name: 'Rent',
    type: 'expense',
    normalBalance: 'debit',
    description: '',
    active: true,
  },
  {
    id: 'a-5300',
    code: '5300',
    name: 'Payment fees',
    type: 'expense',
    normalBalance: 'debit',
    description: 'HitPay / gateway fees',
    active: true,
  },
]

const seedJournals: JournalEntry[] = [
  {
    id: 'je1',
    number: 'JE-1001',
    date: '2026-07-05',
    description: 'Opening balances',
    reference: 'OB-2026',
    status: 'posted',
    postedAt: '2026-07-05',
    lines: [
      {
        id: 'jl1',
        accountId: 'a-1100',
        description: 'Bank opening',
        debit: 15000,
        credit: 0,
      },
      {
        id: 'jl2',
        accountId: 'a-1000',
        description: 'Till opening',
        debit: 500,
        credit: 0,
      },
      {
        id: 'jl3',
        accountId: 'a-3000',
        description: 'Owner capital',
        debit: 0,
        credit: 15500,
      },
    ],
  },
  {
    id: 'je2',
    number: 'JE-1002',
    date: calendarToday,
    description: 'Day sales - services (cash + HitPay)',
    reference: 'POS-DAY',
    status: 'posted',
    postedAt: calendarToday,
    lines: [
      {
        id: 'jl4',
        accountId: 'a-1000',
        description: 'Cash sales',
        debit: 320,
        credit: 0,
      },
      {
        id: 'jl5',
        accountId: 'a-2100',
        description: 'HitPay gross',
        debit: 480,
        credit: 0,
      },
      {
        id: 'jl6',
        accountId: 'a-5300',
        description: 'Gateway fees',
        debit: 9.6,
        credit: 0,
      },
      {
        id: 'jl7',
        accountId: 'a-4000',
        description: 'Service revenue',
        debit: 0,
        credit: 800,
      },
      {
        id: 'jl8',
        accountId: 'a-2100',
        description: 'Fee against clearing',
        debit: 0,
        credit: 9.6,
      },
    ],
  },
  {
    id: 'je3',
    number: 'JE-1003',
    date: calendarToday,
    description: 'Shop rent - July',
    reference: 'RENT-JUL',
    status: 'draft',
    postedAt: null,
    lines: [
      {
        id: 'jl9',
        accountId: 'a-5200',
        description: 'Rent expense',
        debit: 4500,
        credit: 0,
      },
      {
        id: 'jl10',
        accountId: 'a-1100',
        description: 'Bank payment',
        debit: 0,
        credit: 4500,
      },
    ],
  },
]

function lineTotals(lines: { debit: number; credit: number }[]) {
  return {
    debit: lines.reduce((s, l) => s + l.debit, 0),
    credit: lines.reduce((s, l) => s + l.credit, 0),
  }
}

export function AccountingProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState(seedAccounts)
  const [journals, setJournals] = useState(seedJournals)
  const [entrySeq, setEntrySeq] = useState(1004)

  const addAccount = useCallback((input: Omit<GlAccount, 'id' | 'active'>) => {
    setAccounts((prev) => [
      ...prev,
      { ...input, id: uid('a'), active: true },
    ])
  }, [])

  const toggleAccount = useCallback((id: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)),
    )
  }, [])

  const addJournal = useCallback(
    (input: {
      date: string
      description: string
      reference: string
      lines: Omit<JournalLine, 'id'>[]
    }) => {
      const totals = lineTotals(input.lines)
      if (input.lines.length < 2) return null
      if (Math.abs(totals.debit - totals.credit) > 0.001) return null

      const number = `JE-${entrySeq}`
      setEntrySeq((n) => n + 1)
      const id = uid('je')
      setJournals((prev) => [
        {
          id,
          number,
          date: input.date,
          description: input.description,
          reference: input.reference,
          status: 'draft',
          postedAt: null,
          lines: input.lines.map((l, i) => ({
            ...l,
            id: `${id}-l${i}`,
          })),
        },
        ...prev,
      ])
      return id
    },
    [entrySeq],
  )

  const postJournal = useCallback((id: string) => {
    setJournals((prev) =>
      prev.map((j) => {
        if (j.id !== id || j.status !== 'draft') return j
        const totals = lineTotals(j.lines)
        if (Math.abs(totals.debit - totals.credit) > 0.001) return j
        return { ...j, status: 'posted', postedAt: calendarToday }
      }),
    )
  }, [])

  const voidJournal = useCallback((id: string) => {
    setJournals((prev) =>
      prev.map((j) =>
        j.id === id && j.status === 'draft'
          ? { ...j, status: 'void' }
          : j,
      ),
    )
  }, [])

  const accountBalances = useCallback(() => {
    const map = new Map<
      string,
      { accountId: string; debit: number; credit: number; balance: number }
    >()
    for (const a of accounts) {
      map.set(a.id, { accountId: a.id, debit: 0, credit: 0, balance: 0 })
    }
    for (const j of journals) {
      if (j.status !== 'posted') continue
      for (const line of j.lines) {
        const row = map.get(line.accountId)
        if (!row) continue
        row.debit += line.debit
        row.credit += line.credit
      }
    }
    for (const a of accounts) {
      const row = map.get(a.id)
      if (!row) continue
      row.balance =
        a.normalBalance === 'debit'
          ? row.debit - row.credit
          : row.credit - row.debit
    }
    return [...map.values()]
  }, [accounts, journals])

  const value = useMemo(
    () => ({
      accounts,
      journals,
      addAccount,
      toggleAccount,
      addJournal,
      postJournal,
      voidJournal,
      accountBalances,
    }),
    [
      accounts,
      journals,
      addAccount,
      toggleAccount,
      addJournal,
      postJournal,
      voidJournal,
      accountBalances,
    ],
  )

  return (
    <AccountingContext.Provider value={value}>
      {children}
    </AccountingContext.Provider>
  )
}

export function useAccounting() {
  const ctx = useContext(AccountingContext)
  if (!ctx) {
    throw new Error('useAccounting must be used within AccountingProvider')
  }
  return ctx
}
