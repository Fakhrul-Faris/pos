import { useEffect, useState } from 'react'
import type { BookingRecord, PaymentMethod } from '../data/mock'
import { IconX } from './icons'
import { StatusBadge } from './StatusBadge'

type BookingDetailDrawerProps = {
  booking: BookingRecord | null
  onClose: () => void
  onCheckIn: (id: string) => void
  onStartService: (id: string) => void
  onMarkNoShow: (id: string) => void
  onComplete: (id: string, method: PaymentMethod) => void
  onRebook: (booking: BookingRecord) => void
  onReschedule: (booking: BookingRecord) => void
  onViewReceipt?: (bookingId: string) => void
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function formatAmount(amount: number) {
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 0 })}`
}

function formatSource(source: BookingRecord['source']) {
  const map = { online: 'Online booking', 'walk-in': 'Walk-in', phone: 'Phone booking' }
  return map[source]
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-xs text-ash">{label}</dt>
      <dd className="text-right text-sm font-medium text-carbon">{value}</dd>
    </div>
  )
}

const paymentMethods: { id: PaymentMethod; label: string }[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'duitnow', label: 'DuitNow' },
  { id: 'hitpay', label: 'HitPay' },
]

export function BookingDetailDrawer({
  booking,
  onClose,
  onCheckIn,
  onStartService,
  onMarkNoShow,
  onComplete,
  onRebook,
  onReschedule,
  onViewReceipt,
}: BookingDetailDrawerProps) {
  const [showPayment, setShowPayment] = useState(false)

  useEffect(() => {
    setShowPayment(false)
  }, [booking?.id, booking?.status])

  useEffect(() => {
    if (!booking) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [booking, onClose])

  if (!booking) return null

  const endMinutes = booking.startMinutes + booking.durationMinutes

  function handlePayment(method: PaymentMethod) {
    onComplete(booking!.id, method)
    setShowPayment(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-carbon/20"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-fog bg-paper-white shadow-[rgba(0,0,0,0.08)_0px_8px_24px_0px]">
        <header className="flex items-start justify-between gap-3 border-b border-fog px-5 py-4">
          <div>
            <p className="text-xs font-medium tracking-ui text-ash">{booking.ref}</p>
            <h2 className="font-display mt-1 text-lg font-medium tracking-ui text-carbon">
              {booking.customer}
            </h2>
            <div className="mt-2">
              <StatusBadge status={booking.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ash transition-colors hover:bg-mist hover:text-carbon"
          >
            <IconX className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <section className="mb-6">
            <h3 className="mb-1 text-xs font-medium uppercase tracking-ui text-ash">
              Appointment
            </h3>
            <dl className="divide-y divide-fog">
              <DetailRow label="Date" value={formatDate(booking.date)} />
              <DetailRow
                label="Time"
                value={`${formatTime(booking.startMinutes)} – ${formatTime(endMinutes)}`}
              />
              <DetailRow label="Duration" value={`${booking.durationMinutes} min`} />
              <DetailRow label="Service" value={booking.services} />
              <DetailRow label="Staff" value={booking.staffName} />
              <DetailRow label="Source" value={formatSource(booking.source)} />
            </dl>
          </section>

          <section className="mb-6">
            <h3 className="mb-1 text-xs font-medium uppercase tracking-ui text-ash">
              Customer
            </h3>
            <dl className="divide-y divide-fog">
              <DetailRow label="Phone" value={booking.phone} />
              {booking.notes && <DetailRow label="Notes" value={booking.notes} />}
            </dl>
          </section>

          <section>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-ui text-ash">
              Payment
            </h3>
            <dl className="divide-y divide-fog">
              <DetailRow label="Quoted" value={formatAmount(booking.amount)} />
            </dl>
          </section>

          {showPayment && (
            <section className="mt-6 rounded-xl border border-fog bg-linen p-4">
              <p className="mb-3 text-sm font-medium text-carbon">
                Collect {formatAmount(booking.amount)}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => handlePayment(method.id)}
                    className="rounded-lg border border-fog bg-paper-white px-3 py-2.5 text-xs font-medium text-carbon transition-colors hover:border-lavender hover:bg-mist"
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <footer className="flex flex-wrap gap-2 border-t border-fog px-5 py-4">
          {booking.status === 'confirmed' && (
            <>
              <button
                type="button"
                onClick={() => onCheckIn(booking.id)}
                className="btn-primary flex-1 px-4 py-2"
              >
                Check in
              </button>
              <button
                type="button"
                onClick={() => onReschedule(booking)}
                className="btn-ghost px-4 py-2"
              >
                Reschedule
              </button>
            </>
          )}
          {booking.status === 'checked-in' && (
            <>
              <button
                type="button"
                onClick={() => onStartService(booking.id)}
                className="btn-primary flex-1 px-4 py-2"
              >
                Start service
              </button>
              <button
                type="button"
                onClick={() => {
                  onMarkNoShow(booking.id)
                  onClose()
                }}
                className="btn-ghost px-4 py-2"
              >
                Mark no-show
              </button>
            </>
          )}
          {booking.status === 'in-service' && !showPayment && (
            <button
              type="button"
              onClick={() => setShowPayment(true)}
              className="btn-primary w-full px-4 py-2"
            >
              Complete & take payment
            </button>
          )}
          {booking.status === 'completed' && (
            <button
              type="button"
              onClick={() => {
                onViewReceipt?.(booking.id)
                onClose()
              }}
              className="btn-ghost w-full px-4 py-2"
            >
              View receipt
            </button>
          )}
          {(booking.status === 'no-show' || booking.status === 'cancelled') && (
            <button
              type="button"
              onClick={() => {
                onRebook(booking)
                onClose()
              }}
              className="btn-primary w-full px-4 py-2"
            >
              Rebook
            </button>
          )}
        </footer>
      </aside>
    </div>
  )
}
