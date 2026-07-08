'use client'

import { useEffect, useMemo, useState } from 'react'
import { serviceOptions } from '../data/mock'
import { useStore, type WalkInSlot } from '../data/store'

type WalkInDrawerProps = {
  open: boolean
  onClose: () => void
  onCreated: (bookingId: string) => void
}

function minutesToLabel(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
}

export function WalkInDrawer({ open, onClose, onCreated }: WalkInDrawerProps) {
  const { addWalkIn, getWalkInSlots } = useStore()
  const [customer, setCustomer] = useState('Walk-in')
  const [phone, setPhone] = useState('')
  const [serviceId, setServiceId] = useState(serviceOptions[0].id)
  const [selectedSlotId, setSelectedSlotId] = useState<string>('next-free')

  const slots = useMemo(() => getWalkInSlots(serviceId), [getWalkInSlots, serviceId])
  const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? slots.find((s) => s.available)

  useEffect(() => {
    if (!open) return
    setCustomer('Walk-in')
    setPhone('')
    setServiceId(serviceOptions[0].id)
    setSelectedSlotId('next-free')
  }, [open])

  useEffect(() => {
    if (!slots.some((s) => s.id === selectedSlotId)) {
      const first = slots.find((s) => s.available)
      if (first) setSelectedSlotId(first.id)
    }
  }, [slots, selectedSlotId])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const service = useMemo(
    () => serviceOptions.find((s) => s.id === serviceId) ?? serviceOptions[0],
    [serviceId],
  )

  if (!open) return null

  function slotButton(slot: WalkInSlot) {
    const active = selectedSlotId === slot.id
    return (
      <button
        key={slot.id}
        type="button"
        disabled={!slot.available}
        onClick={() => setSelectedSlotId(slot.id)}
        className={`min-h-12 w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
          active
            ? 'border-lavender bg-mist ring-2 ring-lavender/20'
            : slot.available
              ? 'border-fog bg-paper-white hover:border-lavender/40'
              : 'cursor-not-allowed border-fog bg-linen opacity-50'
        }`}
      >
        <p className="font-medium text-carbon">{slot.label}</p>
        {slot.reason && <p className="mt-0.5 text-xs text-ash">{slot.reason}</p>}
        {slot.available && (
          <p className="mt-0.5 text-xs text-graphite">{minutesToLabel(slot.startMinutes)} walk-in slot</p>
        )}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close walk-in"
        className="absolute inset-0 bg-carbon/20"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-fog bg-paper-white shadow-panel">
        <header className="flex items-start justify-between gap-3 border-b border-fog px-5 py-4">
          <div>
            <p className="text-xs font-medium tracking-ui text-sky">Walk-in</p>
            <h2 className="font-display mt-1 text-lg font-medium tracking-ui text-carbon">
              Quick add
            </h2>
            <p className="mt-1 text-sm text-ash">Pick a walk-in slot and barber.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-md text-ash transition-colors hover:bg-mist hover:text-carbon"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="mb-1 block text-xs text-ash">Customer</span>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="min-h-12 w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-ash">Phone (optional)</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+60123456789"
              className="min-h-12 w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-ash">Service</span>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="min-h-12 w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
            >
              {serviceOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} · {s.durationMinutes} min · RM {s.price}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="mb-2 block text-xs text-ash">Barber & slot</span>
            <div className="space-y-2">
              {slots.filter((s) => s.isNextFree).map(slotButton)}
              <p className="pt-1 text-[11px] font-medium uppercase tracking-ui text-ash">Or pick a slot</p>
              {slots.filter((s) => !s.isNextFree).map(slotButton)}
            </div>
          </div>

          <div className="rounded-2xl border border-fog bg-linen p-4">
            <p className="text-xs text-ash">Quoted</p>
            <p className="font-display mt-1 text-2xl font-medium tracking-ui text-carbon">
              RM {service.price}
            </p>
            <p className="mt-1 text-xs text-ash">
              {service.durationMinutes} min
              {selectedSlot?.available
                ? ` · ${selectedSlot.staffName} · ${minutesToLabel(selectedSlot.startMinutes)}`
                : ' · Pick an available slot'}
            </p>
          </div>
        </div>

        <footer className="flex gap-2 border-t border-fog px-5 py-4">
          <button type="button" onClick={onClose} className="btn-ghost min-h-12 flex-1 px-4 py-3">
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedSlot?.available}
            className="btn-primary min-h-12 flex-1 px-4 py-3 disabled:opacity-50"
            onClick={() => {
              if (!selectedSlot?.available) return
              const booking = addWalkIn({
                customer,
                serviceId,
                staffId: selectedSlot.staffId,
                phone,
                startMinutes: selectedSlot.startMinutes,
              })
              onCreated(booking.id)
            }}
          >
            Add to queue
          </button>
        </footer>
      </aside>
    </div>
  )
}
