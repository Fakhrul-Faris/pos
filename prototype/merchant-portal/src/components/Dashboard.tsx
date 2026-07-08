import type { BookingRecord, VerticalLabels } from '../data/mock'
import { useBookings } from '../data/bookingsStore'
import { BookingsTable } from './BookingsTable'
import { QueuePanel } from './QueuePanel'
import { StaffPanel } from './StaffPanel'
import { StatCard } from './StatCard'

type DashboardProps = {
  vertical: VerticalLabels
  onSelectBooking: (booking: BookingRecord) => void
  onViewAllBookings?: () => void
  onNewBooking?: () => void
  onOpenCounter?: () => void
  onManageStaff?: () => void
}

function formatRevenue(amount: number) {
  return `RM ${amount.toLocaleString('en-MY')}`
}

function todayLabel() {
  return new Intl.DateTimeFormat('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date())
}

export function Dashboard({
  vertical,
  onSelectBooking,
  onViewAllBookings,
  onNewBooking,
  onOpenCounter,
  onManageStaff,
}: DashboardProps) {
  const { getTodayBookings, getQueueState } = useBookings()
  const todayBookings = getTodayBookings()
  const queue = getQueueState()
  const stats = {
    bookings: todayBookings.length,
    walkIns: todayBookings.filter((b) => b.customer === 'Walk-in').length,
    revenue: todayBookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + b.amount, 0),
    noShows: todayBookings.filter((b) => b.status === 'no-show').length,
    queueNumber: queue.nowServing?.queueNumber ?? 0,
    waitingCount: queue.waitingCount,
  }

  return (
    <div className="mx-auto max-w-[1200px] rounded-xl border border-fog px-6 py-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-ui text-sky">Today</p>
          <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
            {todayLabel()}
          </h1>
          <p className="mt-1 text-sm text-ash">
            {stats.bookings} bookings · {stats.walkIns} walk-ins · shop open until 8pm
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost px-4 py-2">
            Export today
          </button>
          <button type="button" onClick={onNewBooking} className="btn-primary px-4 py-2">
            New booking
          </button>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Bookings"
          value={String(stats.bookings)}
          hint="vs 11 yesterday"
          trend={{ direction: 'up', text: '+3' }}
        />
        <StatCard
          label="Walk-ins"
          value={String(stats.walkIns)}
          hint="not pre-booked"
        />
        <StatCard
          label="Revenue today"
          value={formatRevenue(stats.revenue)}
          hint="before payouts"
          trend={{ direction: 'up', text: '+18%' }}
        />
        <StatCard
          label="No-shows"
          value={String(stats.noShows)}
          hint={stats.noShows > 0 ? '1 slot lost' : 'none today'}
          trend={
            stats.noShows > 0
              ? { direction: 'down', text: '1 missed' }
              : undefined
          }
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <BookingsTable
          bookings={todayBookings}
          staffHeader={vertical.staffSingular}
          onSelectBooking={onSelectBooking}
          onViewAll={onViewAllBookings}
        />
        <div className="flex flex-col gap-4">
          <QueuePanel onOpenCounter={onOpenCounter} />
          <StaffPanel vertical={vertical} onManage={onManageStaff} />
        </div>
      </section>
    </div>
  )
}
