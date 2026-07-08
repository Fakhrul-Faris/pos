'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { actingLabel, type BookingStatus, type FloorBooking } from '../data/mock'
import { useStore } from '../data/store'

function minutesToLabel(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
}

function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={`rounded-full bg-mist px-2.5 py-1 text-[11px] font-medium text-ash ${className ?? ''}`}
    >
      {label}
    </span>
  )
}

function statusCardClass(status: BookingStatus, late?: boolean, source?: FloorBooking['source']) {
  const sourceTint =
    source === 'walk-in' ? 'bg-sky/[0.04]' : source === 'online' ? 'bg-linen' : 'bg-paper-white'
  if (late) return `${sourceTint} border-fog border-l-4 border-l-ember`
  const accents: Record<BookingStatus, string> = {
    confirmed: 'border-fog border-l-4 border-l-sky',
    'checked-in': 'border-fog border-l-4 border-l-amber',
    'in-service': 'border-fog border-l-4 border-l-lavender',
    completed: 'border-fog border-l-4 border-l-mint',
    'no-show': 'border-fog border-l-4 border-l-ash/40 opacity-60',
    cancelled: 'border-fog border-l-4 border-l-ash/30 opacity-50',
  }
  return `${sourceTint} ${accents[status]}`
}

function statusLabel(status: BookingStatus): { label: string; className: string } | null {
  const map: Partial<Record<BookingStatus, { label: string; className: string }>> = {
    confirmed: { label: 'Upcoming', className: 'bg-sky/10 text-sky' },
    'checked-in': { label: 'Arrived', className: 'bg-[#fff4e0] text-amber' },
    'in-service': { label: 'In chair', className: 'bg-lavender/15 text-lavender' },
    completed: { label: 'Done', className: 'bg-mint-wash text-mint' },
    'no-show': { label: 'No-show', className: 'bg-mist text-ash' },
    cancelled: { label: 'Cancelled', className: 'bg-mist text-ash' },
  }
  return map[status] ?? null
}

