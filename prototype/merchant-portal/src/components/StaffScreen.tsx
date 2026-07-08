import { useState } from 'react'
import type { BookingRecord, VerticalLabels } from '../data/mock'
import { useBookings, type StaffRosterMember } from '../data/bookingsStore'
import { StaffStatusBadge } from './StatusBadge'
import { AddStaffDrawer } from './AddStaffDrawer'
import { UpgradePaywallDrawer } from './UpgradePaywallDrawer'
import { ManageStaffDrawer } from './ManageStaffDrawer'

type StaffScreenProps = {
  vertical: VerticalLabels
  onSelectBooking: (booking: BookingRecord) => void
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
}

function StaffCard({
  member,
  staffSingular,
  onSelectBooking,
  onSetStatus,
}: {
  member: StaffRosterMember
  staffSingular: string
  onSelectBooking: (booking: BookingRecord) => void
  onSetStatus: (staffId: string, status: 'available' | 'break' | 'off') => void
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-fog bg-paper-white">
      <div className="flex items-start justify-between gap-3 border-b border-fog px-4 py-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${member.headerClass}`}
          >
            {member.name.charAt(0)}
          </span>
          <div>
            <h2 className="font-display text-sm font-medium tracking-ui text-carbon">
              {member.name}
            </h2>
            <p className="text-xs text-ash">
              {member.bookingsToday} today · {member.completedToday} done
            </p>
          </div>
        </div>
        <StaffStatusBadge status={member.status} />
      </div>

      <div className="space-y-3 px-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-linen px-3 py-2">
            <p className="text-[11px] text-ash">Next free</p>
            <p className="tabular-nums mt-0.5 text-sm font-medium text-carbon">
              {member.nextFree ?? '—'}
            </p>
          </div>
          <div className="rounded-lg bg-linen px-3 py-2">
            <p className="text-[11px] text-ash">{staffSingular}</p>
            <p className="mt-0.5 text-sm font-medium text-carbon">
              {member.status === 'busy' ? 'With client' : member.status === 'break' ? 'On break' : member.status === 'off' ? 'Off shift' : 'Open'}
            </p>
          </div>
        </div>

        {member.currentBooking && (
          <button
            type="button"
            onClick={() => onSelectBooking(member.currentBooking!)}
            className="w-full rounded-xl border border-fog bg-mist/50 px-3 py-2.5 text-left transition-colors hover:bg-mist"
          >
            <p className="text-[11px] font-medium text-sky">In chair now</p>
            <p className="mt-0.5 text-sm font-medium text-carbon">
              {member.currentBooking.customer}
            </p>
            <p className="text-xs text-ash">{member.currentBooking.services}</p>
          </button>
        )}

        {member.upcomingBooking && !member.currentBooking && (
          <button
            type="button"
            onClick={() => onSelectBooking(member.upcomingBooking!)}
            className="w-full rounded-xl border border-fog px-3 py-2.5 text-left transition-colors hover:bg-linen"
          >
            <p className="text-[11px] font-medium text-ash">Up next</p>
            <p className="mt-0.5 text-sm font-medium text-carbon">
              {member.upcomingBooking.customer} · {formatTime(member.upcomingBooking.startMinutes)}
            </p>
            <p className="text-xs text-ash">{member.upcomingBooking.services}</p>
          </button>
        )}

        <div className="flex gap-1.5">
          {(
            [
              { id: 'available' as const, label: 'Available' },
              { id: 'break' as const, label: 'Break' },
              { id: 'off' as const, label: 'Off' },
            ] as const
          ).map((opt) => {
            const active =
              (opt.id === 'available' && member.status === 'available') ||
              (opt.id === 'break' && member.status === 'break') ||
              (opt.id === 'off' && member.status === 'off')
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSetStatus(member.id, opt.id)}
                className={[
                  'flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'bg-carbon text-paper-white'
                    : 'bg-mist text-graphite hover:bg-fog',
                ].join(' ')}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    </article>
  )
}

export function StaffScreen({ vertical, onSelectBooking }: StaffScreenProps) {
  const {
    getStaffRoster,
    setStaffOverride,
    addStaff,
    entitlements,
    plan,
    upgradePlan,
    staff,
    renameStaff,
    removeStaff,
  } = useBookings()
  const roster = getStaffRoster()

  const activeCount = roster.filter((m) => m.status === 'available' || m.status === 'busy').length
  const [addOpen, setAddOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)

  function handleSetStatus(staffId: string, status: 'available' | 'break' | 'off') {
    if (status === 'available') setStaffOverride(staffId, null)
    else setStaffOverride(staffId, status)
  }

  return (
    <div className="mx-auto h-full max-w-[1200px] rounded-xl border border-fog px-6 py-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-ui text-sky">{vertical.staffPlural}</p>
          <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
            On shift today
          </h1>
          <p className="mt-1 text-sm text-ash">
            {activeCount} of {roster.length} active · {vertical.serviceArea.toLowerCase()} status ·{' '}
            {staff.length}/{entitlements.staffLimit} on {plan}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setManageOpen(true)} className="btn-ghost px-4 py-2">
            Manage
          </button>
          <button type="button" onClick={() => setAddOpen(true)} className="btn-primary px-4 py-2">
            Add {vertical.staffSingular.toLowerCase()}
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roster.map((member) => (
          <StaffCard
            key={member.id}
            member={member}
            staffSingular={vertical.staffSingular}
            onSelectBooking={onSelectBooking}
            onSetStatus={handleSetStatus}
          />
        ))}
      </div>

      <AddStaffDrawer
        open={addOpen}
        staffSingular={vertical.staffSingular}
        onClose={() => setAddOpen(false)}
        onSubmit={(name) => {
          const res = addStaff(name)
          if (!res.ok) {
            setAddOpen(false)
            setPaywallOpen(true)
            return
          }
          setAddOpen(false)
        }}
      />

      <UpgradePaywallDrawer
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        subtitle={`You’re on ${plan}. This plan supports up to ${entitlements.staffLimit} staff.`}
        onUpgrade={() => {
          upgradePlan(plan === 'starter' ? 'growth' : 'pro')
          setPaywallOpen(false)
          setAddOpen(true)
        }}
      />

      <ManageStaffDrawer
        open={manageOpen}
        staffSingular={vertical.staffSingular}
        staff={staff}
        onClose={() => setManageOpen(false)}
        onRename={renameStaff}
        onRemove={removeStaff}
      />
    </div>
  )
}
