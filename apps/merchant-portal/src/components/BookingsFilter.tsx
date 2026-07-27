'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { BookingStatus, VerticalLabels } from '../data/mock'
import {
  IconCalendar,
  IconCheck,
  IconChevronRight,
  IconFilter,
  IconUserCircle,
  IconX,
} from './icons'

export type DateFilter = 'today' | 'week' | 'all'
export type StatusFilter = 'all' | BookingStatus

type FilterValues = {
  date: DateFilter
  status: StatusFilter
  staff: string
}

type BookingsFilterProps = {
  vertical: VerticalLabels
  dateFilter: DateFilter
  statusFilter: StatusFilter
  staffFilter: string
  onApply: (filters: FilterValues) => void
  statusCounts: Record<string, number>
  staffCounts: Record<string, number>
  staffOptions: readonly string[]
}

type FilterCategory = 'date' | 'status' | 'staff'

const DEFAULT_FILTERS: FilterValues = {
  date: 'week',
  status: 'all',
  staff: 'All',
}

const dateOptions: { id: DateFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'all', label: 'All time' },
]

const statusOptions: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'checked-in', label: 'Checked in' },
  { id: 'in-service', label: 'In service' },
  { id: 'completed', label: 'Completed' },
  { id: 'no-show', label: 'No-show' },
]

function StatusIcon({ status }: { status: StatusFilter }) {
  const className = 'h-4 w-4 shrink-0'
  if (status === 'all') {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" className="text-ash" />
      </svg>
    )
  }
  if (status === 'confirmed') {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" className="text-ash" />
      </svg>
    )
  }
  if (status === 'checked-in') {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" className="text-lavender" />
      </svg>
    )
  }
  if (status === 'in-service') {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" className="text-amber" />
        <path d="M8 2 A6 6 0 0 1 8 14 Z" fill="currentColor" className="text-amber" />
      </svg>
    )
  }
  if (status === 'completed') {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" fill="currentColor" className="text-mint" />
        <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" className="text-ember" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ember" />
    </svg>
  )
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="rounded-md bg-mist px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-ash">
      {count}
    </span>
  )
}

function activeCount(filters: FilterValues) {
  let n = 0
  if (filters.date !== DEFAULT_FILTERS.date) n++
  if (filters.status !== DEFAULT_FILTERS.status) n++
  if (filters.staff !== DEFAULT_FILTERS.staff) n++
  return n
}

function categoryActiveCount(category: FilterCategory, filters: FilterValues) {
  if (category === 'date') return filters.date !== DEFAULT_FILTERS.date ? 1 : 0
  if (category === 'status') return filters.status !== DEFAULT_FILTERS.status ? 1 : 0
  return filters.staff !== DEFAULT_FILTERS.staff ? 1 : 0
}

