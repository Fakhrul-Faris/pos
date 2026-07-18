'use client'

import { useMemo, useState } from 'react'
import { useAdminStore } from '@/data/store'
import { formatDate, formatRM } from '@/data/mock'
import type { MerchantStatus, PlanTier } from '@/data/types'
import { PLAN_LABELS } from '@/data/types'
import { MerchantStatusBadge } from '../StatusBadge'
import { IconSearch } from '../icons'

type Props = {
  onOpenMerchant: (id: string) => void
}

export function Merchants({ onOpenMerchant }: Props) {
  const { merchants } = useAdminStore()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<MerchantStatus | 'all'>('all')
  const [plan, setPlan] = useState<PlanTier | 'all'>('all')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return merchants.filter((m) => {
      if (status !== 'all' && m.status !== status) return false
      if (plan !== 'all' && m.plan !== plan) return false
      if (!query) return true
      return (
        m.businessName.toLowerCase().includes(query) ||
        m.ownerEmail.toLowerCase().includes(query) ||
        m.ownerName.toLowerCase().includes(query)
      )
    })
  }, [merchants, q, status, plan])

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-ui text-carbon">Merchants</h1>
          <p className="mt-1 text-sm text-graphite">
            {filtered.length} of {merchants.length} accounts
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, owner, email"
            className="w-full rounded-lg border border-fog bg-paper-white py-2 pl-9 pr-3 text-sm outline-none focus:border-lavender"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as MerchantStatus | 'all')}
          className="rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm outline-none"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspension_pending">Suspension pending</option>
          <option value="suspended">Suspended</option>
          <option value="churned">Churned</option>
        </select>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value as PlanTier | 'all')}
          className="rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm outline-none"
        >
          <option value="all">All plans</option>
          {(Object.keys(PLAN_LABELS) as PlanTier[]).map((p) => (
            <option key={p} value={p}>
              {PLAN_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-fog bg-paper-white shadow-subtle-2">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-fog bg-mist/60 text-xs uppercase tracking-[0.06em] text-ash">
            <tr>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">MRR</th>
              <th className="px-4 py-3 font-medium">Signup</th>
              <th className="px-4 py-3 font-medium">Last active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fog">
            {filtered.map((m) => (
              <tr
                key={m.id}
                className="cursor-pointer hover:bg-mist"
                onClick={() => onOpenMerchant(m.id)}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-carbon">{m.businessName}</p>
                  <p className="text-xs text-ash">
                    {m.ownerName} · {m.vertical}
                  </p>
                </td>
                <td className="px-4 py-3 text-graphite">{PLAN_LABELS[m.plan]}</td>
                <td className="px-4 py-3">
                  <MerchantStatusBadge status={m.status} />
                </td>
                <td className="px-4 py-3 tabular-nums text-graphite">
                  {formatRM(m.mrr)}
                </td>
                <td className="px-4 py-3 text-graphite">{formatDate(m.signupDate)}</td>
                <td className="px-4 py-3 text-graphite">{formatDate(m.lastActive)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ash">
                  No merchants match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