function BookingCard({
  b,
  actions,
  late,
  selected,
  onPress,
}: {
  b: FloorBooking
  actions?: React.ReactNode
  late?: boolean
  selected?: boolean
  onPress?: () => void
}) {
  const status = statusLabel(b.status)

  return (
    <div
      role={onPress ? 'button' : undefined}
      tabIndex={onPress ? 0 : undefined}
      onClick={onPress}
      onKeyDown={
        onPress
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onPress()
              }
            }
          : undefined
      }
      className={`rounded-xl border px-4 py-3 ${statusCardClass(b.status, late, b.source)} ${
        selected ? 'ring-2 ring-lavender/40' : ''
      } ${onPress ? 'min-h-12 cursor-pointer transition-colors hover:border-lavender/40' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-carbon">{b.customer}</p>
          <p className="truncate text-xs text-ash">
            {b.services} · {minutesToLabel(b.startMinutes)} · RM {b.amount}
          </p>
          {late && <p className="mt-0.5 text-[11px] font-medium text-ember">15+ min late</p>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {status && <Badge label={status.label} className={status.className} />}
          {b.queueNumber ? <Badge label={`#${b.queueNumber}`} /> : null}
          {b.isParty ? <Badge label={`Party ${b.partySize}`} className="bg-mist text-lavender" /> : null}
          {b.source === 'walk-in' ? (
            <Badge label="Walk-in" className="bg-sky/10 text-sky" />
          ) : (
            <Badge label="Online" className="bg-linen text-graphite" />
          )}
          {actions}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: 'available' | 'busy' | 'break' | 'off' }) {
  const map = {
    available: { label: 'Available', className: 'bg-mint-wash text-mint' },
    busy: { label: 'Busy', className: 'bg-mist text-lavender' },
    break: { label: 'Break', className: 'bg-[#fff4e0] text-amber' },
    off: { label: 'Off', className: 'bg-mist text-ash/70' },
  } as const
  const cfg = map[status]
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

export function FloorView({
  selectedBookingId,
  onSelectBooking,
  onPromptNoShow,
  onToast,
}: {
  selectedBookingId?: string | null
  onSelectBooking: (id: string) => void
  onPromptNoShow?: (id: string) => void
  onToast?: (t: { kind: 'success' | 'info' | 'error'; title: string; message?: string }) => void
}) {
  const {
    lanes,
    bookings,
    staff,
    isLateBooking,
    actingStaffId,
    setActingStaffId,
    reassignBarber,
    getReassignOptions,
  } = useStore()
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'lanes' | 'timeline'>('lanes')
  const promptedLateRef = useRef<Set<string>>(new Set())

  const filteredLanes = useMemo(
    () => (staffFilter === 'all' ? lanes : lanes.filter((l) => l.staff.id === staffFilter)),
    [lanes, staffFilter],
  )

  const lateBookings = useMemo(
    () => bookings.filter((b) => b.status === 'confirmed' && isLateBooking(b)),
    [bookings, isLateBooking],
  )

  useEffect(() => {
    const next = lateBookings.find((b) => !promptedLateRef.current.has(b.id))
    if (next) {
      promptedLateRef.current.add(next.id)
      onPromptNoShow?.(next.id)
    }
  }, [lateBookings, onPromptNoShow])

  const timelineHours = useMemo(() => {
    const hours: Array<{ label: string; minutes: number; items: FloorBooking[] }> = []
    for (let m = 9 * 60; m <= 20 * 60; m += 60) {
      const items = bookings
        .filter(
          (b) =>
            b.status !== 'cancelled' &&
            b.status !== 'no-show' &&
            b.status !== 'completed' &&
            b.startMinutes >= m &&
            b.startMinutes < m + 60 &&
            (staffFilter === 'all' || b.staffId === staffFilter),
        )
        .sort((a, b) => a.startMinutes - b.startMinutes)
      hours.push({ label: minutesToLabel(m), minutes: m, items })
    }
    return hours
  }, [bookings, staffFilter])

  const allWaiting = useMemo(() => {
    const items: Array<FloorBooking & { assignedName: string }> = []
    const seen = new Set<string>()
    for (const lane of lanes) {
      for (const b of lane.waiting) {
        if (seen.has(b.id)) continue
        seen.add(b.id)
        items.push({ ...b, assignedName: lane.staff.name })
      }
    }
    return items.sort((a, b) => (a.queueNumber ?? 0) - (b.queueNumber ?? 0))
  }, [lanes])

  function canTakeBooking(booking: FloorBooking) {
    if (booking.staffId === actingStaffId) return false
    const option = getReassignOptions(booking.id).find((o) => o.staffId === actingStaffId)
    return option?.available ?? false
  }

  function handleTake(bookingId: string, customer: string) {
    const result = reassignBarber(bookingId, actingStaffId)
    if (result.ok) {
      onToast?.({
        kind: 'success',
        title: 'Assigned to you',
        message: `${customer} is now on your queue.`,
      })
    } else {
      onToast?.({
        kind: 'error',
        title: 'Could not assign',
        message: result.reason ?? 'Try another barber or time.',
      })
    }
  }

  function waitingActions(b: FloorBooking, assignedName: string) {
    const isYours = b.staffId === actingStaffId
    return (
      <>
        <Badge label={isYours ? 'Yours' : assignedName} className={isYours ? 'bg-mint-wash text-mint' : undefined} />
        {canTakeBooking(b) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleTake(b.id, b.customer)
            }}
            className="min-h-10 rounded-full bg-lavender px-3 py-1.5 text-[11px] font-medium text-paper-white transition-colors hover:bg-iris"
          >
            Take
          </button>
        )}
      </>
    )
  }

  const partyBookings = useMemo(() => {
    const seen = new Set<string>()
    const parties: FloorBooking[] = []
    for (const lane of lanes) {
      for (const p of lane.parties) {
        if (!seen.has(p.id)) {
          seen.add(p.id)
          parties.push(p)
        }
      }
    }
    return parties
  }, [lanes])

  const totals = useMemo(() => {
    const now = lanes.reduce((n, l) => n + l.now.length, 0)
    const waiting = lanes.reduce((n, l) => n + l.waiting.length, 0)
    const upcoming = lanes.reduce((n, l) => n + l.upcoming.length, 0)
    const done = lanes.reduce((n, l) => n + l.done.length, 0)
    return { now, waiting, upcoming, done }
  }, [lanes])

  const chipClass = (active: boolean) =>
    `min-h-12 rounded-full px-4 text-sm font-medium transition-colors ${
      active ? 'bg-carbon text-paper-white' : 'bg-mist text-graphite hover:bg-fog'
    }`

  return (
    <div className="mx-auto w-full max-w-none lg:max-w-none">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-ui text-ash">Today board</p>
          <p className="mt-1 text-sm text-graphite">
            {totals.waiting} waiting · {totals.now} in chair · {totals.upcoming} upcoming · {totals.done}{' '}
            done
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setViewMode('lanes')} className={chipClass(viewMode === 'lanes')}>
            Lanes
          </button>
          <button type="button" onClick={() => setViewMode('timeline')} className={chipClass(viewMode === 'timeline')}>
            Timeline
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setStaffFilter('all')} className={chipClass(staffFilter === 'all')}>
          All barbers
        </button>
        {staff.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStaffFilter(s.id)}
            className={chipClass(staffFilter === s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      {lateBookings.length > 0 && (
        <div className="mb-3 rounded-xl border border-ember/30 bg-[#fff4e0]/60 px-4 py-3 text-sm text-carbon">
          {lateBookings.length} upcoming booking{lateBookings.length === 1 ? '' : 's'} 15+ min late — review for
          no-show.
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="mb-4 space-y-2">
          {timelineHours.map((hour) => (
            <div key={hour.minutes} className="flex gap-3">
              <div className="w-14 shrink-0 pt-3 text-right text-xs font-medium text-ash">{hour.label}</div>
              <div className="min-h-12 flex-1 space-y-2 border-l border-fog pl-3">
                {hour.items.length === 0 ? (
                  <p className="py-3 text-xs text-ash">—</p>
                ) : (
                  hour.items.map((b) => (
                    <BookingCard
                      key={b.id}
                      b={b}
                      late={isLateBooking(b)}
                      selected={b.id === selectedBookingId}
                      onPress={() => onSelectBooking(b.id)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'lanes' && (
        <>
          {allWaiting.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-ui text-lavender">Waiting queue</p>
              <p className="mb-2 text-xs text-ash">
                Shop-wide — any barber can take a guest onto their chair
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                {allWaiting.map((b) => (
                  <BookingCard
                    key={b.id}
                    b={b}
                    selected={b.id === selectedBookingId}
                    onPress={() => onSelectBooking(b.id)}
                    actions={
                      <>
                        {b.queueNumber ? <Badge label={`#${b.queueNumber}`} /> : null}
                        {waitingActions(b, b.assignedName)}
                      </>
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {partyBookings.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-ui text-lavender">Parties</p>
              <div className="grid gap-2 md:grid-cols-2">
                {partyBookings.map((p) => (
                  <button key={p.id} type="button" onClick={() => onSelectBooking(p.id)} className="text-left">
                    <BookingCard b={p} late={isLateBooking(p)} selected={p.id === selectedBookingId} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredLanes.map((lane) => (
              <section
                key={lane.staff.id}
                className={`flex min-h-[360px] flex-col overflow-hidden rounded-2xl border bg-paper-white transition-shadow duration-200 ${
                  lane.staff.id === actingStaffId
                    ? 'border-lavender ring-2 ring-lavender/25 shadow-panel'
                    : 'border-fog'
                }`}
              >
                <div className="border-b border-fog px-3 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (lane.staff.id === actingStaffId) return
                      setActingStaffId(lane.staff.id)
                      onToast?.({
                        kind: 'info',
                        title: `Now acting as ${actingLabel(lane.staff.id, staff)}`,
                      })
                    }}
                    className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-1 py-1 text-left transition-colors hover:bg-mist/60 ${
                      lane.staff.id === actingStaffId ? 'cursor-default' : 'cursor-pointer'
                    }`}
                    aria-label={
                      lane.staff.id === actingStaffId
                        ? `${lane.staff.name}, currently acting`
                        : `Act as ${lane.staff.name}`
                    }
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${lane.staff.headerClass}`}
                      >
                        {lane.staff.name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm font-medium tracking-ui text-carbon">
                          {lane.staff.name}
                          {lane.staff.id === actingStaffId && (
                            <span className="ml-1.5 text-[10px] font-medium uppercase tracking-ui text-lavender">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-ash">
                          {lane.waiting.length} waiting · {lane.now.length} in chair · {lane.upcoming.length}{' '}
                          upcoming
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={lane.staffStatus} />
                  </button>
                </div>

                <div className="flex-1 space-y-3 p-3">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-ui text-ash">Now</p>
                    {lane.now.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-fog bg-linen/50 px-3 py-6 text-center text-sm text-ash">
                        —
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {lane.now.map((b) => (
                          <button key={b.id} type="button" onClick={() => onSelectBooking(b.id)} className="w-full text-left">
                            <BookingCard
                              b={b}
                              selected={b.id === selectedBookingId}
                              actions={<Badge label={b.queueNumber ? `#${b.queueNumber}` : 'Now'} />}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-ui text-ash">Waiting</p>
                    {lane.waiting.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-fog bg-linen/50 px-3 py-6 text-center text-sm text-ash">
                        Queue clear
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {lane.waiting.map((b) => (
                          <BookingCard
                            key={b.id}
                            b={b}
                            selected={b.id === selectedBookingId}
                            onPress={() => onSelectBooking(b.id)}
                            actions={
                              <>
                                {b.queueNumber ? <Badge label={`#${b.queueNumber}`} /> : null}
                                {waitingActions(b, lane.staff.name)}
                              </>
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-ui text-ash">Upcoming</p>
                    {lane.upcoming.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-fog bg-linen/50 px-3 py-6 text-center text-sm text-ash">
                        —
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {lane.upcoming.slice(0, 3).map((b) => (
                          <button key={b.id} type="button" onClick={() => onSelectBooking(b.id)} className="w-full text-left">
                            <BookingCard
                              b={b}
                              late={isLateBooking(b)}
                              selected={b.id === selectedBookingId}
                              actions={<Badge label={minutesToLabel(b.startMinutes)} />}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {lane.done.length > 0 && (
                    <div className="pt-1">
                      <p className="text-xs text-ash">Done today: {lane.done.length}</p>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
