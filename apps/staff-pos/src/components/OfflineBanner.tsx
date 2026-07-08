'use client'

import { useStore } from '../data/store'

export function OfflineBanner() {
  const { isOffline, pendingSyncCount } = useStore()

  if (!isOffline) return null

  return (
    <div className="flex items-center gap-2 border-b border-amber/30 bg-[#fff4e0] px-5 py-2 text-sm text-carbon">
      <span className="inline-block h-2 w-2 rounded-full bg-amber" aria-hidden />
      <span>
        Offline — saving locally
        {pendingSyncCount > 0 ? ` (${pendingSyncCount} pending)` : ''}
      </span>
    </div>
  )
}
