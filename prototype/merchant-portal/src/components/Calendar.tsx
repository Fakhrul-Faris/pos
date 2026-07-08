import { useEffect, useMemo, useState } from 'react'
import type { BookingRecord, VerticalLabels } from '../data/mock'
import {
  calendarStaff,
  calendarToday,
  calendarWeekStart,
} from '../data/mock'
import { useBookings } from '../data/bookingsStore'
import { IconChevronLeft, IconChevronRight } from './icons'
import { CalendarDayView, type CalendarViewMode } from './CalendarDayView'

type CalendarProps = {
  vertical: VerticalLabels
  onSelectBooking: (booking: BookingRecord) => void
  onNewBooking?: (date: string) => void
  onDateChange?: (date: string) => void
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function getWeekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6)
  const startFmt = new Intl.DateTimeFormat('en-MY', {
    day: 'numeric',
    month: 'short',
  })
  const endFmt = new Intl.DateTimeFormat('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${startFmt.format(weekStart)} – ${endFmt.format(weekEnd)}`
}

function formatSelectedDay(date: Date) {
  return new Intl.DateTimeFormat('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function Calendar({ vertical, onSelectBooking, onNewBooking, onDateChange }: CalendarProps) {
  const { events: calendarEvents } = useBookings()
  const prototypeWeekStart = parseDateKey(calendarWeekStart)
  const prototypeToday = parseDateKey(calendarToday)

  const [weekStart, setWeekStart] = useState(prototypeWeekStart)
  const [selectedDate, setSelectedDate] = useState(prototypeToday)
  const [view, setView] = useState<CalendarViewMode>('barber')

  useEffect(() => {
    onDateChange?.(calendarToday)
  }, [onDateChange])

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])
  const selectedKey = toDateKey(selectedDate)
  const isToday = selectedKey === calendarToday

  const dayEvents = calendarEvents.filter((e) => e.date === selectedKey)
  const bookingCount = dayEvents.filter((e) => e.type === 'booking').length
  const walkInBlocks = dayEvents.filter((e) => e.type === 'walk-in-block').length

  function selectDay(day: Date) {
    setSelectedDate(day)
    onDateChange?.(toDateKey(day))
    if (toDateKey(day) !== calendarToday && view === 'floor') {
      setView('barber')
    }
  }

  function shiftWeek(delta: number) {
    const nextStart = addDays(weekStart, delta * 7)
    setWeekStart(nextStart)
    selectDay(addDays(selectedDate, delta * 7))
  }

  return (
    <div className="mx-auto max-w-[1200px] rounded-xl border border-fog px-6 py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-ui text-sky">Calendar</p>
          <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
            {formatSelectedDay(selectedDate)}
          </h1>
          <p className="mt-1 text-sm text-ash">
            {bookingCount} bookings
            {walkInBlocks > 0 ? ' · walk-in block active' : ''}
            {' · '}shop open 9am–8pm
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost px-4 py-2">
            Block walk-in slots
          </button>
          <button
            type="button"
            onClick={() => onNewBooking?.(selectedKey)}
            className="btn-primary px-4 py-2"
          >
            New booking
          </button>
        </div>
      </header>

      {/* Week navigator */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            aria-label="Previous week"
            className="flex h-8 w-8 items-center justify-center rounded-md text-ash transition-colors hover:bg-mist hover:text-carbon"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-display min-w-[140px] text-center text-sm font-medium tracking-ui text-carbon">
            {formatWeekRange(weekStart)}
          </span>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            aria-label="Next week"
            className="flex h-8 w-8 items-center justify-center rounded-md text-ash transition-colors hover:bg-mist hover:text-carbon"
          >
            <IconChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setWeekStart(prototypeWeekStart)
            selectDay(prototypeToday)
          }}
          className="text-xs font-medium text-lavender hover:text-iris"
        >
          Today
        </button>
      </div>

      {/* Week day strip */}
      <div className="mb-4 grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const key = toDateKey(day)
          const isSelected = key === selectedKey
          const isToday = key === calendarToday
          const dayBookings = calendarEvents.filter(
            (e) => e.date === key && e.type === 'booking',
          ).length

          return (
            <button
              key={key}
              type="button"
              onClick={() => selectDay(day)}
              className={[
                'rounded-xl border px-2 py-2 text-center transition-colors',
                isSelected
                  ? 'border-lavender bg-mist'
                  : 'border-fog bg-paper-white hover:bg-linen',
              ].join(' ')}
            >
              <p className="text-[11px] font-medium uppercase text-ash">
                {new Intl.DateTimeFormat('en-MY', { weekday: 'short' }).format(day)}
              </p>
              <p
                className={[
                  'font-display tabular-nums mt-0.5 text-lg font-medium tracking-ui',
                  isToday ? 'text-lavender' : 'text-carbon',
                ].join(' ')}
              >
                {day.getDate()}
              </p>
              <p className="mt-0.5 text-[11px] text-ash">
                {dayBookings > 0 ? `${dayBookings} apt` : '—'}
              </p>
            </button>
          )
        })}
      </div>

      {/* View toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'barber' as const, label: 'By barber' },
            { id: 'agenda' as const, label: 'Agenda' },
            ...(isToday ? [{ id: 'floor' as const, label: 'Floor' }] : []),
          ] as { id: CalendarViewMode; label: string }[]
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setView(option.id)}
            className={[
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              view === option.id
                ? 'bg-carbon text-paper-white'
                : 'bg-mist text-graphite hover:bg-fog',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </div>

      <CalendarDayView
        staff={calendarStaff}
        events={dayEvents}
        staffLabel={vertical.staffSingular}
        view={view}
        isToday={isToday}
        onSelectBooking={onSelectBooking}
      />
    </div>
  )
}
