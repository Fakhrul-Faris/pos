'use client'

import { useMemo, useState } from 'react'
import type { VerticalLabels } from '../data/mock'
import { calendarToday } from '../data/mock'
import { useBookings } from '../data/bookingsStore'
import { useReports } from '../data/reportsStore'
import { PageEditControls, usePageEditMode } from './PageEditControls'

type ReportsTab = 'overview' | 'staff' | 'commission'

const tabs: { id: ReportsTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'staff', label: 'By staff' },
  { id: 'commission', label: 'Commission' },
]

type RangeKey = 'today' | 'week' | 'all'

function formatMoney(amount: number) {
  return `RM ${amount.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function downloadCsv(filename: string, rows: string[][]) {
  const body = rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell)
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(','),
    )
    .join('\n')
  const blob = new Blob([body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

type ReportsProps = {
  vertical: VerticalLabels
}

export function Reports({ vertical }: ReportsProps) {
  const { staff, getAllRecords, transactions, events } = useBookings()
  const { getRate, setRate } = useReports()
  const [tab, setTab] = useState<ReportsTab>('overview')
  const [range, setRange] = useState<RangeKey>('week')
  const { editing: pageEditing, savedFlash, startEdit, save, cancel } = usePageEditMode()

  const bookings = useMemo(() => getAllRecords(), [getAllRecords, events])

  const datesInView = useMemo(() => {
    const all = [...new Set(bookings.map((b) => b.date))].sort()
    if (range === 'all') return all
    if (range === 'today') return [calendarToday]
    return all
  }, [bookings, range])

  const scopedBookings = useMemo(
    () => bookings.filter((b) => datesInView.includes(b.date)),
    [bookings, datesInView],
  )

  const scopedTx = useMemo(() => {
    // Transactions are “today” snapshot in prototype - use all for money view
    return transactions.filter((t) => t.status === 'completed' || t.status === 'pending')
  }, [transactions])

  const kpis = useMemo(() => {
    const completed = scopedBookings.filter((b) => b.status === 'completed')
    const noShows = scopedBookings.filter((b) => b.status === 'no-show').length
    const cancelled = scopedBookings.filter((b) => b.status === 'cancelled').length
    const revenue = completed.reduce((s, b) => s + (b.amount ?? 0), 0)
    const avgTicket = completed.length ? revenue / completed.length : 0
    const gross = scopedTx.reduce((s, t) => s + t.gross, 0)
    const fees = scopedTx.reduce((s, t) => s + t.fee, 0)
    const net = scopedTx.reduce((s, t) => s + t.net, 0)
    const byMethod = {
      cash: scopedTx.filter((t) => t.method === 'cash').reduce((s, t) => s + t.gross, 0),
      duitnow: scopedTx
        .filter((t) => t.method === 'duitnow')
        .reduce((s, t) => s + t.gross, 0),
      hitpay: scopedTx
        .filter((t) => t.method === 'hitpay')
        .reduce((s, t) => s + t.gross, 0),
    }
    return {
      bookings: scopedBookings.length,
      completed: completed.length,
      noShows,
      cancelled,
      revenue,
      avgTicket,
      gross,
      fees,
      net,
      byMethod,
    }
  }, [scopedBookings, scopedTx])

  const staffRows = useMemo(() => {
    return staff.map((member) => {
      const theirs = scopedBookings.filter((b) => b.staffName === member.name)
      const completed = theirs.filter((b) => b.status === 'completed')
      const revenue = completed.reduce((s, b) => s + (b.amount ?? 0), 0)
      const noShows = theirs.filter((b) => b.status === 'no-show').length
      const rate = getRate(member.id)
      const commission = (revenue * rate) / 100
      return {
        id: member.id,
        name: member.name,
        bookings: theirs.length,
        completed: completed.length,
        noShows,
        revenue,
        rate,
        commission,
        share: kpis.revenue > 0 ? (revenue / kpis.revenue) * 100 : 0,
      }
    })
  }, [staff, scopedBookings, getRate, kpis.revenue])

  const rangeLabel =
    range === 'today' ? 'Today' : range === 'week' ? 'This week' : 'All dates'

  function exportCommissionCsv() {
    const rows: string[][] = [
      [
        'Staff',
        'Completed jobs',
        'Revenue (RM)',
        'Rate %',
        'Commission (RM)',
        'Period',
      ],
      ...staffRows.map((r) => [
        r.name,
        String(r.completed),
        r.revenue.toFixed(2),
        r.rate.toFixed(1),
        r.commission.toFixed(2),
        rangeLabel,
      ]),
      [
        'TOTAL',
        String(staffRows.reduce((s, r) => s + r.completed, 0)),
        staffRows.reduce((s, r) => s + r.revenue, 0).toFixed(2),
        '',
        staffRows.reduce((s, r) => s + r.commission, 0).toFixed(2),
        rangeLabel,
      ],
    ]
    downloadCsv(`miki-commission-${range}.csv`, rows)
  }

  return (
    <div className="h-full w-full rounded-xl border border-fog px-4 py-4 sm:px-6 sm:py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-ui text-sky">Money</p>
          <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
            Reports
          </h1>
          <p className="mt-1 text-sm text-ash">
            Ops KPIs & commission · not accounting / GL
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['today', 'Today'],
              ['week', 'Week'],
              ['all', 'All'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRange(id)}
              className={[
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                range === id
                  ? 'bg-carbon text-paper-white'
                  : 'bg-mist text-graphite hover:bg-fog',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
          <PageEditControls
            editing={pageEditing}
            savedFlash={savedFlash}
            onEdit={startEdit}
            onSave={save}
            onCancel={cancel}
          />
        </div>
      </header>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-fog pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              'rounded-t-lg px-3 py-2 text-sm transition-colors',
              tab === t.id
                ? 'bg-mist font-medium text-carbon'
                : 'text-graphite hover:bg-linen hover:text-carbon',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Booking revenue', value: formatMoney(kpis.revenue) },
              { label: 'Completed jobs', value: String(kpis.completed) },
              { label: 'Avg ticket', value: formatMoney(kpis.avgTicket) },
              { label: 'No-shows', value: String(kpis.noShows) },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-fog bg-paper-white px-4 py-3"
              >
                <p className="text-xs text-ash">{c.label}</p>
                <p className="font-display tabular-nums mt-1 text-xl font-medium text-carbon">
                  {c.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-fog p-4">
              <h2 className="font-display text-sm font-medium text-carbon">
                Payment snapshot
              </h2>
              <p className="mt-0.5 text-xs text-ash">
                From Payments ledger (prototype day)
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ash">Gross</dt>
                  <dd className="tabular-nums font-medium text-carbon">
                    {formatMoney(kpis.gross)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ash">Fees</dt>
                  <dd className="tabular-nums text-graphite">
                    {formatMoney(kpis.fees)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-fog pt-2">
                  <dt className="text-ash">Net</dt>
                  <dd className="tabular-nums font-medium text-carbon">
                    {formatMoney(kpis.net)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-fog pt-4">
                {(
                  [
                    ['Cash', kpis.byMethod.cash],
                    ['DuitNow', kpis.byMethod.duitnow],
                    ['HitPay', kpis.byMethod.hitpay],
                  ] as const
                ).map(([label, v]) => (
                  <div key={label} className="rounded-lg bg-linen px-2 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-ash">
                      {label}
                    </p>
                    <p className="tabular-nums mt-0.5 text-xs font-medium text-carbon">
                      {formatMoney(v)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-fog p-4">
              <h2 className="font-display text-sm font-medium text-carbon">
                Booking mix
              </h2>
              <p className="mt-0.5 text-xs text-ash">{rangeLabel}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ash">All bookings</dt>
                  <dd className="font-medium text-carbon">{kpis.bookings}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ash">Completed</dt>
                  <dd className="text-graphite">{kpis.completed}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ash">No-shows</dt>
                  <dd className="text-graphite">{kpis.noShows}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ash">Cancelled</dt>
                  <dd className="text-graphite">{kpis.cancelled}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div className="overflow-x-auto rounded-xl border border-fog">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-fog bg-linen/60 text-xs uppercase tracking-wide text-ash">
              <tr>
                <th className="px-4 py-3 font-medium">
                  {vertical.staffSingular}
                </th>
                <th className="px-4 py-3 font-medium">Jobs</th>
                <th className="px-4 py-3 font-medium">Completed</th>
                <th className="px-4 py-3 font-medium">No-shows</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
                <th className="px-4 py-3 font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {staffRows.map((r) => (
                <tr key={r.id} className="border-t border-fog">
                  <td className="px-4 py-3 font-medium text-carbon">{r.name}</td>
                  <td className="px-4 py-3 text-graphite">{r.bookings}</td>
                  <td className="px-4 py-3 text-graphite">{r.completed}</td>
                  <td className="px-4 py-3 text-graphite">{r.noShows}</td>
                  <td className="tabular-nums px-4 py-3 text-carbon">
                    {formatMoney(r.revenue)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-linen">
                        <div
                          className="h-full rounded-full bg-lavender"
                          style={{ width: `${Math.min(100, r.share)}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-xs text-ash">
                        {r.share.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'commission' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ash">
              Statement for {rangeLabel.toLowerCase()} · rates editable · CSV export
            </p>
            <button
              type="button"
              className="btn-primary px-4 py-2"
              onClick={exportCommissionCsv}
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-fog">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-fog bg-linen/60 text-xs uppercase tracking-wide text-ash">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    {vertical.staffSingular}
                  </th>
                  <th className="px-4 py-3 font-medium">Completed</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                  <th className="px-4 py-3 font-medium">Rate %</th>
                  <th className="px-4 py-3 font-medium">Commission</th>
                </tr>
              </thead>
              <tbody>
                {staffRows.map((r) => (
                  <tr key={r.id} className="border-t border-fog">
                    <td className="px-4 py-3 font-medium text-carbon">{r.name}</td>
                    <td className="px-4 py-3 text-graphite">{r.completed}</td>
                    <td className="tabular-nums px-4 py-3 text-graphite">
                      {formatMoney(r.revenue)}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={r.rate}
                        disabled={!pageEditing}
                        onChange={(e) =>
                          setRate(r.id, Number(e.target.value) || 0)
                        }
                        className="w-20 rounded-lg border border-fog bg-paper-white px-2 py-1.5 text-sm tabular-nums text-carbon focus:border-lavender focus:outline-none disabled:bg-linen disabled:opacity-70"
                      />
                    </td>
                    <td className="tabular-nums px-4 py-3 font-medium text-carbon">
                      {formatMoney(r.commission)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-fog bg-linen/40">
                  <td className="px-4 py-3 font-medium text-carbon" colSpan={2}>
                    Total
                  </td>
                  <td className="tabular-nums px-4 py-3 font-medium text-carbon">
                    {formatMoney(
                      staffRows.reduce((s, r) => s + r.revenue, 0),
                    )}
                  </td>
                  <td className="px-4 py-3" />
                  <td className="tabular-nums px-4 py-3 font-medium text-carbon">
                    {formatMoney(
                      staffRows.reduce((s, r) => s + r.commission, 0),
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
