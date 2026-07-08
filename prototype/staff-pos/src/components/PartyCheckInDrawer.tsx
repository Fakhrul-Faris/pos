import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../data/store'

type PartyCheckInDrawerProps = {
  bookingId: string | null
  onClose: () => void
  onConfirmed: () => void
}

export function PartyCheckInDrawer({ bookingId, onClose, onConfirmed }: PartyCheckInDrawerProps) {
  const { getBookingById, confirmPartyArrival } = useStore()
  const booking = bookingId ? getBookingById(bookingId) : null
  const [choices, setChoices] = useState<Record<string, 'here' | 'no-show'>>({})

  useEffect(() => {
    if (!booking?.partyMembers) return
    const initial: Record<string, 'here' | 'no-show'> = {}
    for (const m of booking.partyMembers) {
      initial[m.id] = 'here'
    }
    setChoices(initial)
  }, [booking])

  useEffect(() => {
    if (!bookingId) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [bookingId, onClose])

  const arrivedCount = useMemo(
    () => Object.values(choices).filter((c) => c === 'here').length,
    [choices],
  )

  if (!booking?.partyMembers) return null

  return (
    <div className="fixed inset-0 z-[55] flex justify-end">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-carbon/20" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-fog bg-paper-white shadow-panel">
        <header className="border-b border-fog px-5 py-4">
          <p className="text-xs font-medium tracking-ui text-lavender">Party check-in</p>
          <h2 className="font-display mt-1 text-lg font-medium tracking-ui text-carbon">
            Party of {booking.partySize}
          </h2>
          <p className="mt-1 text-sm text-ash">
            Booked {booking.partySize} · adjust before assigning chairs
          </p>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {booking.partyMembers.map((m) => (
            <div key={m.id} className="rounded-xl border border-fog p-4">
              <p className="text-sm font-medium text-carbon">{m.name}</p>
              <p className="text-xs text-ash">{m.services} · RM {m.amount}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setChoices((c) => ({ ...c, [m.id]: 'here' }))}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium ${
                    choices[m.id] === 'here'
                      ? 'bg-mint-wash text-mint'
                      : 'border border-fog text-ash'
                  }`}
                >
                  Here
                </button>
                <button
                  type="button"
                  onClick={() => setChoices((c) => ({ ...c, [m.id]: 'no-show' }))}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium ${
                    choices[m.id] === 'no-show'
                      ? 'bg-mist text-ember'
                      : 'border border-fog text-ash'
                  }`}
                >
                  No-show
                </button>
              </div>
            </div>
          ))}
        </div>

        <footer className="flex gap-2 border-t border-fog px-5 py-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 px-4 py-2">
            Cancel
          </button>
          <button
            type="button"
            disabled={arrivedCount === 0}
            onClick={() => {
              confirmPartyArrival(booking.id, choices)
              onConfirmed()
            }}
            className="btn-primary flex-1 px-4 py-2 disabled:opacity-50"
          >
            Confirm arrival ({arrivedCount})
          </button>
        </footer>
      </aside>
    </div>
  )
}
