'use client'

import { useCallback, useState } from 'react'

export function usePageEditMode(initial = false) {
  const [editing, setEditing] = useState(initial)
  const [savedFlash, setSavedFlash] = useState(false)

  const startEdit = useCallback(() => {
    setEditing(true)
    setSavedFlash(false)
  }, [])

  const save = useCallback(() => {
    setEditing(false)
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1600)
  }, [])

  const cancel = useCallback(() => {
    setEditing(false)
  }, [])

  return { editing, savedFlash, startEdit, save, cancel }
}

type PageEditControlsProps = {
  editing: boolean
  savedFlash?: boolean
  onEdit: () => void
  onSave: () => void
  onCancel?: () => void
  /** Short label when idle */
  editLabel?: string
}

/** Header Edit / Save controls. Store still writes live; Save exits edit mode. */
export function PageEditControls({
  editing,
  savedFlash,
  onEdit,
  onSave,
  onCancel,
  editLabel = 'Edit',
}: PageEditControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {savedFlash && !editing && (
        <span className="rounded-full bg-mist px-3 py-1 text-xs font-medium text-sky">
          Saved
        </span>
      )}
      {editing ? (
        <>
          <span className="hidden text-xs text-ash sm:inline">
            Changes apply as you go
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-fog px-4 py-2 text-sm font-medium text-graphite hover:bg-linen"
            >
              Cancel
            </button>
          )}
          <button type="button" onClick={onSave} className="btn-primary px-4 py-2">
            Save
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-fog bg-paper-white px-4 py-2 text-sm font-medium text-carbon hover:bg-linen"
        >
          {editLabel}
        </button>
      )}
    </div>
  )
}

/** Disable nested form controls when not editing. */
export function EditGate({
  editing,
  children,
  className = '',
}: {
  editing: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={[
        className,
        editing ? '' : 'pointer-events-none select-none [&_button]:opacity-60 [&_input]:bg-linen [&_select]:bg-linen [&_textarea]:bg-linen',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-readonly={!editing}
      data-editing={editing ? 'true' : 'false'}
    >
      <fieldset
        disabled={!editing}
        className="min-w-0 border-0 p-0 disabled:opacity-100"
      >
        {children}
      </fieldset>
    </div>
  )
}
