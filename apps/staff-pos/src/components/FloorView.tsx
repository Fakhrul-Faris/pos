'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { fade } from '@/lib/motion'
import { actingLabel, type BookingStatus, type FloorBooking } from '../data/mock'
import { useStore } from '../data/store'

function minutesToLabel(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
}

function statusCardClass(status: BookingStatus, late?: boolean) {
  if (late) return 'border-fog border-l-[3px] border-l-ember bg-paper-white'
  const accents: Record<BookingStatus, string> = {
    confirmed: 'border-fog border-l-[3px] border-l-sky bg-paper-white',
    'checked-in': 'border-fog border-l-[3px] border-l-amber bg-paper-white',
    'in-service': 'border-fog border-l-[3px] border-l-lavender bg-paper-white',
    completed: 'border-fog border-l-[3px] border-l-mint bg-paper-white',
    'no-show': 'border-fog border-l-[3px] border-l-ash/40 bg-mist/50 opacity-60',
    cancelled: 'border-fog border-l-[3px] border-l-ash/30 bg-mist/50 opacity-50',
  }
  return accents[status]
}

function ColumnBookingCard({
  b,
  late,
  selected,
  onPress,
  trailing,
  draggable,
  onDragStart,
  onDragEnd,
}: {
  b: FloorBooking
  late?: boolean
  selected?: boolean
  onPress?: () => void
  trailing?: React.ReactNode
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: () => void
}) {
  return (
    <div
      role={onPress ? 'button' : undefined}
      tabIndex={onPress ? 0 : undefined}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
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
      className={`rounded-xl border px-3 py-2.5 ${statusCardClass(b.status, late)} ${
        selected ? 'ring-2 ring-barber' : ''
      } ${onPress ? 'min-h-12 cursor-pointer transition-shadow hover:shadow-sm' : ''} ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <div className="flex items-start gap-2.5">
        {b.queueNumber ? (
          <span className="font-display shrink-0 text-xl font-semibold tabular-nums tracking-ui text-carbon">
            #{b.queueNumber}
          </span>
        ) : (
          <span className="font-display shrink-0 text-sm font-medium text-ash">—</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-carbon">{b.customer}</p>
          <p className="truncate text-xs text-ash">
            {b.services} · {minutesToLabel(b.startMinutes)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {b.isParty ? (
              <span className="text-[10px] font-medium uppercase tracking-ui text-lavender">
                Party {b.partySize}
              </span>
            ) : null}
            {late ? <span className="text-[10px] font-medium text-ember">Late</span> : null}
            {b.source === 'walk-in' ? <span className="text-[10px] text-sky">Walk-in</span> : null}
          </div>
        </div>
        {trailing}
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
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function EmptySlot({ label }: { label: string }) {
  return (
    <p className="rounded-lg border border-dashed border-fog bg-linen/40 px-2 py-4 text-center text-xs text-ash">
      {label}
    </p>
  )
}

export function FloorView({
  selectedBookingId,
  onSelectBooking,
  onPromptNoShow,
  onToast,
  viewMode: viewModeProp,
  onViewModeChange,
}: {
  selectedBookingId?: string | null
  onSelectBooking: (id: string) => void
  onPromptNoShow?: (id: string) => void
  onToast?: (t: { kind: 'success' | 'info' | 'error'; title: string; message?: string }) => void
  viewMode?: 'lanes' | 'timeline'
  onViewModeChange?: (mode: 'lanes' | 'timeline') => void
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
  const [viewModeInternal, setViewModeInternal] = useState<'lanes' | 'timeline'>('lanes')
  const [dragOverStaffId, setDragOverStaffId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const viewMode = viewModeProp ?? viewModeInternal
  const setViewMode = (mode: 'lanes' | 'timeline') => {
    onViewModeChange?.(mode)
    if (viewModeProp === undefined) setViewModeInternal(mode)
  }
  const promptedLateRef = useRef<Set<string>>(new Set())
  const columnsRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (viewMode !== 'lanes' || staffFilter !== 'all') return
    const el = columnsRef.current
    if (!el) return
    const actingIndex = filteredLanes.findIndex((l) => l.staff.id === actingStaffId)
    if (actingIndex < 0) return
    const column = el.children[actingIndex] as HTMLElement | undefined
    column?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [actingStaffId, filteredLanes, staffFilter, viewMode])

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

  const nowServing = useMemo(() => {
    const inChair = bookings
      .filter((b) => b.status === 'in-service' && b.queueNumber != null)
      .sort((a, b) => (a.queueNumber ?? 0) - (b.queueNumber ?? 0))
    if (inChair[0]?.queueNumber != null) return inChair[0].queueNumber
    if (allWaiting[0]?.queueNumber != null) return allWaiting[0].queueNumber
    const upcoming = bookings
      .filter((b) => b.status === 'confirmed' && b.queueNumber != null)
      .sort((a, b) => (a.queueNumber ?? 0) - (b.queueNumber ?? 0))
    return upcoming[0]?.queueNumber ?? null
  }, [bookings, allWaiting])

  const totals = useMemo(() => {
    const now = lanes.reduce((n, l) => n + l.now.length, 0)
    const waiting = lanes.reduce((n, l) => n + l.waiting.length, 0)
    const upcoming = lanes.reduce((n, l) => n + l.upcoming.length, 0)
    return { now, waiting, upcoming }
  }, [lanes])

  function canTakeBooking(booking: FloorBooking) {
    if (booking.staffId === actingStaffId) return false
    const option = getReassignOptions(booking.id).find((o) => o.staffId === actingStaffId)
    return option?.available ?? false
  }

  function canDragBooking(booking: FloorBooking) {
    if (booking.isParty) return false
    return booking.status === 'confirmed' || booking.status === 'checked-in'
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

  function handleDropOnLane(staffId: string, bookingId: string) {
    const booking = bookings.find((b) => b.id === bookingId)
    if (!booking || booking.staffId === staffId) return
    const result = reassignBarber(bookingId, staffId)
    const name = staff.find((s) => s.id === staffId)?.name ?? 'barber'
    if (result.ok) {
      onToast?.({
        kind: 'success',
        title: `Moved to ${name}`,
        message: booking.customer,
      })
    } else {
      onToast?.({
        kind: 'error',
        title: 'Cannot move',
        message: result.reason ?? 'Unavailable',
      })
    }
  }

  const chipClass = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      active ? 'bg-barber text-barber-fg' : 'bg-mist text-graphite hover:bg-fog'
    }`

  const reduce = useReducedMotion()
  const boardMotion = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.01 },
      }
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
        transition: fade.micro,
      }

  const staffFilterRow = (
    <div className="flex shrink-0 gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button type="button" onClick={() => setStaffFilter('all')} className={chipClass(staffFilter === 'all')}>
        All
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
      {viewMode === 'timeline' && (
        <button
          type="button"
          onClick={() => setViewMode('lanes')}
          className="ml-auto shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-barber hover:bg-mist"
        >
          Chairs
        </button>
      )}
    </div>
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Status row */}
      <div className="flex shrink-0 flex-wrap items-stretch gap-3">
        <div className="flex min-w-[9.5rem] flex-1 items-center rounded-2xl border border-barber bg-barber-muted px-4 py-3 sm:flex-none">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-ui text-barber">Now serving</p>
            <p className="font-display text-3xl font-semibold tabular-nums leading-none tracking-ui text-carbon">
              {nowServing != null ? `#${nowServing}` : '—'}
            </p>
          </div>
        </div>

        <div className="flex flex-[2] items-stretch gap-0 overflow-x-auto rounded-2xl border border-fog bg-paper-white px-1 py-1">
          {(
            [
              { key: 'now', label: 'In chair', value: totals.now, tone: 'text-lavender' },
              { key: 'wait', label: 'Waiting', value: totals.waiting, tone: 'text-amber' },
              { key: 'up', label: 'Upcoming', value: totals.upcoming, tone: 'text-sky' },
            ] as const
          ).map((stat, i) => (
            <div
              key={stat.key}
              className={`flex min-w-[4.5rem] flex-1 flex-col items-center justify-center rounded-xl px-2 py-2 ${
                i > 0 ? 'border-l border-fog' : ''
              }`}
            >
              <p className={`font-display text-2xl font-semibold tabular-nums leading-none ${stat.tone}`}>
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-ui text-ash">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Queue alerts: late + waiting */}
      {viewMode === 'lanes' && (lateBookings.length > 0 || allWaiting.length > 0) && (
        <div className="shrink-0 overflow-hidden rounded-2xl border border-fog bg-paper-white shadow-sm">
          {lateBookings.length > 0 && (
            <div className="flex items-center gap-2 border-b border-ember/20 bg-[#fff4e0]/60 px-4 py-2.5">
              <span className="flex h-2 w-2 shrink-0 rounded-full bg-ember" aria-hidden />
              <p className="text-sm font-medium text-carbon">
                {lateBookings.length} late — review for no-show
              </p>
            </div>
          )}

          <div className="px-4 py-3">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-ui text-barber">Waiting queue</p>
              <p className="text-xs text-ash">{allWaiting.length} in queue</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {allWaiting.length === 0 ? (
                <p className="py-1 text-sm text-ash">Queue clear — take walk-ins</p>
              ) : (
                allWaiting.map((b) => {
                  const takeable = canTakeBooking(b)
                  return (
                    <div
                      key={b.id}
                      draggable={canDragBooking(b)}
                      onDragStart={(e) => {
                        if (!canDragBooking(b)) return
                        e.dataTransfer.setData('text/booking-id', b.id)
                        e.dataTransfer.effectAllowed = 'move'
                        setDraggingId(b.id)
                      }}
                      onDragEnd={() => {
                        setDraggingId(null)
                        setDragOverStaffId(null)
                      }}
                      className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 ${
                        b.id === selectedBookingId
                          ? 'border-barber bg-barber-muted'
                          : 'border-fog bg-linen/50'
                      } ${draggingId === b.id ? 'opacity-50' : ''} ${
                        canDragBooking(b) ? 'cursor-grab active:cursor-grabbing' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectBooking(b.id)}
                        className="flex min-h-11 items-center gap-2.5 text-left"
                      >
                        <span className="font-display text-2xl font-semibold tabular-nums leading-none text-carbon">
                          #{b.queueNumber}
                        </span>
                        <span className="max-w-[7rem] truncate text-sm text-graphite">{b.customer}</span>
                      </button>
                      {takeable ? (
                        <button
                          type="button"
                          onClick={() => handleTake(b.id, b.customer)}
                          className="min-h-9 shrink-0 rounded-full bg-barber px-3 text-[11px] font-semibold text-barber-fg"
                        >
                          Take
                        </button>
                      ) : (
                        <span className="shrink-0 rounded-full bg-mist px-2.5 py-1 text-[10px] font-medium text-ash">
                          {b.assignedName}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
      {viewMode === 'timeline' ? (
        <motion.div
          key="timeline"
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-fog bg-paper-white"
          {...boardMotion}
        >
          <div className="shrink-0 border-b border-fog px-4 py-3">{staffFilterRow}</div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {timelineHours.map((hour) => (
              <div key={hour.minutes} className="flex gap-3">
                <div className="w-12 shrink-0 pt-2 text-right text-xs font-medium text-ash">{hour.label}</div>
                <div className="min-h-10 flex-1 space-y-2 border-l border-fog pl-3">
                  {hour.items.length === 0 ? (
                    <p className="py-2 text-xs text-ash">—</p>
                  ) : (
                    hour.items.map((b) => (
                      <ColumnBookingCard
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
        </motion.div>
      ) : (
        <motion.div
          key="lanes"
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-fog bg-paper-white"
          {...boardMotion}
        >
          <div className="shrink-0 border-b border-fog px-4 py-3">{staffFilterRow}</div>
          <div
            ref={columnsRef}
            className="flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden p-4 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-fog"
          >
          {filteredLanes.map((lane) => {
            const isDropTarget = dragOverStaffId === lane.staff.id
            return (
              <section
                key={lane.staff.id}
                onDragOver={(e) => {
                  if (!draggingId) return
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  setDragOverStaffId(lane.staff.id)
                }}
                onDragLeave={() => {
                  setDragOverStaffId((id) => (id === lane.staff.id ? null : id))
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const id = e.dataTransfer.getData('text/booking-id')
                  setDragOverStaffId(null)
                  setDraggingId(null)
                  if (id) handleDropOnLane(lane.staff.id, id)
                }}
                className={`flex h-full w-[min(17.5rem,78vw)] shrink-0 flex-col overflow-hidden rounded-2xl border bg-paper-white transition-all ${
                  isDropTarget
                    ? 'border-barber ring-2 ring-barber scale-[1.01]'
                    : lane.staff.id === actingStaffId
                      ? 'border-barber ring-2 ring-barber'
                      : 'border-fog'
                }`}
              >
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
                  className={`flex min-h-12 shrink-0 items-center justify-between gap-2 border-b border-fog px-3 py-2 text-left ${
                    lane.staff.id === actingStaffId ? 'bg-barber-muted' : 'hover:bg-mist/50'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${lane.staff.headerClass}`}
                    >
                      {lane.staff.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-carbon">
                        {lane.staff.name}
                        {lane.staff.id === actingStaffId && (
                          <span className="ml-1 text-[10px] font-medium uppercase text-barber">You</span>
                        )}
                      </p>
                      {isDropTarget && (
                        <p className="text-[10px] font-medium text-barber">Drop to assign</p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={lane.staffStatus} />
                </button>

                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-2.5">
                  <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-ui text-ash">Now</p>
                    {lane.now.length === 0 ? (
                      <EmptySlot label="Empty chair" />
                    ) : (
                      <div className="space-y-2">
                        {lane.now.map((b) => (
                          <ColumnBookingCard
                            key={b.id}
                            b={b}
                            selected={b.id === selectedBookingId}
                            onPress={() => onSelectBooking(b.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-ui text-ash">Waiting</p>
                    {lane.waiting.length === 0 ? (
                      <EmptySlot label={isDropTarget ? 'Drop here' : 'Clear'} />
                    ) : (
                      <div className="space-y-2">
                        {lane.waiting.map((b) => (
                          <ColumnBookingCard
                            key={b.id}
                            b={b}
                            selected={b.id === selectedBookingId}
                            onPress={() => onSelectBooking(b.id)}
                            draggable={canDragBooking(b)}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/booking-id', b.id)
                              e.dataTransfer.effectAllowed = 'move'
                              setDraggingId(b.id)
                            }}
                            onDragEnd={() => {
                              setDraggingId(null)
                              setDragOverStaffId(null)
                            }}
                            trailing={
                              canTakeBooking(b) ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleTake(b.id, b.customer)
                                  }}
                                  className="min-h-8 shrink-0 rounded-full bg-barber px-2 text-[10px] font-medium text-barber-fg"
                                >
                                  Take
                                </button>
                              ) : undefined
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-ui text-ash">Upcoming</p>
                    {lane.upcoming.length === 0 ? (
                      <EmptySlot label="—" />
                    ) : (
                      <div className="space-y-2">
                        {lane.upcoming.slice(0, 4).map((b) => (
                          <ColumnBookingCard
                            key={b.id}
                            b={b}
                            late={isLateBooking(b)}
                            selected={b.id === selectedBookingId}
                            onPress={() => onSelectBooking(b.id)}
                            draggable={canDragBooking(b)}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/booking-id', b.id)
                              e.dataTransfer.effectAllowed = 'move'
                              setDraggingId(b.id)
                            }}
                            onDragEnd={() => {
                              setDraggingId(null)
                              setDragOverStaffId(null)
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )
          })}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
