import { useEffect } from 'react'
import { useStore } from '../data/store'

type ReassignBarberDrawerProps = {
  bookingId: string | null
  onClose: () => void
  onReassigned: () => void
}

export function ReassignBarberDrawer({ bookingId, onClose, onReassigned }: ReassignBarberDrawerProps) {
  const { getBookingById, getReassignOptions, reassignBarber } = useStore()
  const booking = bookingId ? getBookingById(bookingId) : null
  const options = bookingId ? getReassignOptions(bookingId) : []

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
    <div className="fixed inset-0 z-[55] flex justify-end">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-carbon/20" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-fog bg-paper-white shadow-panel">
        <header className="border-b border-fog px-5 py-4">
          <p className="text-xs font-medium tracking-ui text-ash">Reassign barber</p>
          <h2 className="font-display mt-1 text-lg font-medium tracking-ui text-carbon">
            {booking.customer}
          </h2>
        </header>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {options.map((o) => (
            <button
              key={o.staffId}
              type="button"
              disabled={!o.available}
              onClick={() => {
                const result = reassignBarber(booking.id, o.staffId)
                if (result.ok) onReassigned()
              }}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                o.available
                  ? 'border-fog bg-paper-white hover:border-lavender hover:bg-mist'
                  : 'cursor-not-allowed border-fog bg-linen/50 opacity-60'
              }`}
            >
              <span className="text-sm font-medium text-carbon">{o.name}</span>
              <span className="text-xs text-ash">{o.available ? 'Available' : o.reason}</span>
            </button>
          ))}
        </div>
        <footer className="border-t border-fog px-5 py-4">
          <button type="button" onClick={onClose} className="btn-ghost w-full px-4 py-2">
            Cancel
          </button>
        </footer>
      </aside>
    </div>
  )
}
