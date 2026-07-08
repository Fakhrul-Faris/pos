'use client'

import type { BookingRecord, BookingStatus, CalendarEvent, CalendarStaff } from '../data/mock'
import { calendarEventToBookingRecord } from '../data/mock'
import { BookingCard } from './BookingCard'
import { StatusBadge } from './StatusBadge'

export type CalendarViewMode = 'barber' | 'agenda' | 'floor'

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
}

function formatTimeRange(startMinutes: number, durationMinutes: number) {
  const end = startMinutes + durationMinutes
  return `${formatTime(startMinutes)} – ${formatTime(end)}`
}

function sortByTime(events: CalendarEvent[]) {
  return [...events].sort((a, b) => a.startMinutes - b.startMinutes)
}

type CalendarDayViewProps = {
  staff: CalendarStaff[]
  events: CalendarEvent[]
  staffLabel: string
  view: CalendarViewMode
  isToday: boolean
  onSelectBooking?: (booking: BookingRecord) => void
}

function WalkInBanner({ event }: { event: CalendarEvent }) {
  return (
    <div className="rounded-xl border border-dashed border-amber/50 bg-[#fff8eb] px-3 py-2">
      <p className="text-xs font-medium text-amber">{event.label}</p>
      <p className="text-[11px] text-ash">
        {formatTimeRange(event.startMinutes, event.durationMinutes)} · No online bookings
      </p>
    </div>
  )
}

function BarberStackView({
  staff,
  events,
  staffLabel,
  onSelectBooking,
}: {
  staff: CalendarStaff[]
  events: CalendarEvent[]
  staffLabel: string
  onSelectBooking?: (booking: BookingRecord) => void
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {staff.map((member) => {
        const staffEvents = sortByTime(events.filter((e) => e.staffId === member.id))
        const walkIn = staffEvents.find((e) => e.type === 'walk-in-block')
        const bookings = staffEvents.filter((e) => e.type === 'booking')

        return (
          <div
            key={member.id}
            className="flex min-h-[120px] flex-col rounded-2xl border border-fog bg-paper-white"
          >
            <div className="border-b border-fog px-4 py-3">
              <p className="font-display text-sm font-medium tracking-ui text-carbon">
                {member.name}
              </p>
              <p className="text-xs text-ash">
                {bookings.length} today · {staffLabel}
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-3">
              {walkIn && <WalkInBanner event={walkIn} />}
              {bookings.length === 0 && !walkIn ? (
                <p className="py-6 text-center text-xs text-ash">No bookings</p>
              ) : (
                bookings.map((event) => (
                  <BookingCard
                    key={event.id}
                    event={event}
                    headerClass={member.headerClass}
                    onViewDetail={
                      onSelectBooking
                        ? () => {
                            const record = calendarEventToBookingRecord(event, member.name)
                            if (record) onSelectBooking(record)
                          }
                        : undefined
                    }
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AgendaListView({
  staff,
  events,
  onSelectBooking,
}: {
  staff: CalendarStaff[]
  events: CalendarEvent[]
  onSelectBooking?: (booking: BookingRecord) => void
}) {
  const staffById = Object.fromEntries(staff.map((s) => [s.id, s.name]))
  const walkIns = sortByTime(events.filter((e) => e.type === 'walk-in-block'))
  const bookings = sortByTime(events.filter((e) => e.type === 'booking'))

  return (
    <div className="overflow-hidden rounded-2xl border border-fog bg-paper-white">
      {walkIns.length > 0 && (
        <div className="space-y-2 border-b border-fog bg-[#fffdf8] px-4 py-3">
          {walkIns.map((event) => (
            <WalkInBanner key={event.id} event={event} />
          ))}
        </div>
      )}
      {bookings.length === 0 ? (
        <p className="py-10 text-center text-sm text-ash">No bookings this day</p>
      ) : (
        <ul className="divide-y divide-fog">
          {bookings.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => {
                  const record = calendarEventToBookingRecord(
                    event,
                    staffById[event.staffId] ?? '',
                  )
                  if (record) onSelectBooking?.(record)
                }}
                className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-linen"
              >
                <span className="tabular-nums w-14 shrink-0 text-xs font-medium text-carbon">
                  {formatTime(event.startMinutes)}
                </span>
                <span className="w-16 shrink-0 truncate text-xs text-graphite">
                  {staffById[event.staffId]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-carbon">
                    {event.customer}
                  </span>
                  <span className="block truncate text-xs text-graphite">{event.services}</span>
                </span>
                {event.status && (
                  <span className="shrink-0">
                    <StatusBadge status={event.status} />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const floorColumns: {
  id: string
  label: string
  statuses: BookingStatus[]
}[] = [
  { id: 'upcoming', label: 'Upcoming', statuses: ['confirmed'] },
  { id: 'arrived', label: 'Arrived', statuses: ['checked-in'] },
  { id: 'in-chair', label: 'In chair', statuses: ['in-service'] },
  { id: 'done', label: 'Done', statuses: ['completed', 'no-show', 'cancelled'] },
]

function FloorKanbanView({
  staff,
  events,
  onSelectBooking,
}: {
  staff: CalendarStaff[]
  events: CalendarEvent[]
  onSelectBooking?: (booking: BookingRecord) => void
}) {
  const staffById = Object.fromEntries(staff.map((s) => [s.id, s]))
  const bookings = events.filter((e) => e.type === 'booking')

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {floorColumns.map((column) => {
        const columnEvents = sortByTime(
          bookings.filter((e) => e.status && column.statuses.includes(e.status)),
        )

        return (
          <div
            key={column.id}
            className="flex min-h-[160px] flex-col rounded-2xl border border-fog bg-paper-white"
          >
            <div className="flex items-center justify-between border-b border-fog px-3 py-2.5">
              <p className="text-xs font-medium text-carbon">{column.label}</p>
              <span className="tabular-nums rounded-full bg-mist px-2 py-0.5 text-[11px] text-ash">
                {columnEvents.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2.5 p-2">
              {columnEvents.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-ash">—</p>
              ) : (
                columnEvents.map((event) => {
                  const member = staffById[event.staffId]
                  return (
                    <BookingCard
                      key={event.id}
                      event={event}
                      headerClass={member?.headerClass ?? 'bg-mist text-carbon'}
                      variant="compact"
                      barberName={member?.name}
                      onViewDetail={
                        onSelectBooking && member
                          ? () => {
                              const record = calendarEventToBookingRecord(event, member.name)
                              if (record) onSelectBooking(record)
                            }
                          : undefined
                      }
                    />
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CalendarDayView({
  staff,
  events,
  staffLabel,
  view,
  isToday,
  onSelectBooking,
}: CalendarDayViewProps) {
  if (view === 'agenda') {
    return <AgendaListView staff={staff} events={events} onSelectBooking={onSelectBooking} />
  }

  if (view === 'floor' && isToday) {
    return (
      <FloorKanbanView staff={staff} events={events} onSelectBooking={onSelectBooking} />
    )
  }

  return (
    <BarberStackView
      staff={staff}
      events={events}
      staffLabel={staffLabel}
      onSelectBooking={onSelectBooking}
    />
  )
}
