import type { BookingStatus } from '../data/mock'

const statusConfig: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  confirmed: {
    label: 'Confirmed',
    className: 'bg-mist text-ash',
  },
  'checked-in': {
    label: 'Checked in',
    className: 'bg-mist text-lavender',
  },
  'in-service': {
    label: 'In service',
    className: 'bg-mist text-sky',
  },
  completed: {
    label: 'Completed',
    className: 'bg-mint-wash text-mint',
  },
  'no-show': {
    label: 'No-show',
    className: 'bg-[#ffe8e0] text-ember',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-mist text-ash/70',
  },
}

type StatusBadgeProps = {
  status: BookingStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}

export function StaffStatusBadge({
  status,
}: {
  status: 'available' | 'busy' | 'break' | 'off'
}) {
  const map = {
    available: { label: 'Available', className: 'bg-mint-wash text-mint' },
    busy: { label: 'Busy', className: 'bg-mist text-lavender' },
    break: { label: 'On break', className: 'bg-[#fff4e0] text-amber' },
    off: { label: 'Off', className: 'bg-mist text-ash/70' },
  }
  const config = map[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
