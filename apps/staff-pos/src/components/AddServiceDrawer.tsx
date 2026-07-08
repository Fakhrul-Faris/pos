'use client'

import { useEffect, useMemo, useState } from 'react'
import { serviceOptions } from '../data/mock'
import { useStore } from '../data/store'

type AddServiceDrawerProps = {
  bookingId: string | null
  onClose: () => void
  onSaved: (warning: boolean) => void
}

export function AddServiceDrawer({ bookingId, onClose, onSaved }: AddServiceDrawerProps) {
  const { getBookingById, addService, getOverlapWarning } = useStore()
  const booking = bookingId ? getBookingById(bookingId) : null
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const currentIds = useMemo(() => {
    if (!booking) return []
    return booking.actualServiceIds ?? booking.serviceIds
  }, [booking])

  const available = useMemo(
    () => serviceOptions.filter((s) => !currentIds.includes(s.id)),
    [currentIds],
  )

  const existingWarning = bookingId ? getOverlapWarning(bookingId) : null

  useEffect(() => {
    if (!bookingId) return
    setSelectedId(null)
  }, [bookingId])

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
          <p className="text-xs font-medium tracking-ui text-ash">Add service</p>
          <h2 className="font-display mt-1 text-lg font-medium tracking-ui text-carbon">
            {booking.customer}
          </h2>
          <p className="mt-1 text-sm text-ash">Planned: {booking.services}</p>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {existingWarning && (
            <div className="mb-4 rounded-xl border border-amber/40 bg-[#fff4e0] px-4 py-3 text-sm text-carbon">
              May run into {existingWarning.nextCustomer}&apos;s slot (+{existingWarning.overflowMinutes}{' '}
              min)
            </div>
          )}

          <div className="space-y-2">
            {available.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedId(s.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
                  selectedId === s.id
                    ? 'border-lavender bg-mist'
                    : 'border-fog bg-paper-white hover:border-lavender'
                }`}
              >
                <span className="text-sm font-medium text-carbon">{s.label}</span>
                <span className="text-xs text-ash">
                  {s.durationMinutes} min · RM {s.price}
                </span>
              </button>
            ))}
          </div>
        </div>

        <footer className="flex gap-2 border-t border-fog px-5 py-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 px-4 py-2">
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedId}
            onClick={() => {
              if (!selectedId) return
              const warning = addService(booking.id, selectedId)
              onSaved(!!warning)
            }}
            className="btn-primary flex-1 px-4 py-2 disabled:opacity-50"
          >
            Save
          </button>
        </footer>
      </aside>
    </div>
  )
}
