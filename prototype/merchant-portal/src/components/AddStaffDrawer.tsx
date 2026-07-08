import { useEffect, useState } from 'react'
import { IconX } from './icons'

type AddStaffDrawerProps = {
  open: boolean
  staffSingular: string
  onClose: () => void
  onSubmit: (name: string) => void
}

export function AddStaffDrawer({ open, staffSingular, onClose, onSubmit }: AddStaffDrawerProps) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) setName('')
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const canSubmit = name.trim().length > 1

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close add staff"
        className="absolute inset-0 bg-carbon/20"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-fog bg-paper-white shadow-[rgba(0,0,0,0.08)_0px_8px_24px_0px]">
        <header className="flex items-start justify-between gap-3 border-b border-fog px-5 py-4">
          <div>
            <p className="text-xs font-medium tracking-ui text-sky">Staff</p>
            <h2 className="font-display mt-1 text-lg font-medium tracking-ui text-carbon">
              Add {staffSingular.toLowerCase()}
            </h2>
            <p className="mt-1 text-sm text-ash">This will add a new member to your roster.</p>
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

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <label className="block">
            <span className="mb-1 block text-xs text-ash">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. ${staffSingular} Aiman`}
              className="w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
              autoFocus
            />
          </label>
        </div>

        <footer className="flex gap-2 border-t border-fog px-5 py-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 px-4 py-2">
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onSubmit(name)}
            className="btn-primary flex-1 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add
          </button>
        </footer>
      </aside>
    </div>
  )
}