export function BookingsFilter({
  vertical,
  dateFilter,
  statusFilter,
  staffFilter,
  onApply,
  statusCounts,
  staffCounts,
  staffOptions,
}: BookingsFilterProps) {
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('status')
  const [draft, setDraft] = useState<FilterValues>({
    date: dateFilter,
    status: statusFilter,
    staff: staffFilter,
  })
  const containerRef = useRef<HTMLDivElement>(null)

  const applied = { date: dateFilter, status: statusFilter, staff: staffFilter }
  const appliedActive = activeCount(applied)

  useEffect(() => {
    if (!open) return
    setDraft({ date: dateFilter, status: statusFilter, staff: staffFilter })
  }, [open, dateFilter, statusFilter, staffFilter])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function close() {
    setOpen(false)
  }

  function handleApply() {
    onApply(draft)
    close()
  }

  function handleReset() {
    setDraft({ ...DEFAULT_FILTERS })
  }

  const categories: {
    id: FilterCategory
    label: string
    icon: ReactNode
  }[] = [
    { id: 'date', label: 'Select date', icon: <IconCalendar className="h-4 w-4 text-ash" /> },
    { id: 'status', label: 'Status', icon: <StatusIcon status="confirmed" /> },
    {
      id: 'staff',
      label: vertical.staffSingular,
      icon: <IconUserCircle className="h-4 w-4 text-ash" />,
    },
  ]

  return (
    <div ref={containerRef} className="relative mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
          open || appliedActive > 0
            ? 'border-carbon/20 bg-mist text-carbon'
            : 'border-fog bg-paper-white text-graphite hover:bg-mist',
        ].join(' ')}
      >
        <IconFilter className="h-4 w-4" />
        Filter
        {appliedActive > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-carbon px-1 text-[11px] font-medium text-paper-white">
            {appliedActive}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 flex items-start">
          {/* Main panel */}
          <div className="w-[220px] overflow-x-auto rounded-xl border border-fog bg-paper-white shadow-panel">
            <div className="flex items-center justify-between border-b border-fog px-4 py-3">
              <span className="text-sm font-medium text-carbon">Filter</span>
              <button
                type="button"
                onClick={close}
                className="rounded-md p-0.5 text-ash transition-colors hover:bg-mist hover:text-graphite"
                aria-label="Close filter"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <div className="p-1.5">
              {categories.map((cat) => {
                const count = categoryActiveCount(cat.id, draft)
                const selected = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={[
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                      selected ? 'bg-mist text-carbon' : 'text-graphite hover:bg-linen',
                    ].join(' ')}
                  >
                    {cat.icon}
                    <span className="flex-1 font-medium">{cat.label}</span>
                    {count > 0 && <CountBadge count={count} />}
                    <IconChevronRight className="h-3.5 w-3.5 shrink-0 text-ash" />
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2 border-t border-fog p-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm font-medium text-carbon transition-colors hover:bg-mist"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 rounded-lg bg-carbon px-3 py-2 text-sm font-medium text-paper-white transition-colors hover:bg-carbon/90"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Sub-panel */}
          <div className="ml-1 w-[200px] overflow-x-auto rounded-xl border border-fog bg-paper-white shadow-panel">
            <div className="p-1.5">
              {activeCategory === 'date' &&
                dateOptions.map((opt) => {
                  const selected = draft.date === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, date: opt.id }))}
                      className={[
                        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                        selected ? 'bg-mist text-carbon' : 'text-graphite hover:bg-linen',
                      ].join(' ')}
                    >
                      <IconCalendar className="h-4 w-4 shrink-0 text-ash" />
                      <span className="flex-1 font-medium">{opt.label}</span>
                      {selected && <IconCheck className="h-3.5 w-3.5 shrink-0 text-sky" />}
                    </button>
                  )
                })}

              {activeCategory === 'status' &&
                statusOptions.map((opt) => {
                  const selected = draft.status === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, status: opt.id }))}
                      className={[
                        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                        selected ? 'bg-mist text-carbon' : 'text-graphite hover:bg-linen',
                      ].join(' ')}
                    >
                      <StatusIcon status={opt.id} />
                      <span className="flex-1 font-medium">{opt.label}</span>
                      {selected && <IconCheck className="h-3.5 w-3.5 shrink-0 text-sky" />}
                      <CountBadge count={statusCounts[opt.id] ?? 0} />
                    </button>
                  )
                })}

              {activeCategory === 'staff' &&
                staffOptions.map((name) => {
                  const selected = draft.staff === name
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, staff: name }))}
                      className={[
                        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                        selected ? 'bg-mist text-carbon' : 'text-graphite hover:bg-linen',
                      ].join(' ')}
                    >
                      <IconUserCircle className="h-4 w-4 shrink-0 text-ash" />
                      <span className="flex-1 font-medium">{name}</span>
                      {selected && <IconCheck className="h-3.5 w-3.5 shrink-0 text-sky" />}
                      <CountBadge count={staffCounts[name] ?? 0} />
                    </button>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
