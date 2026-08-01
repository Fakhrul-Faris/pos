'use client'

import { useEffect, useMemo, useState } from 'react'
import { MotionPresenceShell } from '@/components/motion/MotionOverlay'
import { productOptions, serviceOptions } from '../data/mock'
import { useStore } from '../data/store'

type AddServiceDrawerProps = {
  bookingId: string | null
  onClose: () => void
  onSaved: (warning: boolean) => void
  /** Raise above cashier (z-70) when opened from pay screen */
  elevated?: boolean
}

export function AddServiceDrawer({
  bookingId,
  onClose,
  onSaved,
  elevated = false,
}: AddServiceDrawerProps) {
  const { getBookingById, addService, addProduct, getOverlapWarning } = useStore()
  const booking = bookingId ? getBookingById(bookingId) : null
  const [tab, setTab] = useState<'services' | 'products'>('services')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const currentIds = useMemo(() => {
    if (!booking) return []
    return booking.actualServiceIds ?? booking.serviceIds
  }, [booking])

  const available = useMemo(
    () => serviceOptions.filter((s) => !currentIds.includes(s.id)),
    [currentIds],
  )

  const existingWarning = bookingId ? getOverlapWarning(bookingId) : null
  const zClass = elevated ? 'z-[85]' : 'z-[55]'

  useEffect(() => {
    if (!bookingId) return
    setSelectedIds([])
    setTab('services')
  }, [bookingId])

  useEffect(() => {
    if (!bookingId) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [bookingId, onClose])

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  if (!booking) return null

  const count = selectedIds.length

  return (
    <MotionPresenceShell
      variant="drawer-right"
      onClose={onClose}
      zClass={zClass}
      backdropClassName="bg-carbon/20"
      panelClassName="flex h-full w-full max-w-md flex-col border-l border-fog bg-paper-white shadow-panel"
      aria-label="Add to bill"
    >
        <header className="border-b border-fog px-5 py-4">
          <p className="text-xs font-medium tracking-ui text-ash">Add to bill</p>
          <h2 className="font-display mt-1 text-lg font-medium tracking-ui text-carbon">
            {booking.customer}
          </h2>
          <div className="mt-3 flex gap-1 rounded-md bg-mist p-1">
            {(
              [
                { id: 'services' as const, label: 'Services' },
                { id: 'products' as const, label: 'Products' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id)
                  setSelectedIds([])
                }}
                className={`min-h-9 flex-1 rounded-md text-xs font-medium transition-colors ${
                  tab === t.id ? 'bg-paper-white text-carbon shadow-sm' : 'text-graphite'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'services' && existingWarning && (
            <div className="mb-4 rounded-xl border border-amber/40 bg-[#fff4e0] px-4 py-3 text-sm text-carbon">
              May run into {existingWarning.nextCustomer}&apos;s slot (+{existingWarning.overflowMinutes}{' '}
              min)
            </div>
          )}

          <p className="mb-3 text-xs text-ash">Select one or more</p>

          <div className="space-y-2">
            {tab === 'services'
              ? available.map((s) => {
                  const on = selectedIds.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggle(s.id)}
                      aria-pressed={on}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left ${
                        on
                          ? 'border-barber bg-barber-muted'
                          : 'border-fog bg-paper-white hover:border-barber'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                          on
                            ? 'border-barber bg-barber text-barber-fg'
                            : 'border-fog bg-paper-white text-transparent'
                        }`}
                        aria-hidden
                      >
                        ✓
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-carbon">{s.label}</span>
                      <span className="shrink-0 text-xs text-ash">
                        {s.durationMinutes} min · RM {s.price}
                      </span>
                    </button>
                  )
                })
              : productOptions.map((p) => {
                  const on = selectedIds.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggle(p.id)}
                      aria-pressed={on}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left ${
                        on
                          ? 'border-barber bg-barber-muted'
                          : 'border-fog bg-paper-white hover:border-barber'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                          on
                            ? 'border-barber bg-barber text-barber-fg'
                            : 'border-fog bg-paper-white text-transparent'
                        }`}
                        aria-hidden
                      >
                        ✓
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-carbon">{p.label}</span>
                      <span className="shrink-0 text-xs text-ash">RM {p.price}</span>
                    </button>
                  )
                })}
          </div>

          {tab === 'services' && available.length === 0 && (
            <p className="py-6 text-center text-sm text-ash">All services already on this ticket.</p>
          )}
        </div>

        <footer className="flex gap-2 border-t border-fog px-5 py-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 px-4 py-2">
            Cancel
          </button>
          <button
            type="button"
            disabled={count === 0}
            onClick={() => {
              if (count === 0) return
              let warning = false
              if (tab === 'services') {
                for (const id of selectedIds) {
                  const w = addService(booking.id, id)
                  if (w) warning = true
                }
              } else {
                for (const id of selectedIds) {
                  addProduct(booking.id, id)
                }
              }
              onSaved(warning)
            }}
            className="btn-primary flex-1 px-4 py-2 disabled:opacity-50"
          >
            {count === 0 ? 'Add' : `Add ${count}`}
          </button>
        </footer>
    </MotionPresenceShell>
  )
}
