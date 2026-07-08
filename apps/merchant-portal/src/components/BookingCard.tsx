'use client'

import type { CalendarEvent } from '../data/mock'
import { StatusBadge } from './StatusBadge'

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
}

function formatBookingDate(date: string) {
  const [, month, day] = date.split('-')
  return `${day}/${month}`
}

function bookingRef(id: string) {
  return `BK${id.slice(1).toUpperCase()}`
}

function formatAmount(amount: number) {
  return `RM ${amount.toLocaleString('en-MY')}`
}

type BookingCardProps = {
  event: CalendarEvent
  headerClass: string
  variant?: 'default' | 'compact'
  barberName?: string
  onViewDetail?: () => void
}

export function BookingCard({
  event,
  headerClass,
  variant = 'default',
  barberName,
  onViewDetail,
}: BookingCardProps) {
  if (event.type !== 'booking' || !event.customer) return null

  const amount = event.amount ?? 45
  const isCompact = variant === 'compact'

  return (
    <article
      onClick={isCompact ? onViewDetail : undefined}
      onKeyDown={
        isCompact && onViewDetail
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onViewDetail()
              }
            }
          : undefined
      }
      role={isCompact && onViewDetail ? 'button' : undefined}
      tabIndex={isCompact && onViewDetail ? 0 : undefined}
      className={[
        'group overflow-hidden rounded-2xl border border-fog bg-paper-white',
        'shadow-[rgba(0,0,0,0.06)_0px_1px_3px_0px,rgba(0,0,0,0.04)_0px_4px_12px_0px]',
        'transition-all hover:border-fog hover:shadow-[rgba(0,0,0,0.08)_0px_2px_6px_0px,rgba(0,0,0,0.06)_0px_8px_20px_0px]',
        isCompact && onViewDetail ? 'cursor-pointer' : '',
      ].join(' ')}
    >
      {/* Colored header */}
      <div
        className={[
          'flex items-center justify-between px-3 py-2',
          headerClass,
        ].join(' ')}
      >
        <span className="tabular-nums text-xs font-medium tracking-ui">
          {formatTime(event.startMinutes)}
        </span>
        <span className="text-[11px] font-medium opacity-80">
          {bookingRef(event.id)} · {formatBookingDate(event.date)}
        </span>
      </div>

      {/* Body */}
      <div className={isCompact ? 'px-3 py-2.5' : 'px-3 pt-3 pb-1'}>
        {barberName && (
          <p className="text-[11px] text-ash">{barberName}</p>
        )}
        <p className="truncate text-xs text-ash">{event.services}</p>
        <div className="mt-1 flex items-start justify-between gap-2">
          <p className="font-display truncate text-base font-medium tracking-ui text-carbon">
            {event.customer}
          </p>
          {event.status && (
            <span className="shrink-0">
              <StatusBadge status={event.status} />
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      {!isCompact && (
        <div className="flex items-center justify-between px-3 pb-3 pt-2">
          <span className="font-display tabular-nums text-lg font-medium tracking-ui text-carbon">
            {formatAmount(amount)}
          </span>
          <button
            type="button"
            onClick={onViewDetail}
            className="rounded-full bg-carbon px-3.5 py-1.5 text-xs font-medium text-paper-white transition-colors hover:bg-carbon/90"
          >
            View detail
          </button>
        </div>
      )}
    </article>
  )
}
