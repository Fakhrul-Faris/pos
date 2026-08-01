'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { BarberSwitcher } from '@/components/BarberSwitcher'
import { fade } from '@/lib/motion'
import { barberLaneWash } from '@/lib/barberTheme'
import { MANAGER_ACTING_ID, actingLabel, type BookingStatus, type FloorBooking } from '../data/mock'
import { useStore } from '../data/store'

function minutesToLabel(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
}

function statusCardClass(status: BookingStatus) {
  if (status === 'no-show' || status === 'cancelled') {
    return 'border-fog bg-mist/50 opacity-50'
  }
  return 'border-fog bg-paper-white'
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
      className={`rounded-md border px-3 py-2.5 ${statusCardClass(b.status)} ${
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
              <span className="text-[10px] font-medium uppercase tracking-ui text-carbon">
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
    busy: { label: 'Busy', className: 'bg-mist text-carbon' },
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
    <p className="rounded-md border border-dashed border-fog bg-linen/40 px-2 py-4 text-center text-xs text-ash">
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
    checkIn,
  } = useStore()
  const [staffFilter, setStaffFilter] = useState<string>(() =>
    actingStaffId === MANAGER_ACTING_ID ? 'all' : actingStaffId,
  )
  const [viewModeInternal, setViewModeInternal] = useState<'lanes' | 'timeline'>('lanes')
  const [dragOverStaffId, setDragOverStaffId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [lateExpanded, setLateExpanded] = useState(false)
  const viewMode = viewModeProp ?? viewModeInternal
  const setViewMode = (mode: 'lanes' | 'timeline') => {
    onViewModeChange?.(mode)
    if (viewModeProp === undefined) setViewModeInternal(mode)
  }
  const promptedLateRef = useRef<Set<string>>(new Set())
  const columnsRef = useRef<HTMLDivElement>(null)
  const [lanePage, setLanePage] = useState(0)

  // Barber switcher drives the board filter; Manager sees All.
  useEffect(() => {
    if (actingStaffId === MANAGER_ACTING_ID) {
      setStaffFilter('all')
      return
    }
    if (staff.some((s) => s.id === actingStaffId)) {
      setStaffFilter(actingStaffId)
    }
  }, [actingStaffId, staff])

  const filteredLanes = useMemo(
    () => (staffFilter === 'all' ? lanes : lanes.filter((l) => l.staff.id === staffFilter)),
    [lanes, staffFilter],
  )

  const LANES_PER_PAGE = 3

  const lanePages = useMemo(() => {
    const pages: typeof filteredLanes[] = []
    for (let i = 0; i < filteredLanes.length; i += LANES_PER_PAGE) {
      pages.push(filteredLanes.slice(i, i + LANES_PER_PAGE))
    }
    return pages.length > 0 ? pages : [[]]
  }, [filteredLanes])

  useEffect(() => {
    setLanePage((p) => Math.min(p, Math.max(0, lanePages.length - 1)))
  }, [lanePages.length])

  const lateBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status === 'confirmed' &&
          isLateBooking(b) &&
          (staffFilter === 'all' || b.staffId === staffFilter),
      ),
    [bookings, isLateBooking, staffFilter],
  )

  useEffect(() => {
    if (lateBookings.length === 0) setLateExpanded(false)
  }, [lateBookings.length])

  useEffect(() => {
    const next = lateBookings.find((b) => !promptedLateRef.current.has(b.id))
    if (next) {
      promptedLateRef.current.add(next.id)
      onPromptNoShow?.(next.id)
    }
  }, [lateBookings, onPromptNoShow])

  useEffect(() => {
    if (viewMode !== 'lanes') return
    const actingIndex = filteredLanes.findIndex((l) => l.staff.id === actingStaffId)
    if (actingIndex < 0) return
    const page = Math.floor(actingIndex / LANES_PER_PAGE)
    setLanePage(page)
    const el = columnsRef.current
    const slide = el?.children[page] as HTMLElement | undefined
    slide?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
  }, [actingStaffId, filteredLanes, viewMode])

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
    const items: Array<FloorBooking & { assignedName: string; assignedHeaderClass: string }> = []
    const seen = new Set<string>()
    const sourceLanes =
      staffFilter === 'all' ? lanes : lanes.filter((l) => l.staff.id === staffFilter)
    for (const lane of sourceLanes) {
      for (const b of lane.waiting) {
        if (seen.has(b.id)) continue
        seen.add(b.id)
        items.push({
          ...b,
          assignedName: lane.staff.name,
          assignedHeaderClass: lane.staff.headerClass,
        })
      }
    }
    return items.sort((a, b) => (a.queueNumber ?? 0) - (b.queueNumber ?? 0))
  }, [lanes, staffFilter])

  const nowServingNumbers = useMemo(() => {
    return bookings
      .filter(
        (b) =>
          b.status === 'in-service' &&
          b.queueNumber != null &&
          (staffFilter === 'all' || b.staffId === staffFilter),
      )
      .map((b) => b.queueNumber!)
      .sort((a, b) => a - b)
  }, [bookings, staffFilter])

  /** e.g. [24] → "#24"; [24,25,26] → "#24–26"; [24,26] → "#24 · #26" */
  const nowServingLabel = useMemo(() => {
    const nums = nowServingNumbers
    if (nums.length === 0) return null
    if (nums.length === 1) return `#${nums[0]}`
    const consecutive = nums.every((n, i) => i === 0 || n === nums[i - 1]! + 1)
    if (consecutive) return `#${nums[0]}–${nums[nums.length - 1]}`
    return nums.map((n) => `#${n}`).join(' · ')
  }, [nowServingNumbers])

  const totals = useMemo(() => {
    const source = filteredLanes
    const now = source.reduce((n, l) => n + l.now.length, 0)
    const waiting = source.reduce((n, l) => n + l.waiting.length, 0)
    const upcoming = source.reduce((n, l) => n + l.upcoming.length, 0)
    // One chair per barber lane in the current filter.
    const seatCapacity = source.length
    const seatsOccupied = Math.min(now, seatCapacity)
    const seatsAvailable = Math.max(0, seatCapacity - seatsOccupied)
    return { now, waiting, upcoming, seatCapacity, seatsAvailable }
  }, [filteredLanes])

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

  const chipClass = (active: boolean, markClass?: string) =>
    `shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? markClass ?? 'bg-carbon text-paper-white'
        : 'bg-mist text-graphite hover:bg-fog'
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

  const lanePageDots =
    lanePages.length > 1 ? (
      <div className="flex shrink-0 items-center gap-1.5 pl-2" role="tablist" aria-label="Barber pages">
        {lanePages.map((_, i) => (
          <button
            key={`dot-${i}`}
            type="button"
            aria-label={`Barbers page ${i + 1}`}
            aria-current={i === lanePage}
            onClick={() => {
              const el = columnsRef.current
              const slide = el?.children[i] as HTMLElement | undefined
              slide?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
              setLanePage(i)
            }}
            className={`h-1.5 rounded-full transition-all ${
              i === lanePage ? 'w-4 bg-carbon' : 'w-1.5 bg-fog hover:bg-ash'
            }`}
          />
        ))}
      </div>
    ) : null

  const staffFilterRow = (
    <div className="flex shrink-0 items-center gap-3">
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button type="button" onClick={() => setStaffFilter('all')} className={chipClass(staffFilter === 'all')}>
          All
        </button>
        {staff.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStaffFilter(s.id)}
            className={chipClass(staffFilter === s.id, s.headerClass)}
          >
            {s.name}
          </button>
        ))}
      </div>
      {viewMode === 'timeline' ? (
        <button
          type="button"
          onClick={() => setViewMode('lanes')}
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-barber hover:bg-mist"
        >
          Chairs
        </button>
      ) : (
        lanePageDots
      )}
    </div>
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-3">
      <BarberSwitcher
        onActingChange={(name) => onToast?.({ kind: 'info', title: `Now acting as ${name}` })}
        onShiftStarted={(name) =>
          onToast?.({ kind: 'success', title: `Shift started · ${name}` })
        }
      />

      {/* Status row */}
      <div className="flex shrink-0 flex-wrap items-stretch gap-3">
        <div
          className={`flex min-w-[9.5rem] flex-1 items-center rounded-lg border border-fog bg-paper-white px-4 py-3 sm:flex-none ${
            nowServingNumbers.length > 1 ? 'min-w-[12rem] sm:min-w-[14rem]' : ''
          }`}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-ui text-ash">Now serving</p>
            <p
              className={`font-display font-semibold tabular-nums leading-none tracking-ui text-carbon ${
                nowServingNumbers.length > 2 ? 'text-2xl' : 'text-3xl'
              }`}
            >
              {nowServingLabel ?? '—'}
            </p>
            {nowServingNumbers.length > 1 ? (
              <p className="mt-1 text-[10px] font-medium text-ash">
                {nowServingNumbers.length} in chair
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-[2] items-stretch gap-0 overflow-x-auto rounded-lg border border-fog bg-paper-white px-1 py-1">
          <div className="flex min-w-[4.5rem] flex-1 flex-col items-center justify-center px-2 py-2">
            {totals.seatCapacity === 0 ? (
              <>
                <p className="font-display text-2xl font-semibold leading-none text-ash">—</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-ui text-ash">Seats</p>
              </>
            ) : totals.seatsAvailable === 0 ? (
              <>
                <p className="font-display text-2xl font-semibold leading-none text-ash">Full</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-ui text-ash">
                  {totals.seatCapacity}/{totals.seatCapacity} seats
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-2xl font-semibold tabular-nums leading-none text-carbon">
                  {totals.seatsAvailable}/{totals.seatCapacity}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-ui text-ash">
                  Seat{totals.seatsAvailable === 1 ? '' : 's'} available
                </p>
              </>
            )}
          </div>
          {(
            [
              { key: 'wait', label: 'Waiting', value: totals.waiting, tone: 'text-amber' },
              { key: 'up', label: 'Upcoming', value: totals.upcoming, tone: 'text-sky' },
            ] as const
          ).map((stat) => (
            <div
              key={stat.key}
              className="flex min-w-[4.5rem] flex-1 flex-col items-center justify-center border-l border-fog px-2 py-2"
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
        <div className="shrink-0 overflow-hidden rounded-lg border border-fog bg-paper-white">
          {lateBookings.length > 0 && (
            <div className="border-b border-ember/20 bg-[#fff4e0]/60">
              <button
                type="button"
                onClick={() => setLateExpanded((o) => !o)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-[#fff4e0]/80"
                aria-expanded={lateExpanded}
              >
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-ember" aria-hidden />
                <p className="min-w-0 flex-1 text-sm font-medium text-carbon">
                  {lateBookings.length} late — review for no-show
                </p>
                <span className="text-xs font-medium text-ash">
                  {lateExpanded ? 'Hide' : 'Review'}
                </span>
                <svg
                  viewBox="0 0 16 16"
                  className={`h-3.5 w-3.5 shrink-0 text-ash transition-transform ${
                    lateExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  aria-hidden
                >
                  <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {lateExpanded ? (
                <ul className="space-y-2 border-t border-ember/15 px-3 py-3">
                  {lateBookings
                    .slice()
                    .sort((a, b) => a.startMinutes - b.startMinutes)
                    .map((b) => {
                      const barber = staff.find((s) => s.id === b.staffId)
                      return (
                        <li
                          key={b.id}
                          className="flex flex-wrap items-center gap-2 rounded-md border border-fog bg-paper-white px-3 py-2.5"
                        >
                          <button
                            type="button"
                            onClick={() => onSelectBooking(b.id)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate text-sm font-medium text-carbon">{b.customer}</p>
                            <p className="truncate text-xs text-ash">
                              {minutesToLabel(b.startMinutes)} · {b.services}
                              {barber ? ` · ${barber.name}` : ''}
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              checkIn(b.id)
                              onToast?.({
                                kind: 'success',
                                title: 'Checked in',
                                message: b.customer,
                              })
                            }}
                            className="min-h-9 shrink-0 rounded-md bg-mist px-3 text-[11px] font-semibold text-carbon hover:bg-fog"
                          >
                            Arrived
                          </button>
                          <button
                            type="button"
                            onClick={() => onPromptNoShow?.(b.id)}
                            className="min-h-9 shrink-0 rounded-md bg-ember/10 px-3 text-[11px] font-semibold text-ember hover:bg-ember/15"
                          >
                            No-show
                          </button>
                        </li>
                      )
                    })}
                </ul>
              ) : null}
            </div>
          )}

          <div className="px-4 py-3">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-ui text-ash">Waiting queue</p>
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
                      className={`flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 ${
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
                          className="min-h-9 shrink-0 rounded-md bg-barber px-3 text-[11px] font-semibold text-barber-fg"
                        >
                          Take
                        </button>
                      ) : (
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${b.assignedHeaderClass}`}
                        >
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
      </div>

      {(viewMode === 'lanes' && (lateBookings.length > 0 || allWaiting.length > 0)) ? (
        <div className="h-10 shrink-0" aria-hidden />
      ) : (
        <div className="h-3 shrink-0" aria-hidden />
      )}

      <AnimatePresence mode="wait" initial={false}>
      {viewMode === 'timeline' ? (
        <motion.div
          key="timeline"
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
          {...boardMotion}
        >
          {staffFilterRow}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
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
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
          {...boardMotion}
        >
          {staffFilterRow}
          <div
            ref={columnsRef}
            onScroll={(e) => {
              const el = e.currentTarget
              if (el.clientWidth <= 0) return
              const next = Math.round(el.scrollLeft / el.clientWidth)
              setLanePage(Math.max(0, Math.min(next, lanePages.length - 1)))
            }}
            className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {lanePages.map((page, pageIndex) => (
              <div
                key={`page-${pageIndex}`}
                className="flex h-full w-full shrink-0 snap-start snap-always gap-3"
              >
                {page.map((lane) => {
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
                      style={{ backgroundColor: barberLaneWash(lane.staff.id) }}
                      className={`flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-lg border transition-all ${
                        isDropTarget
                          ? 'border-barber ring-2 ring-barber scale-[1.01]'
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
                        className="flex min-h-12 shrink-0 items-center justify-between gap-2 border-b border-fog px-3 py-2 text-left hover:bg-mist/50"
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
                          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-ui text-ash">
                            Now
                          </p>
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
                          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-ui text-ash">
                            Waiting
                          </p>
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
                                        className="min-h-8 shrink-0 rounded-md bg-barber px-2 text-[10px] font-medium text-barber-fg"
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
                          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-ui text-ash">
                            Upcoming
                          </p>
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
            ))}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
