'use client'

import { useMemo, useState } from 'react'
import type { PaymentMethod, Transaction, TransactionStatus } from '../data/mock'
import { useBookings } from '../data/bookingsStore'

function formatMoney(amount: number, showDecimals = true) {
  return `RM ${amount.toLocaleString('en-MY', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })}`
}

function MethodBadge({ method }: { method: PaymentMethod }) {
  const config: Record<PaymentMethod, { label: string; className: string }> = {
    cash: { label: 'Cash', className: 'bg-mist text-graphite' },
    duitnow: { label: 'DuitNow', className: 'bg-mist text-sky' },
    hitpay: { label: 'HitPay', className: 'bg-mist text-lavender' },
  }
  const { label, className } = config[method]
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const config: Record<TransactionStatus, { label: string; className: string }> = {
    completed: { label: 'Completed', className: 'bg-mint-wash text-mint' },
    pending: { label: 'Pending', className: 'bg-[#fff4e0] text-amber' },
    refunded: { label: 'Refunded', className: 'bg-mist text-ash' },
    failed: { label: 'Failed', className: 'bg-[#ffe8e0] text-ember' },
  }
  const { label, className } = config[status]
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

type MethodFilter = 'all' | PaymentMethod
type StatusFilter = 'all' | TransactionStatus
type SortOption = 'time-desc' | 'time-asc' | 'gross-desc' | 'net-desc'

function SummaryCell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border-r border-fog px-4 py-3 last:border-r-0">
      <p className="text-xs text-ash">{label}</p>
      <p className="font-display tabular-nums mt-0.5 text-lg font-medium tracking-ui text-carbon">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-ash">{hint}</p>}
    </div>
  )
}

