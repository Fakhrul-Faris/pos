'use client'

import { MotionOverlay } from '@/components/motion/MotionOverlay'
import { PrototypeControls } from '@/components/PrototypeControls'
import { useStore } from '@/data/store'

type MoreSheetProps = {
  open: boolean
  onClose: () => void
  onSearch: () => void
  onMyDay: () => void
  onEndSession: () => void
  onToggleOffline?: (goingOffline: boolean, pendingCount: number) => void
}

export function MoreSheet({
  open,
  onClose,
  onSearch,
  onMyDay,
  onEndSession,
  onToggleOffline,
}: MoreSheetProps) {
  const { isOffline, pendingSyncCount, setOffline } = useStore()

  const rowClass =
    'flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-left text-sm font-medium text-carbon transition-colors hover:bg-mist'

  return (
    <MotionOverlay
      open={open}
      onClose={onClose}
      variant="sheet-bottom"
      zClass="z-[55]"
      shellClassName="flex items-end justify-center sm:items-center sm:p-4"
      backdropClassName="bg-carbon/30"
      panelClassName="w-full max-w-md rounded-t-3xl border border-fog bg-paper-white p-5 shadow-panel sm:rounded-3xl"
      aria-labelledby="more-sheet-title"
    >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="more-sheet-title" className="font-display text-lg font-medium tracking-ui text-carbon">
            More
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-md text-ash transition-colors hover:bg-mist hover:text-carbon"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            className={rowClass}
            onClick={() => {
              onClose()
              onSearch()
            }}
          >
            <span>Search</span>
            <span className="text-xs font-normal text-ash">Name, #, phone</span>
          </button>
          <button
            type="button"
            className={rowClass}
            onClick={() => {
              onClose()
              onMyDay()
            }}
          >
            <span>My day</span>
            <span className="text-xs font-normal text-ash">Cuts & revenue</span>
          </button>
        </div>

        <div className="my-4 border-t border-fog" />

        <div className="space-y-1">
          <button
            type="button"
            className={`${rowClass} text-ember hover:bg-[#fff0eb]`}
            onClick={() => {
              onClose()
              onEndSession()
            }}
          >
            End session
          </button>

          <div className="flex min-h-12 items-center justify-between rounded-xl px-4 text-sm text-graphite">
            <span>{isOffline ? 'Offline' : 'Online'}</span>
            <span className="text-xs text-ash">
              {isOffline
                ? `${pendingSyncCount} pending`
                : pendingSyncCount > 0
                  ? `${pendingSyncCount} synced when online`
                  : 'Connected'}
            </span>
          </div>

          <button
            type="button"
            className={rowClass}
            onClick={() => {
              const goingOffline = !isOffline
              onToggleOffline?.(goingOffline, pendingSyncCount)
              setOffline(goingOffline)
            }}
          >
            <span>Toggle offline (demo)</span>
            <span className="text-xs font-normal text-ash">{isOffline ? 'Go online' : 'Go offline'}</span>
          </button>
        </div>

        <div className="mt-4 border-t border-fog pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-ui text-ash">Staff tools</p>
          <PrototypeControls />
        </div>
    </MotionOverlay>
  )
}
