import { useMemo, useState } from 'react'
import { useStore } from '../data/store'
import type { FloorBooking } from '../data/mock'

function minutesToLabel(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
}

function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={`rounded-full bg-mist px-2 py-0.5 text-[11px] font-medium text-ash ${className ?? ''}`}
    >
      {label}
    </span>
  )
}

function BookingCard({
  b,
  actions,
  late,
}: {
  b: FloorBooking
  actions?: React.ReactNode
  late?: boolean
}) {
  return (
    <div
      className={`rounded-xl border bg-paper-white px-4 py-3 ${
        late ? 'border-ember/40' : 'border-fog'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-carbon">{b.customer}</p>
          <p className="truncate text-xs text-ash">
            {b.services} · {minutesToLabel(b.startMinutes)} · RM {b.amount}
          </p>
          {late && <p className="mt-0.5 text-[11px] font-medium text-ember">15+ min late</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {b.queueNumber ? <Badge label={`#${b.queueNumber}`} /> : null}
          {b.isParty ? <Badge label={`Party ${b.partySize}`} className="bg-mist text-lavender" /> : null}
          {b.source === 'walk-in' ? <Badge label="Walk-in" className="text-sky" /> : null}
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
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

export function FloorView({ onSelectBooking }: { onSelectBooking: (id: string) => void }) {
  const { lanes, demoNowMinutes, setDemoNowMinutes, staff, isLateBooking } = useStore()
  const [staffFilter, setStaffFilter] = useState<string>('all')

  const filteredLanes = useMemo(
    () => (staffFilter === 'all' ? lanes : lanes.filter((l) => l.staff.id === staffFilter)),
    [lanes, staffFilter],
  )

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

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-ui text-ash">Today board</p>
          <p className="mt-1 text-sm text-graphite">
            {totals.waiting} waiting · {totals.now} in chair · {totals.upcoming} upcoming · {totals.done}{' '}
            done
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ash">Demo time</span>
          <span className="rounded-full bg-mist px-2 py-1 text-xs font-medium text-carbon">
            {minutesToLabel(demoNowMinutes)}
          </span>
          <input
            type="range"
            min={9 * 60}
            max={20 * 60}
            step={15}
            value={demoNowMinutes}
            onChange={(e) => setDemoNowMinutes(Number(e.target.value))}
            className="w-44"
            aria-label="Demo time"
          />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStaffFilter('all')}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            staffFilter === 'all' ? 'bg-carbon text-paper-white' : 'bg-mist text-graphite'
          }`}
        >
          All barbers
        </button>
        {staff.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStaffFilter(s.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              staffFilter === s.id ? 'bg-carbon text-paper-white' : 'bg-mist text-graphite'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {partyBookings.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-ui text-lavender">Parties</p>
          <div className="grid gap-2 md:grid-cols-2">
            {partyBookings.map((p) => (
              <button key={p.id} type="button" onClick={() => onSelectBooking(p.id)} className="text-left">
                <BookingCard b={p} late={isLateBooking(p)} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {filteredLanes.map((lane) => (
          <section
            key={lane.staff.id}
            className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-fog bg-paper-white"
          >
            <div className="flex items-center justify-between gap-3 border-b border-fog px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${lane.staff.headerClass}`}
                >
                  {lane.staff.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-medium tracking-ui text-carbon">
                    {lane.staff.name}
                  </p>
                  <p className="text-xs text-ash">
                    {lane.waiting.length} waiting · {lane.now.length} in chair · {lane.upcoming.length}{' '}
                    upcoming
                  </p>
                </div>
              </div>
              <StatusBadge status={lane.staffStatus} />
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
                        <BookingCard b={b} actions={<Badge label={b.queueNumber ? `#${b.queueNumber}` : 'Now'} />} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-ui text-ash">Next</p>
                {lane.waiting.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-fog bg-linen/50 px-3 py-6 text-center text-sm text-ash">
                    Queue clear
                  </p>
                ) : (
                  <button type="button" onClick={() => onSelectBooking(lane.waiting[0].id)} className="w-full text-left">
                    <BookingCard
                      b={lane.waiting[0]}
                      actions={<Badge label={`#${lane.waiting[0].queueNumber ?? '—'}`} />}
                    />
                  </button>
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
                    {lane.upcoming.slice(0, 2).map((b) => (
                      <button key={b.id} type="button" onClick={() => onSelectBooking(b.id)} className="w-full text-left">
                        <BookingCard
                          b={b}
                          late={isLateBooking(b)}
                          actions={<Badge label={minutesToLabel(b.startMinutes)} />}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {lane.done.length > 0 && (
                <div className="pt-1">
                  <p className="text-xs text-ash">Done: {lane.done.length}</p>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
