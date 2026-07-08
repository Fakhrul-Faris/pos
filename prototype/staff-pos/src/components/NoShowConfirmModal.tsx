import { useEffect } from 'react'
import { useStore } from '../data/store'

type NoShowConfirmModalProps = {
  bookingId: string | null
  onClose: () => void
  onConfirmed: () => void
  onArrived: () => void
}

export function NoShowConfirmModal({
  bookingId,
  onClose,
  onConfirmed,
  onArrived,
}: NoShowConfirmModalProps) {
  const { getBookingById, markNoShow } = useStore()
  const booking = bookingId ? getBookingById(bookingId) : null

  useEffect(() => {
    if (!bookingId) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [bookingId, onClose])

  if (!booking) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-carbon/30"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-fog bg-paper-white p-6 shadow-panel">
        <h2 className="font-display text-lg font-medium tracking-ui text-carbon">
          Mark no-show?
        </h2>
        <p className="mt-2 text-sm text-graphite">
          {booking.customer} did not arrive for their {booking.services} appointment. The slot will
          be freed.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              if (booking) markNoShow(booking.id)
              onConfirmed()
            }}
            className="btn-primary w-full px-4 py-2"
          >
            Mark no-show
          </button>
          <button type="button" onClick={onArrived} className="btn-ghost w-full px-4 py-2">
            They just arrived
          </button>
          <button type="button" onClick={onClose} className="text-sm text-ash hover:text-carbon">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
