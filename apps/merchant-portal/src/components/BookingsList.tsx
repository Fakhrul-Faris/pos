'use client'

import { useMemo, useState } from 'react'
import type { BookingRecord, VerticalLabels } from '../data/mock'
import {
  bookingStaffOptions,
  calendarToday,
  calendarWeekStart,
} from '../data/mock'
import { useBookings } from '../data/bookingsStore'
import { BookingsFilter, type DateFilter, type StatusFilter } from './BookingsFilter'
import { StatusBadge } from './StatusBadge'

type BookingsListProps = {
  vertical: VerticalLabels
  onSelectBooking: (booking: BookingRecord) => void
  onNewBooking?: () => void
}

function dateFilteredBookings(
  allBookings: BookingRecord[],
  dateFilter: DateFilter,
) {
  if (dateFilter === 'today') {
    return allBookings.filter((b) => b.date === calendarToday)
  }
  if (dateFilter === 'week') {
    return allBookings.filter((b) => b.date >= calendarWeekStart && b.date <= weekEnd)
  }
  return allBookings
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function formatDateLabel(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  if (date === calendarToday) return 'Today'
  return new Intl.DateTimeFormat('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d)
}

function formatAmount(amount: number) {
  return `RM ${amount.toLocaleString('en-MY')}`
}

function weekEndDate() {
  const [y, m, d] = calendarWeekStart.split('-').map(Number)
  const end = new Date(y, m - 1, d + 6)
  return [
    end.getFullYear(),
    String(end.getMonth() + 1).padStart(2, '0'),
    String(end.getDate()).padStart(2, '0'),
  ].join('-')
}

const weekEnd = weekEndDate()

export function BookingsList({ vertical, onSelectBooking, onNewBooking }: BookingsListProps) {
  const { events, getAllRecords } = useBookings()
  const allBookings = useMemo(() => getAllRecords(), [getAllRecords, events])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [staffFilter, setStaffFilter] = useState<string>('All')
  const [dateFilter, setDateFilter] = useState<DateFilter>('week')

  const filtered = useMemo(() => {
    return allBookings.filter((booking) => {
      if (dateFilter === 'today' && booking.date !== calendarToday) return false
      if (
        dateFilter === 'week' &&
        (booking.date < calendarWeekStart || booking.date > weekEnd)
      ) {
        return false
      }
      if (statusFilter !== 'all' && booking.status !== statusFilter) return false
      if (staffFilter !== 'All' && booking.staffName !== staffFilter) return false
      return true
    })
  }, [allBookings, dateFilter, statusFilter, staffFilter])

  const statusCounts = useMemo(() => {
    const base = dateFilteredBookings(allBookings, dateFilter)
    const counts: Record<string, number> = { all: base.length }
    for (const b of base) {
      counts[b.status] = (counts[b.status] ?? 0) + 1
    }
    return counts
  }, [allBookings, dateFilter])

  const staffCounts = useMemo(() => {
    const base = dateFilteredBookings(allBookings, dateFilter)
    const counts: Record<string, number> = { All: base.length }
    for (const b of base) {
      counts[b.staffName] = (counts[b.staffName] ?? 0) + 1
    }
    return counts
  }, [allBookings, dateFilter])

  return (
    <div className="mx-auto h-full max-w-[1200px] rounded-xl border border-fog px-6 py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-ui text-sky">Bookings</p>
          <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
            All bookings
          </h1>
          <p className="mt-1 text-sm text-ash">
            {filtered.length} shown · {vertical.staffSingular} assigned per slot
          </p>
        </div>
        <button type="button" onClick={onNewBooking} className="btn-primary px-4 py-2">
          New booking
        </button>
      </header>

      <BookingsFilter
        vertical={vertical}
        dateFilter={dateFilter}
        statusFilter={statusFilter}
        staffFilter={staffFilter}
        onApply={({ date, status, staff }) => {
          setDateFilter(date)
          setStatusFilter(status)
          setStaffFilter(staff)
        }}
        statusCounts={statusCounts}
        staffCounts={staffCounts}
        staffOptions={bookingStaffOptions}
      />

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-fog bg-paper-white">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-ash">No bookings match these filters</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-fog bg-linen/50 text-xs text-ash">
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Time</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 font-medium">Service</th>
                  <th className="px-4 py-2.5 font-medium">{vertical.staffSingular}</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => (
                  <tr
                    key={booking.id}
                    onClick={() => onSelectBooking(booking)}
                    className="cursor-pointer border-b border-fog last:border-0 hover:bg-linen"
                  >
                    <td className="px-4 py-3 text-graphite">{formatDateLabel(booking.date)}</td>
                    <td className="tabular-nums px-4 py-3 font-medium text-carbon">
                      {formatTime(booking.startMinutes)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-carbon">{booking.customer}</span>
                      <span className="mt-0.5 block font-mono text-[11px] text-ash">
                        {booking.ref}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-graphite">{booking.services}</td>
                    <td className="px-4 py-3 text-graphite">{booking.staffName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="tabular-nums px-4 py-3 text-right font-medium text-carbon">
                      {formatAmount(booking.amount)}
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
