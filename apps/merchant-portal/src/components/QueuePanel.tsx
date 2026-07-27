'use client'

import { useBookings } from '../data/bookingsStore'

/** Dashboard monitor only - live queue operate lives on Shared POS. */
export function QueuePanel() {
  const { getQueueState } = useBookings()
  const queue = getQueueState()

  return (
    <div className="rounded-2xl border border-fog bg-paper-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ash">Queue right now</p>
          <p className="font-display tabular-nums mt-1 text-3xl font-medium tracking-ui text-carbon">
            {queue.nowServing ? `#${queue.nowServing.queueNumber}` : '-'}
          </p>
          <p className="mt-1 text-sm text-graphite">
            Now serving · {queue.waitingCount} waiting
          </p>
        </div>
        <span
          className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-lavender"
          aria-hidden
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-fog pt-4">
        {[
          { label: 'Waiting', value: String(queue.waitingCount) },
          {
            label: 'Avg wait',
            value: queue.avgWaitMinutes > 0 ? `${queue.avgWaitMinutes}m` : '-',
          },
          {
            label: 'Longest',
            value: queue.longestWaitMinutes > 0 ? `${queue.longestWaitMinutes}m` : '-',
          },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-xs text-ash">{item.label}</p>
            <p className="tabular-nums mt-0.5 text-sm font-medium text-carbon">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-lg bg-linen px-3 py-2.5 text-xs leading-snug text-ash">
        Counter operate (check-in / start / checkout) runs on the{' '}
        <span className="font-medium text-graphite">shared POS</span>. Layout
        preserved for POS - see{' '}
        <code className="text-[10px]">docs/design/component-refs/queue-component-design.png</code>
        .
      </p>
    </div>
  )
}
