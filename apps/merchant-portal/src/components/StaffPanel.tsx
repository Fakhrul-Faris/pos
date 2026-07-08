'use client'

import type { VerticalLabels } from '../data/mock'
import { useBookings } from '../data/bookingsStore'
import { StaffStatusBadge } from './StatusBadge'

type StaffPanelProps = {
  vertical: VerticalLabels
  onManage?: () => void
}

export function StaffPanel({ vertical, onManage }: StaffPanelProps) {
  const { getStaffOnShift } = useBookings()
  const staff = getStaffOnShift()

  return (
    <div className="rounded-2xl border border-fog bg-paper-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-medium tracking-ui text-carbon">
          {vertical.staffPlural} on shift
        </h2>
        <button
          type="button"
          onClick={onManage}
          className="text-xs font-medium text-lavender hover:text-iris"
        >
          Manage
        </button>
      </div>

      <ul className="space-y-2">
        {staff.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-fog px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-carbon">{member.name}</p>
              <p className="text-xs text-ash">
                {member.bookingsToday} today
                {member.nextFree ? ` · Free ${member.nextFree}` : member.status === 'available' ? ' · Free now' : null}
              </p>
            </div>
            <StaffStatusBadge status={member.status} />
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-ash">
        {staff.filter((s) => s.status === 'available' || s.status === 'busy').length} of{' '}
        {staff.length} {vertical.serviceArea.toLowerCase()} active
      </p>
    </div>
  )
}
