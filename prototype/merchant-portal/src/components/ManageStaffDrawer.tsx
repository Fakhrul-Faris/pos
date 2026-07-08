import { useEffect, useMemo, useState } from 'react'
import type { StaffMember } from '../data/bookingsStore'
import { IconX } from './icons'

type ManageStaffDrawerProps = {
  open: boolean
  staffSingular: string
  staff: StaffMember[]
  onClose: () => void
  onRename: (id: string, name: string) => void
  onRemove: (id: string) => { ok: true } | { ok: false; reason: 'has_bookings' | 'min_one' }
}

export function ManageStaffDrawer({
  open,
  staffSingular,
  staff,
  onClose,
  onRename,
  onRemove,
}: ManageStaffDrawerProps) {
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDraft(Object.fromEntries(staff.map((s) => [s.id, s.name])))
    setError(null)
  }, [open, staff])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const changed = useMemo(() => {
    return staff.some((s) => (draft[s.id] ?? s.name).trim() !== s.name)
  }, [draft, staff])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close staff manager"
        className="absolute inset-0 bg-carbon/20"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-fog bg-paper-white shadow-[rgba(0,0,0,0.08)_0px_8px_24px_0px]">
        <header className="flex items-start justify-between gap-3 border-b border-fog px-5 py-4">
          <div>
            <p className="text-xs font-medium tracking-ui text-sky">Staff</p>
            <h2 className="font-display mt-1 text-lg font-medium tracking-ui text-carbon">
              Manage {staffSingular.toLowerCase()}s
            </h2>
            <p className="mt-1 text-sm text-ash">Rename or remove roster members.</p>
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
          {error && (
            <div className="mb-4 rounded-xl border border-ember/20 bg-[#fff7f5] px-4 py-3">
              <p className="text-sm font-medium text-carbon">Couldn’t remove</p>
              <p className="mt-0.5 text-xs text-ash">{error}</p>
            </div>
          )}

          <ul className="space-y-3">
            {staff.map((member) => (
              <li key={member.id} className="rounded-xl border border-fog p-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${member.headerClass}`}
                  >
                    {member.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-ui text-ash">Name</p>
                    <input
                      type="text"
                      value={draft[member.id] ?? member.name}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, [member.id]: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm font-medium text-carbon outline-none focus:border-lavender"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const res = onRemove(member.id)
                      if (!res.ok) {
                        setError(
                          res.reason === 'has_bookings'
                            ? 'This staff member has bookings on the schedule.'
                            : 'You must have at least one staff member.',
                        )
                      } else {
                        setError(null)
                      }
                    }}
                    className="rounded-lg border border-fog bg-paper-white px-3 py-2 text-xs font-medium text-ember transition-colors hover:bg-mist"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <footer className="flex gap-2 border-t border-fog px-5 py-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 px-4 py-2">
            Close
          </button>
          <button
            type="button"
            disabled={!changed}
            onClick={() => {
              for (const member of staff) {
                const next = (draft[member.id] ?? member.name).trim()
                if (next && next !== member.name) onRename(member.id, next)
              }
              onClose()
            }}
            className="btn-primary flex-1 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save changes
          </button>
        </footer>
      </aside>
    </div>
  )
}

