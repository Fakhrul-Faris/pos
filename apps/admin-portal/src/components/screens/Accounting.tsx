'use client'

import { useMemo, useState } from 'react'

type AccTab = 'overview' | 'accounts' | 'journals' | 'periods'

const tabs: { id: AccTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'accounts', label: 'Chart of accounts' },
  { id: 'journals', label: 'Journals' },
  { id: 'periods', label: 'Fiscal periods' },
]

type GlAccount = {
  code: string
  name: string
  type: string
  balance: number
}

type JournalLine = {
  accountCode: string
  accountName: string
  debit: number
  credit: number
}

type JournalEntry = {
  id: string
  date: string
  memo: string
  period: string
  lines: JournalLine[]
}

type FiscalPeriod = {
  id: string
  label: string
  start: string
  end: string
  closed: boolean
}

const accounts: GlAccount[] = [
  { code: '1000', name: 'Operating bank', type: 'Asset', balance: 428500 },
  { code: '1100', name: 'HitPay clearing', type: 'Asset', balance: 18420 },
  { code: '2000', name: 'Merchant payables', type: 'Liability', balance: 312000 },
  { code: '4000', name: 'Surcharge revenue', type: 'Revenue', balance: 86400 },
  { code: '4100', name: 'Subscription revenue', type: 'Revenue', balance: 124800 },
  { code: '5000', name: 'Payment fees', type: 'Expense', balance: 12200 },
  { code: '5100', name: 'Cloud / infra', type: 'Expense', balance: 8900 },
]

const journals: JournalEntry[] = [
  {
    id: 'je-2407-01',
    date: '2026-07-15',
    memo: 'Recognize July 1-15 surcharge revenue',
    period: 'FY2026-P07',
    lines: [
      {
        accountCode: '1100',
        accountName: 'HitPay clearing',
        debit: 321.2,
        credit: 0,
      },
      {
        accountCode: '4000',
        accountName: 'Surcharge revenue',
        debit: 0,
        credit: 321.2,
      },
    ],
  },
  {
    id: 'je-2407-02',
    date: '2026-07-16',
    memo: 'Merchant payable accrual - Clip & Co period gap',
    period: 'FY2026-P07',
    lines: [
      {
        accountCode: '1100',
        accountName: 'HitPay clearing',
        debit: 0,
        credit: 418,
      },
      {
        accountCode: '2000',
        accountName: 'Merchant payables',
        debit: 418,
        credit: 0,
      },
    ],
  },
  {
    id: 'je-2407-03',
    date: '2026-07-12',
    memo: 'Brand subscription cash - Fade Room Ocelot',
    period: 'FY2026-P07',
    lines: [
      {
        accountCode: '1000',
        accountName: 'Operating bank',
        debit: 109,
        credit: 0,
      },
      {
        accountCode: '4100',
        accountName: 'Subscription revenue',
        debit: 0,
        credit: 109,
      },
    ],
  },
]

const periods: FiscalPeriod[] = [
  {
    id: 'FY2026-P06',
    label: 'Jun 2026',
    start: '2026-06-01',
    end: '2026-06-30',
    closed: true,
  },
  {
    id: 'FY2026-P07',
    label: 'Jul 2026',
    start: '2026-07-01',
    end: '2026-07-31',
    closed: false,
  },
  {
    id: 'FY2026-P08',
    label: 'Aug 2026',
    start: '2026-08-01',
    end: '2026-08-31',
    closed: false,
  },
]

