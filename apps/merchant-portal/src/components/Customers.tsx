'use client'

import { useMemo, useState } from 'react'
import type { BookingRecord, VerticalLabels } from '../data/mock'
import { minutesToDisplayTime } from '../data/mock'
import { useBookings } from '../data/bookingsStore'
import { StatusBadge } from './StatusBadge'
import { IconChevronLeft } from './icons'

export type CustomerProfile = {
  id: string
  name: string
  phone: string
  visitCount: number
  totalSpend: number
  lastVisitDate: string | null
  preferredStaff: string | null
  notes?: string
  bookings: BookingRecord[]
}

type CustomersProps = {
  vertical: VerticalLabels
  onSelectBooking: (booking: BookingRecord) => void
  onNewBooking?: (defaults?: { customer: string; phone: string }) => void
}

function formatAmount(amount: number) {
  return `RM ${amount.toLocaleString('en-MY')}`
}

function formatDateLabel(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

function buildCustomers(bookings: BookingRecord[]): CustomerProfile[] {
  const map = new Map<string, CustomerProfile>()

  for (const b of bookings) {
    if (b.customer === 'Walk-in') continue
    const key = `${b.customer}|${b.phone}`
    const existing = map.get(key)
    if (!existing) {
      map.set(key, {
        id: key,
        name: b.customer,
        phone: b.phone,
        visitCount: 1,
        totalSpend: b.status === 'completed' ? b.amount : 0,
        lastVisitDate: b.date,
        preferredStaff: b.staffName,
        notes: b.notes,
        bookings: [b],
      })
      continue
    }
    existing.visitCount += 1
    if (b.status === 'completed') existing.totalSpend += b.amount
    existing.bookings.push(b)
    if (!existing.lastVisitDate || b.date > existing.lastVisitDate) {
      existing.lastVisitDate = b.date
      existing.preferredStaff = b.staffName
    }
    if (b.notes && !existing.notes) existing.notes = b.notes
  }

  return [...map.values()].sort((a, b) => {
    const da = a.lastVisitDate ?? ''
    const db = b.lastVisitDate ?? ''
    return db.localeCompare(da)
  })
}

export function Customers({ vertical, onSelectBooking, onNewBooking }: CustomersProps) {
  const { events, getAllRecords } = useBookings()
  const allBookings = useMemo(() => getAllRecords(), [getAllRecords, events])
  const customers = useMemo(() => buildCustomers(allBookings), [allBookings])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')),
    )
  }, [customers, query])

  const selected = customers.find((c) => c.id === selectedId) ?? null

  if (selected) {
    const history = [...selected.bookings].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return b.startMinutes - a.startMinutes
    })

    return (
      <div className="h-full w-full rounded-xl border border-fog px-4 py-4 sm:px-6 sm:py-6">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="mb-4 inline-flex items-center gap-1 text-sm text-graphite transition-colors hover:text-carbon"
        >
          <IconChevronLeft />
          All customers
        </button>

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-ui text-sky">Customer</p>
            <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
              {selected.name}
            </h1>
            <p className="mt-1 text-sm text-ash">{selected.phone}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              onNewBooking?.({ customer: selected.name, phone: selected.phone })
            }
            className="btn-primary px-4 py-2"
          >
            New booking
          </button>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Visits', value: String(selected.visitCount) },
            { label: 'Total spend', value: formatAmount(selected.totalSpend) },
            {
              label: 'Last visit',
              value: selected.lastVisitDate
                ? formatDateLabel(selected.lastVisitDate)
                : '-',
            },
            {
              label: `Preferred ${vertical.staffSingular.toLowerCase()}`,
              value: selected.preferredStaff ?? '-',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-fog bg-paper-white px-4 py-3"
            >
              <p className="text-xs text-ash">{stat.label}</p>
              <p className="mt-1 text-sm font-medium text-carbon">{stat.value}</p>
            </div>
          ))}
        </section>

        {selected.notes && (
          <p className="mb-6 rounded-xl border border-fog bg-linen/60 px-4 py-3 text-sm text-graphite">
            {selected.notes}
          </p>
        )}

        <h2 className="font-display mb-3 text-sm font-medium tracking-ui text-carbon">
          Visit history
        </h2>
        <div className="overflow-hidden rounded-2xl border border-fog bg-paper-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-fog bg-linen/50 text-xs text-ash">
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Time</th>
                <th className="px-4 py-2.5 font-medium">Service</th>
                <th className="px-4 py-2.5 font-medium">{vertical.staffSingular}</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {history.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => onSelectBooking(b)}
                  className="cursor-pointer border-b border-fog last:border-0 hover:bg-linen"
                >
                  <td className="px-4 py-3 text-graphite">{formatDateLabel(b.date)}</td>
                  <td className="tabular-nums px-4 py-3 font-medium text-carbon">
                    {minutesToDisplayTime(b.startMinutes)}
                  </td>
                  <td className="px-4 py-3 text-graphite">{b.services}</td>
                  <td className="px-4 py-3 text-graphite">{b.staffName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="tabular-nums px-4 py-3 text-right font-medium text-carbon">
                    {formatAmount(b.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full rounded-xl border border-fog px-4 py-4 sm:px-6 sm:py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-ui text-sky">Customers</p>
          <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
            Customer list
          </h1>
          <p className="mt-1 text-sm text-ash">
            {filtered.length} profiles · built from bookings (phone key)
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or phone"
          className="w-full max-w-xs rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon placeholder:text-ash focus:border-lavender focus:outline-none"
        />
      </header>

      <div className="overflow-hidden rounded-2xl border border-fog bg-paper-white">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-ash">No customers match</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-fog bg-linen/50 text-xs text-ash">
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Phone</th>
                  <th className="px-4 py-2.5 font-medium">Visits</th>
                  <th className="px-4 py-2.5 font-medium">Last visit</th>
                  <th className="px-4 py-2.5 font-medium">
                    Preferred {vertical.staffSingular.toLowerCase()}
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">Spend</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className="cursor-pointer border-b border-fog last:border-0 hover:bg-linen"
                  >
                    <td className="px-4 py-3 font-medium text-carbon">{c.name}</td>
                    <td className="px-4 py-3 text-graphite">{c.phone}</td>
                    <td className="tabular-nums px-4 py-3 text-graphite">{c.visitCount}</td>
                    <td className="px-4 py-3 text-graphite">
                      {c.lastVisitDate ? formatDateLabel(c.lastVisitDate) : '-'}
                    </td>
                    <td className="px-4 py-3 text-graphite">
                      {c.preferredStaff ?? '-'}
                    </td>
                    <td className="tabular-nums px-4 py-3 text-right font-medium text-carbon">
                      {formatAmount(c.totalSpend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