function PillButton({
  label,
  onClick,
  active,
}: {
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'bg-carbon text-paper-white' : 'bg-mist text-graphite hover:bg-fog',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function filterCount(method: MethodFilter, status: StatusFilter, staff: string) {
  let n = 0
  if (method !== 'all') n++
  if (status !== 'all') n++
  if (staff !== 'All') n++
  return n
}

export function Transactions({
  selectedTransactionId,
  onSelectTransaction,
}: {
  selectedTransactionId?: string
  onSelectTransaction?: (id: string) => void
}) {
  const { transactions, getTransactionSummary, staff } = useBookings()
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [staffFilter, setStaffFilter] = useState<string>('All')
  const [sort, setSort] = useState<SortOption>('time-desc')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const staffOptions = useMemo(() => ['All', ...staff.map((s) => s.name)], [staff])

  const filtered = useMemo(() => {
    const base = transactions.filter((t) => {
      if (methodFilter !== 'all' && t.method !== methodFilter) return false
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (staffFilter !== 'All' && t.staff !== staffFilter) return false
      return true
    })

    const sorted = [...base]
    sorted.sort((a, b) => {
      if (sort === 'time-asc') return a.time.localeCompare(b.time)
      if (sort === 'time-desc') return b.time.localeCompare(a.time)
      if (sort === 'gross-desc') return b.gross - a.gross
      if (sort === 'net-desc') return b.net - a.net
      return 0
    })
    return sorted
  }, [transactions, methodFilter, statusFilter, staffFilter, sort])

  const summary = useMemo(() => {
    const base = filtered
    const gross = base.reduce((sum, t) => sum + t.gross, 0)
    const fees = base.reduce((sum, t) => sum + t.fee, 0)
    const net = base.reduce((sum, t) => sum + t.net, 0)
    const pending = base.filter((t) => t.status === 'pending').length
    return {
      ...getTransactionSummary(),
      gross,
      fees,
      net,
      count: base.length,
      pending,
    }
  }, [filtered, getTransactionSummary])

  const activeFilters = filterCount(methodFilter, statusFilter, staffFilter)

  return (
    <div className="w-full rounded-xl border border-fog px-4 py-4 sm:px-6 sm:py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-ui text-ash">Payments</p>
          <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-ash">
            Tuesday, 7 Jul · {summary.count} transactions · {summary.pending} pending
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFilterOpen((v) => !v)
              setSortOpen(false)
            }}
            className="btn-ghost px-4 py-2"
          >
            Filter{activeFilters > 0 ? ` (${activeFilters})` : ''}
          </button>
          <button
            type="button"
            onClick={() => {
              setSortOpen((v) => !v)
              setFilterOpen(false)
            }}
            className="btn-ghost px-4 py-2"
          >
            Sort
          </button>
          <button type="button" className="btn-ghost px-4 py-2">
            Export CSV
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-[360px] overflow-x-auto rounded-xl border border-fog bg-paper-white shadow-panel">
              <div className="flex items-center justify-between border-b border-fog px-4 py-3">
                <p className="text-sm font-medium text-carbon">Filter</p>
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="text-xs font-medium text-lavender hover:text-iris"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4 p-4">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-ui text-ash">
                    Method
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'all' as const, label: 'All' },
                        { id: 'cash' as const, label: 'Cash' },
                        { id: 'duitnow' as const, label: 'DuitNow' },
                        { id: 'hitpay' as const, label: 'HitPay' },
                      ] as const
                    ).map((opt) => (
                      <PillButton
                        key={opt.id}
                        label={opt.label}
                        active={methodFilter === opt.id}
                        onClick={() => setMethodFilter(opt.id)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-ui text-ash">
                    Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'all' as const, label: 'All' },
                        { id: 'completed' as const, label: 'Completed' },
                        { id: 'pending' as const, label: 'Pending' },
                        { id: 'refunded' as const, label: 'Refunded' },
                        { id: 'failed' as const, label: 'Failed' },
                      ] as const
                    ).map((opt) => (
                      <PillButton
                        key={opt.id}
                        label={opt.label}
                        active={statusFilter === opt.id}
                        onClick={() => setStatusFilter(opt.id)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-ui text-ash">
                    Staff
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {staffOptions.map((name) => (
                      <PillButton
                        key={name}
                        label={name}
                        active={staffFilter === name}
                        onClick={() => setStaffFilter(name)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t border-fog p-3">
                <button
                  type="button"
                  onClick={() => {
                    setMethodFilter('all')
                    setStatusFilter('all')
                    setStaffFilter('All')
                  }}
                  className="flex-1 rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm font-medium text-carbon transition-colors hover:bg-mist"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="flex-1 rounded-lg bg-carbon px-3 py-2 text-sm font-medium text-paper-white transition-colors hover:bg-carbon/90"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {sortOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-[260px] overflow-x-auto rounded-xl border border-fog bg-paper-white shadow-panel">
              <div className="border-b border-fog px-4 py-3">
                <p className="text-sm font-medium text-carbon">Sort</p>
              </div>
              <div className="p-3">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'time-desc' as const, label: 'Time (newest)' },
                      { id: 'time-asc' as const, label: 'Time (oldest)' },
                      { id: 'gross-desc' as const, label: 'Gross (high)' },
                      { id: 'net-desc' as const, label: 'Net (high)' },
                    ] as const
                  ).map((opt) => (
                    <PillButton
                      key={opt.id}
                      label={opt.label}
                      active={sort === opt.id}
                      onClick={() => {
                        setSort(opt.id)
                        setSortOpen(false)
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Summary strip - precise mode, no card decoration */}
      <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-lg border border-fog bg-paper-white lg:grid-cols-4">
        <SummaryCell label="Gross sales" value={formatMoney(summary.gross, false)} />
        <SummaryCell label="Platform fees" value={formatMoney(summary.fees)} hint="HitPay 2%" />
        <SummaryCell label="Net received" value={formatMoney(summary.net)} />
        <SummaryCell
          label="Payout status"
          value="Queued"
          hint="Next transfer Mon 8am"
        />
      </div>

      {/* Ledger table */}
      <div className="overflow-hidden rounded-lg border border-fog bg-paper-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-fog bg-linen/60 text-xs text-ash">
                <th className="px-4 py-2.5 font-medium">Time</th>
                <th className="px-4 py-2.5 font-medium">Reference</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Method</th>
                <th className="px-4 py-2.5 font-medium">Staff</th>
                <th className="px-4 py-2.5 text-right font-medium">Gross</th>
                <th className="px-4 py-2.5 text-right font-medium">Fee</th>
                <th className="px-4 py-2.5 text-right font-medium">Net</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((txn: Transaction) => {
                const isSelected = selectedTransactionId === txn.id
                return (
                  <tr
                    key={txn.id}
                    onClick={() => onSelectTransaction?.(txn.id)}
                    className={[
                      'cursor-pointer border-b border-fog last:border-0 hover:bg-linen/50',
                      isSelected ? 'bg-mist/70' : '',
                    ].join(' ')}
                  >
                    <td className="tabular-nums px-4 py-2.5 font-medium text-carbon">
                      <span className="flex items-center gap-2">
                        <span
                          className={[
                            'h-2 w-2 shrink-0 rounded-full',
                            isSelected ? 'bg-lavender' : 'bg-fog',
                          ].join(' ')}
                          aria-hidden
                        />
                        {txn.time}
                      </span>
                    </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-graphite">{txn.ref}</td>
                  <td className="px-4 py-2.5 text-carbon">{txn.customer}</td>
                  <td className="px-4 py-2.5">
                    <MethodBadge method={txn.method} />
                  </td>
                  <td className="px-4 py-2.5 text-graphite">{txn.staff}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right font-medium text-carbon">
                    {formatMoney(txn.gross, false)}
                  </td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-graphite">
                    {txn.fee > 0 ? formatMoney(txn.fee) : '-'}
                  </td>
                  <td className="tabular-nums px-4 py-2.5 text-right font-medium text-carbon">
                    {txn.net > 0 ? formatMoney(txn.net) : '-'}
                  </td>
                  <td className="px-4 py-2.5">
                    <TransactionStatusBadge status={txn.status} />
                  </td>
                </tr>
              )})}
            </tbody>
            <tfoot>
              <tr className="border-t border-fog bg-linen/40 text-sm font-medium">
                <td colSpan={5} className="px-4 py-3 text-carbon">
                  Total
                </td>
                <td className="tabular-nums px-4 py-3 text-right text-carbon">
                  {formatMoney(summary.gross, false)}
                </td>
                <td className="tabular-nums px-4 py-3 text-right text-graphite">
                  {formatMoney(summary.fees)}
                </td>
                <td className="tabular-nums px-4 py-3 text-right text-carbon">
                  {formatMoney(summary.net)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