function formatMoney(n: number) {
  return `RM ${n.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** Platform (Miki) books only - merchant GL lives in Merchant Portal. */
export function Accounting() {
  const [tab, setTab] = useState<AccTab>('overview')
  const [selectedJournal, setSelectedJournal] = useState<string | null>(
    journals[0]?.id ?? null,
  )

  const totals = useMemo(() => {
    const by = (t: string) =>
      accounts.filter((a) => a.type === t).reduce((s, a) => s + a.balance, 0)
    return {
      assets: by('Asset'),
      liabilities: by('Liability'),
      revenue: by('Revenue'),
      expense: by('Expense'),
    }
  }, [])

  const journal = journals.find((j) => j.id === selectedJournal) ?? null

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="page-title">
          Platform books
        </h1>
        <p className="page-desc">
          Miki GL only. Merchant books stay in Merchant Portal. Finance
          (Refunds / Transactions / Reconciliation) is HitPay ops - not this ledger.
        </p>
      </header>

      <div className="geist-panel px-3 py-2 text-[12px] text-gray-900">
        Utilitarian tables for ops review. No analytics charts. Do not mix
        merchant tenancy into these accounts.
      </div>

      <div className="flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            data-active={tab === t.id ? 'true' : 'false'}
            onClick={() => setTab(t.id)}
            className="geist-chip"
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ['Assets', totals.assets],
              ['Liabilities', totals.liabilities],
              ['Revenue', totals.revenue],
              ['Expenses', totals.expense],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-[12px] border border-gray-400 bg-gray-100 px-3 py-2"
            >
              <p className="text-xs text-gray-900">{label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-gray-1000">
                {formatMoney(value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'accounts' && (
        <div className="geist-panel overflow-x-auto">
          <table className="geist-table min-w-[560px]">
            <thead>
              <tr>
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium">Account</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.code} className="border-t border-gray-400">
                  <td className="px-3 py-2 tabular-nums text-gray-900">{a.code}</td>
                  <td className="px-3 py-2 font-medium text-gray-1000">{a.name}</td>
                  <td className="px-3 py-2 text-gray-900">{a.type}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-1000">
                    {formatMoney(a.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'journals' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="geist-panel overflow-hidden">
            <table className="geist-table">
              <thead>
                <tr>
                  <th className="px-3 py-2 font-medium">Entry</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Period</th>
                </tr>
              </thead>
              <tbody>
                {journals.map((j) => (
                  <tr
                    key={j.id}
                    onClick={() => setSelectedJournal(j.id)}
                    className={[
                      'cursor-pointer border-t border-gray-400',
                      selectedJournal === j.id
                        ? 'bg-gray-200'
                        : 'hover:bg-gray-200',
                    ].join(' ')}
                  >
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-1000">{j.id}</p>
                      <p className="text-xs text-gray-900">{j.memo}</p>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900">{j.date}</td>
                    <td className="px-3 py-2 text-xs text-gray-900">{j.period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {journal ? (
            <div className="geist-panel p-4">
              <p className="text-xs text-gray-900">{journal.id}</p>
              <h2 className="mt-1 text-sm font-semibold text-gray-1000">
                {journal.memo}
              </h2>
              <p className="mt-1 text-xs text-gray-900">
                {journal.date} · {journal.period}
              </p>
              <table className="mt-4 w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="py-2 font-medium">Account</th>
                    <th className="py-2 text-right font-medium">Debit</th>
                    <th className="py-2 text-right font-medium">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {journal.lines.map((l, i) => (
                    <tr key={`${l.accountCode}-${i}`} className="border-t border-gray-400">
                      <td className="py-2">
                        <span className="tabular-nums text-gray-900">{l.accountCode}</span>{' '}
                        {l.accountName}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {l.debit ? formatMoney(l.debit) : '-'}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {l.credit ? formatMoney(l.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-400 p-6 text-sm text-gray-900">
              Select a journal entry
            </div>
          )}
        </div>
      )}

      {tab === 'periods' && (
        <div className="geist-panel overflow-x-auto">
          <table className="geist-table min-w-[480px]">
            <thead>
              <tr>
                <th className="px-3 py-2 font-medium">Period</th>
                <th className="px-3 py-2 font-medium">Range</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id} className="border-t border-gray-400">
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-1000">{p.label}</p>
                    <p className="text-xs text-gray-900">{p.id}</p>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-900">
                    {p.start} → {p.end}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={[
                        'rounded-[6px] px-2 py-0.5 text-xs font-medium',
                        p.closed
                          ? 'bg-gray-200 text-gray-900'
                          : 'bg-amber-100 text-amber-900',
                      ].join(' ')}
                    >
                      {p.closed ? 'Closed' : 'Open'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
