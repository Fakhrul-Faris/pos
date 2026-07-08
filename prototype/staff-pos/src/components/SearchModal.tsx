import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../data/store'

type SearchModalProps = {
  open: boolean
  onClose: () => void
  onSelectBooking: (id: string) => void
}

export function SearchModal({ open, onClose, onSelectBooking }: SearchModalProps) {
  const { bookings, staff } = useStore()
  const [q, setQ] = useState('')

  useEffect(() => {
    if (open) setQ('')
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return bookings.slice(0, 8)
    return bookings
      .filter((b) => {
        const staffName = staff.find((s) => s.id === b.staffId)?.name ?? ''
        const blob = `${b.customer} ${b.services} ${staffName} ${b.queueNumber ?? ''}`.toLowerCase()
        return blob.includes(needle)
      })
      .slice(0, 20)
  }, [bookings, q, staff])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-carbon/20"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[720px] overflow-hidden rounded-2xl border border-fog bg-paper-white shadow-panel">
        <div className="border-b border-fog p-4">
          <p className="text-xs font-medium tracking-ui text-ash">Search</p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customer, service, staff, or queue #"
            className="mt-2 w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
            autoFocus
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ash">No matches</p>
          ) : (
            <ul className="divide-y divide-fog">
              {results.map((b) => {
                const staffName = staff.find((s) => s.id === b.staffId)?.name ?? '—'
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectBooking(b.id)
                        onClose()
                      }}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-linen"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-carbon">
                          {b.customer}
                        </span>
                        <span className="block truncate text-xs text-ash">
                          {b.services} · {staffName}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {b.queueNumber ? (
                          <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-medium text-ash">
                            #{b.queueNumber}
                          </span>
                        ) : null}
                        <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-medium text-ash">
                          {b.status}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <div className="border-t border-fog px-4 py-3 text-right">
          <button type="button" onClick={onClose} className="text-xs font-medium text-lavender hover:text-iris">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

