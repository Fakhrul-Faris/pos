'use client'

import { useMemo, useState } from 'react'
import { useAdminStore } from '@/data/store'
import { formatDateTime, merchantName } from '@/data/mock'
import type { AuditActionType, AdminId } from '@/data/types'
import { ADMINS } from '@/data/mock'
import { REASON_CODE_LABELS } from '@/data/types'

type Props = {
  onOpenMerchant: (id: string) => void
}

const ACTION_LABELS: Record<AuditActionType, string> = {
  refund_logged: 'Refund logged',
  refund_approved: 'Refund approved',
  refund_rejected: 'Refund rejected',
  refund_processed: 'Refund processed',
  payout_override_requested: 'Payout override requested',
  payout_override_approved: 'Payout override approved',
  payout_override_rejected: 'Payout override rejected',
  subscription_extended: 'Subscription extended',
  subscription_waived: 'Subscription waived',
  merchant_suspended: 'Merchant suspended',
  merchant_reactivated: 'Merchant reactivated',
  note_added: 'Note added',
  flagged_reviewed: 'Flagged tx reviewed',
  experiment_created: 'Experiment created',
  experiment_concluded: 'Experiment concluded',
  post_logged: 'Post logged',
  post_updated: 'Post updated',
  login: 'Login',
}

export function AuditLog({ onOpenMerchant }: Props) {
  const { audit, merchants } = useAdminStore()
  const [adminFilter, setAdminFilter] = useState<AdminId | 'all'>('all')
  const [actionFilter, setActionFilter] = useState<AuditActionType | 'all'>('all')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return audit.filter((e) => {
      if (adminFilter !== 'all' && e.adminId !== adminFilter) return false
      if (actionFilter !== 'all' && e.action !== actionFilter) return false
      if (!query) return true
      const merchant = e.merchantId
        ? merchantName(merchants, e.merchantId).toLowerCase()
        : ''
      return (
        e.detail.toLowerCase().includes(query) ||
        merchant.includes(query) ||
        e.adminName.toLowerCase().includes(query)
      )
    })
  }, [audit, adminFilter, actionFilter, q, merchants])

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-ui text-carbon">Audit Log</h1>
        <p className="mt-1 text-sm text-graphite">
          Who did what, when, and why. Searchable table — enough for v1.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search detail, merchant, admin…"
          className="min-w-[220px] flex-1 rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm outline-none focus:border-lavender"
        />
        <select
          value={adminFilter}
          onChange={(e) => setAdminFilter(e.target.value as AdminId | 'all')}
          className="rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm"
        >
          <option value="all">All admins</option>
          {ADMINS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) =>
            setActionFilter(e.target.value as AuditActionType | 'all')
          }
          className="rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm"
        >
          <option value="all">All actions</option>
          {(Object.keys(ACTION_LABELS) as AuditActionType[]).map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-fog bg-paper-white shadow-subtle-2">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-fog bg-mist/60 text-xs uppercase tracking-[0.06em] text-ash">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Merchant</th>
              <th className="px-4 py-3 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fog">
            {rows.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 text-xs text-ash whitespace-nowrap">
                  {formatDateTime(e.at)}
                </td>
                <td className="px-4 py-3 text-graphite">{e.adminName}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-medium text-graphite">
                    {ACTION_LABELS[e.action]}
                  </span>
                  {e.reasonCode && (
                    <p className="mt-1 text-xs text-ash">
                      {REASON_CODE_LABELS[e.reasonCode]}
                      {e.reasonNote ? ` — ${e.reasonNote}` : ''}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {e.merchantId ? (
                    <button
                      type="button"
                      onClick={() => onOpenMerchant(e.merchantId!)}
                      className="text-lavender hover:underline"
                    >
                      {merchantName(merchants, e.merchantId)}
                    </button>
                  ) : (
                    <span className="text-ash">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-graphite">
                  {e.detail}
                  {(e.before || e.after) && (
                    <span className="mt-0.5 block text-xs text-ash">
                      {e.before ?? '—'} → {e.after ?? '—'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ash">
                  No audit entries match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
