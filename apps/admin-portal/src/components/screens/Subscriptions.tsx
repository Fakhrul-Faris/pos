'use client'

import { useMemo, useState } from 'react'
import { useAdminStore } from '@/data/store'
import { formatDate, formatRM } from '@/data/mock'
import { PLAN_LABELS } from '@/data/types'
import { MerchantStatusBadge } from '../StatusBadge'

type Props = {
  onOpenMerchant: (id: string) => void
}

export function Subscriptions({ onOpenMerchant }: Props) {
  const store = useAdminStore()
  const [tab, setTab] = useState<'attention' | 'all'>('attention')

  const attention = useMemo(
    () =>
      store.merchants.filter(
        (m) =>
          m.status === 'suspension_pending' ||
          m.subscription.status === 'past_due' ||
          m.status === 'suspended',
      ),
    [store.merchants],
  )

  const rows = tab === 'attention' ? attention : store.merchants

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-ui text-carbon">
          Subscriptions & Suspensions
        </h1>
        <p className="mt-1 text-sm text-graphite">
          Intervene on past-due accounts before grace expires. Open a merchant to
          extend, waive, suspend, or reactivate.
        </p>
      </header>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('attention')}
          className={[
            'rounded-full px-3 py-1.5 text-xs font-medium',
            tab === 'attention'
              ? 'bg-carbon text-paper-white'
              : 'bg-mist text-graphite',
          ].join(' ')}
        >
          Needs attention ({attention.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('all')}
          className={[
            'rounded-full px-3 py-1.5 text-xs font-medium',
            tab === 'all' ? 'bg-carbon text-paper-white' : 'bg-mist text-graphite',
          ].join(' ')}
        >
          All merchants
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-fog bg-paper-white shadow-subtle-2">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-fog bg-mist/60 text-xs uppercase tracking-[0.06em] text-ash">
            <tr>
              <th className="px-4 py-3 font-medium">Merchant</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Billing</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Next / grace</th>
              <th className="px-4 py-3 font-medium">MRR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fog">
            {rows.map((m) => (
              <tr
                key={m.id}
                className="cursor-pointer hover:bg-mist"
                onClick={() => onOpenMerchant(m.id)}
              >
                <td className="px-4 py-3 font-medium text-carbon">
                  {m.businessName}
                </td>
                <td className="px-4 py-3 text-graphite">
                  {PLAN_LABELS[m.subscription.plan]}
                </td>
                <td className="px-4 py-3 capitalize text-graphite">
                  {m.subscription.status.replace('_', ' ')}
                </td>
                <td className="px-4 py-3">
                  <MerchantStatusBadge status={m.status} />
                </td>
                <td className="px-4 py-3 text-graphite">
                  {m.subscription.graceEndsAt
                    ? `Grace ${formatDate(m.subscription.graceEndsAt)}`
                    : formatDate(m.subscription.nextBillingDate)}
                </td>
                <td className="px-4 py-3 tabular-nums">{formatRM(m.mrr)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ash">
                  No accounts in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
