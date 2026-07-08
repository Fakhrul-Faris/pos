import { useEffect, useMemo, useState } from 'react'
import { serviceOptions } from '../data/mock'
import { useStore } from '../data/store'

type WalkInDrawerProps = {
  open: boolean
  onClose: () => void
  onCreated: (bookingId: string) => void
}

export function WalkInDrawer({ open, onClose, onCreated }: WalkInDrawerProps) {
  const { staff, addWalkIn } = useStore()
  const [customer, setCustomer] = useState('Walk-in')
  const [phone, setPhone] = useState('')
  const [serviceId, setServiceId] = useState(serviceOptions[0].id)
  const [staffId, setStaffId] = useState(staff[0]?.id ?? 's1')

  useEffect(() => {
    if (!open) return
    setCustomer('Walk-in')
    setPhone('')
    setServiceId(serviceOptions[0].id)
    setStaffId(staff[0]?.id ?? 's1')
  }, [open, staff])

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
            <p className="mt-1 text-sm text-ash">Creates a checked-in ticket with queue number.</p>
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

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="mb-1 block text-xs text-ash">Customer</span>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-ash">Phone (optional)</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+60123456789"
              className="w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-ash">Service</span>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
            >
              {serviceOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} · {s.durationMinutes} min · RM {s.price}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-ash">Assign to</span>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border border-fog bg-linen p-4">
            <p className="text-xs text-ash">Quoted</p>
            <p className="font-display mt-1 text-2xl font-medium tracking-ui text-carbon">
              RM {service.price}
            </p>
            <p className="mt-1 text-xs text-ash">{service.durationMinutes} min</p>
          </div>
        </div>

        <footer className="flex gap-2 border-t border-fog px-5 py-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 px-4 py-2">
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary flex-1 px-4 py-2"
            onClick={() => {
              const booking = addWalkIn({ customer, serviceId, staffId, phone })
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

