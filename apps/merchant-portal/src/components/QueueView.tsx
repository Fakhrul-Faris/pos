'use client'

/**
 * Queue operate layout - removed from Merchant Portal L1 (IA).
 * Keep for Shared POS. Design snapshot:
 * `docs/design/component-refs/queue-component-design.png`
 */

import { useMemo } from 'react'
import type { BookingRecord } from '../data/mock'
import { minutesToDisplayTime } from '../data/mock'
import { useBookings, type QueueTicket } from '../data/bookingsStore'
import { StatusBadge } from './StatusBadge'

type QueueViewProps = {
  onSelectBooking: (booking: BookingRecord) => void
  onStartService: (id: string) => void
}

function QueueTicketCard({
  ticket,
  variant,
  onSelect,
  onStartService,
}: {
  ticket: QueueTicket
  variant: 'waiting' | 'chair' | 'hero'
  onSelect: () => void
  onStartService?: () => void
}) {
  const { booking, queueNumber } = ticket

  if (variant === 'hero') {
    return (
      <button
        type="button"
        onClick={onSelect}
        className="w-full rounded-2xl border border-lavender/30 bg-mist px-5 py-6 text-left transition-colors hover:bg-linen"
      >
        <p className="text-xs font-medium uppercase tracking-ui text-sky">Serving</p>
        <p className="font-display tabular-nums mt-2 text-4xl font-medium tracking-ui text-carbon">
          #{queueNumber}
        </p>
        <p className="mt-3 text-base font-medium text-carbon">{booking.customer}</p>
        <p className="mt-1 text-sm text-graphite">
          {booking.services} · {booking.staffName}
        </p>
        <div className="mt-3">
          <StatusBadge status={booking.status} />
        </div>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-fog bg-paper-white px-4 py-3">
      <span className="font-display tabular-nums flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mist text-sm font-medium text-carbon">
        {queueNumber}
      </span>
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium text-carbon">{booking.customer}</p>
        <p className="truncate text-xs text-ash">
          {booking.services} · {minutesToDisplayTime(booking.startMinutes)} · {booking.staffName}
        </p>
      </button>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={booking.status} />
        {variant === 'waiting' && onStartService && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onStartService()
            }}
            className="rounded-lg bg-carbon px-2.5 py-1.5 text-xs font-medium text-paper-white transition-colors hover:bg-carbon/90"
          >
            Start
          </button>
        )}
      </div>
    </div>
  )
}

function EmptyColumn({ label }: { label: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-fog bg-linen/50">
      <p className="text-sm text-ash">{label}</p>
    </div>
  )
}

export function QueueView({ onSelectBooking, onStartService }: QueueViewProps) {
  const { getQueueState, staff } = useBookings()
  const queue = getQueueState()

  const inChairByStaff = useMemo(() => {
    const map = new Map<string, QueueTicket[]>()
    for (const t of queue.inChair) {
      const list = map.get(t.booking.staffName) ?? []
      list.push(t)
      map.set(t.booking.staffName, list)
    }
    return map
  }, [queue.inChair])

  const waitingByStaff = useMemo(() => {
    const map = new Map<string, QueueTicket[]>()
    for (const t of queue.waiting) {
      const list = map.get(t.booking.staffName) ?? []
      list.push(t)
      map.set(t.booking.staffName, list)
    }
    return map
  }, [queue.waiting])

  return (
    <div className="h-full w-full rounded-xl border border-fog px-4 py-4 sm:px-6 sm:py-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-ui text-sky">Counter</p>
          <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
            Queue view
          </h1>
          <p className="mt-1 text-sm text-ash">
            {queue.waitingCount} waiting · {queue.inChair.length} in chair
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-ash">Avg wait</p>
            <p className="tabular-nums font-display text-lg font-medium text-carbon">
              {queue.avgWaitMinutes > 0 ? `${queue.avgWaitMinutes}m` : '-'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ash">Longest</p>
            <p className="tabular-nums font-display text-lg font-medium text-carbon">
              {queue.longestWaitMinutes > 0 ? `${queue.longestWaitMinutes}m` : '-'}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {staff.map((member) => {
          const serving = inChairByStaff.get(member.name) ?? []
          const waiting = waitingByStaff.get(member.name) ?? []
          return (
            <section
              key={member.id}
              className="overflow-hidden rounded-2xl border border-fog bg-paper-white"
            >
              <div className="flex items-center justify-between border-b border-fog px-4 py-3">
                <div className="min-w-0">
                  <p className="font-display text-sm font-medium tracking-ui text-carbon">
                    {member.name}
                  </p>
                  <p className="text-xs text-ash">Serving {serving.length} · Waiting {waiting.length}</p>
                </div>
                <span className={`h-2.5 w-2.5 rounded-full ${member.headerClass}`} aria-hidden />
              </div>

              <div className="space-y-3 p-3">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-ui text-ash">
                    Now serving
                  </p>
                  {serving.length === 0 ? (
                    <EmptyColumn label="-" />
                  ) : (
                    <div className="space-y-2">
                      {serving.map((t) => (
                        <QueueTicketCard
                          key={t.booking.id}
                          ticket={t}
                          variant="chair"
                          onSelect={() => onSelectBooking(t.booking)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-ui text-ash">
                    Next up
                  </p>
                  {waiting.length === 0 ? (
                    <EmptyColumn label="Queue clear" />
                  ) : (
                    <QueueTicketCard
                      ticket={waiting[0]}
                      variant="waiting"
                      onSelect={() => onSelectBooking(waiting[0].booking)}
                      onStartService={() => onStartService(waiting[0].booking.id)}
                    />
                  )}
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
