import { useEffect, useMemo } from 'react'
import type { FloorBooking } from '../data/mock'
import { useStore } from '../data/store'

type BookingDrawerProps = {
  bookingId: string | null
  onClose: () => void
  onToast: (t: { kind: 'success' | 'info' | 'error'; title: string; message?: string }) => void
  onOpenReassign: (id: string) => void
  onOpenAddService: (id: string) => void
  onOpenNoShow: (id: string) => void
  onOpenPartyCheckIn: (id: string) => void
  onOpenPartyAssign: (id: string) => void
  onOpenPayment: (id: string) => void
}

function minutesToLabel(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
}

function StatusPill({ status }: { status: FloorBooking['status'] }) {
  const map: Record<FloorBooking['status'], { label: string; className: string }> = {
    confirmed: { label: 'Upcoming', className: 'bg-mist text-graphite' },
    'checked-in': { label: 'Checked in', className: 'bg-mist text-lavender' },
    'in-service': { label: 'In chair', className: 'bg-mist text-sky' },
    completed: { label: 'Completed', className: 'bg-mint-wash text-mint' },
    'no-show': { label: 'No-show', className: 'bg-mist text-ember' },
    cancelled: { label: 'Cancelled', className: 'bg-mist text-ash' },
  }
  const cfg = map[status]
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

export function BookingDrawer({
  bookingId,
  onClose,
  onToast,
  onOpenReassign,
  onOpenAddService,
  onOpenNoShow,
  onOpenPartyCheckIn,
  onOpenPartyAssign,
  onOpenPayment,
}: BookingDrawerProps) {
  const {
    getBookingById,
    staff,
    checkIn,
    start,
    cancelBooking,
    getOverlapWarning,
    isLateBooking,
    actingStaffId,
  } = useStore()
  const booking = bookingId ? getBookingById(bookingId) : null

  useEffect(() => {
    if (!bookingId) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [bookingId, onClose])

  const staffName = useMemo(() => {
    if (!booking) return '—'
    return staff.find((s) => s.id === booking.staffId)?.name ?? '—'
  }, [booking, staff])

  const overlapWarning = bookingId ? getOverlapWarning(bookingId) : null
  const late = booking ? isLateBooking(booking) : false

  if (!booking) return null

  const canReassign = !booking.isParty && booking.status !== 'in-service' && booking.status !== 'completed'
  const isParty = booking.isParty && booking.partyMembers

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close booking drawer"
        className="absolute inset-0 bg-carbon/20"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-fog bg-paper-white shadow-panel">
        <header className="flex items-start justify-between gap-3 border-b border-fog px-5 py-4">
          <div>
            <p className="text-xs font-medium tracking-ui text-ash">
              {booking.queueNumber ? `#${booking.queueNumber}` : 'Booking'}
              {booking.source === 'walk-in' ? ' · Walk-in' : ' · Online'}
            </p>
            <h2 className="font-display mt-1 text-lg font-medium tracking-ui text-carbon">
              {booking.customer}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill status={booking.status} />
              {late && booking.status === 'confirmed' && (
                <span className="text-xs font-medium text-ember">15+ min late</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-ash transition-colors hover:bg-mist hover:text-carbon"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {booking.phone && (
            <a href={`tel:${booking.phone}`} className="mb-4 block text-sm text-lavender hover:underline">
              {booking.phone}
            </a>
          )}

          <div className="rounded-2xl border border-fog bg-linen p-4">
            <p className="text-xs text-ash">Service</p>
            <p className="mt-1 text-sm font-medium text-carbon">{booking.services}</p>
            <p className="mt-1 text-xs text-ash">
              {minutesToLabel(booking.startMinutes)} · {booking.durationMinutes} min · {staffName}
            </p>
            <p className="mt-3 text-xs text-ash">Total</p>
            <p className="font-display tabular-nums mt-1 text-2xl font-medium tracking-ui text-carbon">
              RM {booking.amount}
            </p>
          </div>

          {overlapWarning && (
            <div className="mt-4 rounded-xl border border-amber/40 bg-[#fff4e0] px-4 py-3 text-sm text-carbon">
              Add-on may overlap {overlapWarning.nextCustomer}&apos;s slot (+{overlapWarning.overflowMinutes}{' '}
              min)
            </div>
          )}

          {isParty && (
            <div className="mt-4 rounded-2xl border border-lavender/30 bg-mist p-4">
              <p className="text-xs font-medium text-lavender">Party booking</p>
              <p className="mt-1 text-sm text-graphite">
                {booking.partyMembers!.filter((m) => m.status !== 'no-show').length} of{' '}
                {booking.partySize} guests
              </p>
              <p className="mt-1 text-xs capitalize text-ash">
                Phase: {booking.partyPhase?.replace('-', ' ') ?? 'booked'}
              </p>
            </div>
          )}

          <p className="mt-4 text-xs text-ash">
            Acting as {staff.find((s) => s.id === actingStaffId)?.name}
          </p>
        </div>

        <footer className="flex flex-col gap-2 border-t border-fog px-5 py-4">
          {isParty && booking.partyPhase === 'booked' && (
            <button
              type="button"
              onClick={() => onOpenPartyCheckIn(booking.id)}
              className="btn-primary w-full px-4 py-2"
            >
              Check in party
            </button>
          )}

          {isParty &&
            booking.partyPhase &&
            ['arrived', 'assigning', 'in-service'].includes(booking.partyPhase) && (
              <button
                type="button"
                onClick={() => onOpenPartyAssign(booking.id)}
                className="btn-primary w-full px-4 py-2"
              >
                Manage chairs
              </button>
            )}

          {isParty && booking.partyPhase === 'ready-pay' && (
            <button
              type="button"
              onClick={() => onOpenPayment(booking.id)}
              className="btn-primary w-full px-4 py-2"
            >
              Take payment
            </button>
          )}

          {!isParty && booking.status === 'confirmed' && (
            <>
              <button
                type="button"
                onClick={() => {
                  checkIn(booking.id)
                  onToast({ kind: 'success', title: 'Checked in', message: 'Added to waiting queue.' })
                  onClose()
                }}
                className="btn-primary w-full px-4 py-2"
              >
                Mark arrived
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onOpenNoShow(booking.id)}
                  className="btn-ghost flex-1 px-4 py-2"
                >
                  No-show
                </button>
                {canReassign && (
                  <button
                    type="button"
                    onClick={() => onOpenReassign(booking.id)}
                    className="btn-ghost flex-1 px-4 py-2"
                  >
                    Reassign
                  </button>
                )}
              </div>
            </>
          )}

          {!isParty && booking.status === 'checked-in' && (
            <>
              <button
                type="button"
                onClick={() => {
                  start(booking.id)
                  onToast({ kind: 'success', title: 'Started', message: 'Moved to in chair.' })
                  onClose()
                }}
                className="btn-primary w-full px-4 py-2"
              >
                Start cut
              </button>
              <div className="flex gap-2">
                {canReassign && (
                  <button
                    type="button"
                    onClick={() => onOpenReassign(booking.id)}
                    className="btn-ghost flex-1 px-4 py-2"
                  >
                    Reassign
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenNoShow(booking.id)}
                  className="btn-ghost flex-1 px-4 py-2"
                >
                  No-show
                </button>
              </div>
            </>
          )}

          {!isParty && booking.status === 'in-service' && (
            <>
              <button
                type="button"
                onClick={() => onOpenPayment(booking.id)}
                className="btn-primary w-full px-4 py-2"
              >
                Complete & take payment
              </button>
              <button
                type="button"
                onClick={() => onOpenAddService(booking.id)}
                className="btn-ghost w-full px-4 py-2"
              >
                Add service
              </button>
            </>
          )}

          {!isParty &&
            (booking.status === 'confirmed' || booking.status === 'checked-in') && (
              <button
                type="button"
                onClick={() => {
                  cancelBooking(booking.id)
                  onToast({ kind: 'info', title: 'Cancelled', message: 'Booking cancelled.' })
                  onClose()
                }}
                className="text-sm text-ash hover:text-ember"
              >
                Cancel booking
              </button>
            )}

          {booking.status === 'completed' && (
            <button type="button" onClick={onClose} className="btn-ghost w-full px-4 py-2">
              Close
            </button>
          )}
        </footer>
      </aside>
    </div>
  )
}
