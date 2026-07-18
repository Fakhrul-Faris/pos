'use client'

import { useMemo, useState } from 'react'
import { useAdminStore } from '@/data/store'
import { formatDateTime, formatRM, merchantName } from '@/data/mock'
import { FlagBadge } from '../StatusBadge'

type Props = {
  onOpenMerchant: (id: string) => void
}

export function Transactions({ onOpenMerchant }: Props) {
  const store = useAdminStore()
  const [tab, setTab] = useState<'flagged' | 'all'>('flagged')

  const rows = useMemo(() => {
    if (tab === 'flagged') {
      return store.transactions.filter((t) => t.status === 'flagged')
    }
    return store.transactions
  }, [store.transactions, tab])

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-ui text-carbon">
          Transactions
        </h1>
        <p className="mt-1 text-sm text-graphite">
          HitPay detects anomalies. This queue is for triage — review or suspend
          the merchant. No analytics charts.
        </p>
      </header>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('flagged')}
          className={[
            'rounded-full px-3 py-1.5 text-xs font-medium',
            tab === 'flagged'
              ? 'bg-carbon text-paper-white'
              : 'bg-mist text-graphite',
          ].join(' ')}
        >
          Flagged (
          {store.transactions.filter((t) => t.status === 'flagged').length})
        </button>
        <button
          type="button"
          onClick={() => setTab('all')}
          className={[
            'rounded-full px-3 py-1.5 text-xs font-medium',
            tab === 'all' ? 'bg-carbon text-paper-white' : 'bg-mist text-graphite',
          ].join(' ')}
        >
          All
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-fog bg-paper-white shadow-subtle-2">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-fog bg-mist/60 text-xs uppercase tracking-[0.06em] text-ash">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Merchant</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Surcharge</th>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fog">
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-medium text-carbon">{t.id}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onOpenMerchant(t.merchantId)}
                    className="text-lavender hover:underline"
                  >
                    {merchantName(store.merchants, t.merchantId)}
                  </button>
                </td>
                <td className="px-4 py-3 tabular-nums">{formatRM(t.amount)}</td>
                <td className="px-4 py-3 tabular-nums text-graphite">
                  {formatRM(t.surcharge)}
                </td>
                <td className="px-4 py-3 text-xs text-ash">
                  {formatDateTime(t.timestamp)}
                </td>
                <td className="px-4 py-3">
                  {t.status === 'flagged' ? (
                    <FlagBadge />
                  ) : (
                    <span className="text-xs capitalize text-ash">{t.status}</span>
                  )}
                  {t.hitpayFlagReason && (
                    <p className="mt-1 max-w-[220px] text-xs text-ash">
                      {t.hitpayFlagReason}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {t.status === 'flagged' && (
                      <>
                        <button
                          type="button"
                          className="rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-graphite"
                          onClick={() => store.reviewFlaggedTx(t.id)}
                        >
                          Mark reviewed
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-ember px-2.5 py-1 text-xs font-medium text-paper-white"
                          onClick={() => {
                            store.suspendMerchant(
                              t.merchantId,
                              `Suspended from flagged tx ${t.id}`,
                            )
                            store.reviewFlaggedTx(t.id)
                          }}
                        >
                          Suspend merchant
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ash">
                  No transactions in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
