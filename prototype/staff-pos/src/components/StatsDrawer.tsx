import { useEffect } from 'react'
import { useStore } from '../data/store'

type StatsDrawerProps = {
  open: boolean
  onClose: () => void
}

export function StatsDrawer({ open, onClose }: StatsDrawerProps) {
  const { actingStaffId, staff, getMyDayStats, transactions } = useStore()
  const acting = staff.find((s) => s.id === actingStaffId)
  const stats = getMyDayStats(actingStaffId)

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close stats"
        className="absolute inset-0 bg-carbon/20"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-sm flex-col border-l border-fog bg-paper-white shadow-panel">
        <header className="flex items-start justify-between gap-3 border-b border-fog px-5 py-4">
          <div>
            <p className="text-xs font-medium tracking-ui text-ash">My day</p>
            <h2 className="font-display mt-1 text-lg font-medium tracking-ui text-carbon">
              {acting?.name ?? 'Barber'}
            </h2>
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

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-fog bg-linen p-4">
              <p className="text-xs text-ash">Cuts today</p>
              <p className="font-display tabular-nums mt-1 text-3xl font-medium tracking-ui text-carbon">
                {stats.cuts}
              </p>
            </div>
            <div className="rounded-2xl border border-fog bg-linen p-4">
              <p className="text-xs text-ash">Revenue today</p>
              <p className="font-display tabular-nums mt-1 text-3xl font-medium tracking-ui text-carbon">
                RM {stats.revenue.toFixed(0)}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-ui text-ash">Recent</p>
            {transactions.length === 0 ? (
              <p className="text-sm text-ash">No payments yet today.</p>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-fog px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-carbon">{t.customer}</p>
                      <p className="text-xs text-ash">{t.time}</p>
                    </div>
                    <p className="tabular-nums text-sm font-medium text-carbon">
                      RM {t.net.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
