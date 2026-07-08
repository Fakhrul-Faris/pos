'use client'

import type { BookingRecord, TodayBooking } from '../data/mock'
import { todayBookingToRecord } from '../data/mock'
import { StatusBadge } from './StatusBadge'

type BookingsTableProps = {
  bookings: TodayBooking[]
  staffHeader: string
  onSelectBooking?: (booking: BookingRecord) => void
  onViewAll?: () => void
}

function formatAmount(amount: number) {
  return `RM ${amount.toLocaleString('en-MY')}`
}

export function BookingsTable({
  bookings,
  staffHeader,
  onSelectBooking,
  onViewAll,
}: BookingsTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-fog bg-paper-white">
      <div className="flex items-center justify-between border-b border-fog px-5 py-4">
        <h2 className="font-display text-sm font-medium tracking-ui text-carbon">
          Today&apos;s bookings
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-medium text-lavender hover:text-iris"
        >
          View all
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-fog text-xs text-ash">
              <th className="px-5 py-2.5 font-medium">Time</th>
              <th className="px-5 py-2.5 font-medium">Customer</th>
              <th className="px-5 py-2.5 font-medium">Services</th>
              <th className="px-5 py-2.5 font-medium">{staffHeader}</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
              <th className="px-5 py-2.5 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                onClick={() => onSelectBooking?.(todayBookingToRecord(booking))}
                className={[
                  'border-b border-fog last:border-0',
                  onSelectBooking ? 'cursor-pointer hover:bg-linen' : 'hover:bg-linen',
                ].join(' ')}
              >
                <td className="tabular-nums px-5 py-3 font-medium text-carbon">
                  {booking.time}
                </td>
                <td className="px-5 py-3 text-carbon">{booking.customer}</td>
                <td className="px-5 py-3 text-graphite">{booking.services}</td>
                <td className="px-5 py-3 text-graphite">{booking.staff}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="tabular-nums px-5 py-3 text-right font-medium text-carbon">
                  {formatAmount(booking.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
