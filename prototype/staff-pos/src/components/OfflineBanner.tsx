import { useStore } from '../data/store'

export function OfflineBanner() {
  const { isOffline, pendingSyncCount, setOffline } = useStore()

  if (!isOffline) return null

  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber/30 bg-[#fff4e0] px-5 py-2">
      <div className="flex items-center gap-2 text-sm text-carbon">
        <span className="inline-block h-2 w-2 rounded-full bg-amber" aria-hidden />
        <span>
          Offline — saving locally
          {pendingSyncCount > 0 ? ` (${pendingSyncCount} pending)` : ''}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setOffline(false)}
        className="text-xs font-medium text-amber hover:underline"
      >
        Back online
      </button>
    </div>
  )
}
