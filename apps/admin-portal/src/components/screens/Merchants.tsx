'use client'

import { useMemo, useState } from 'react'
import { useAdminStore } from '@/data/store'
import { formatDate, formatRM, orgMrr, primaryBrand, primaryOwner } from '@/data/mock'
import type { MerchantStatus, PlanTier } from '@/data/types'
import { PLAN_LABELS } from '@/data/types'
import { MerchantStatusBadge } from '../StatusBadge'
import { IconSearch } from '../icons'
import { EmptyRow, Table, TBody, TD, TH, THead, TR } from '../ui/Table'

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
      if (plan !== 'all' && !m.brands.some((b) => b.subscription.plan === plan)) {
        return false
      }
      if (!query) return true
      const owner = primaryOwner(m)
      return (
        m.businessName.toLowerCase().includes(query) ||
        m.brands.some((b) => b.name.toLowerCase().includes(query)) ||
        (owner?.email ?? '').toLowerCase().includes(query) ||
        (owner?.name ?? '').toLowerCase().includes(query)
      )
    })
  }, [merchants, q, status, plan])

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="page-title">Merchants</h1>
        <p className="page-desc">
          {filtered.length} of {merchants.length} organizations
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-900" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search org, brand, owner, email"
            className="geist-input pl-8"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as MerchantStatus | 'all')}
          className="geist-input w-auto"
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
          className="geist-input w-auto"
        >
          <option value="all">All plans</option>
          {(Object.keys(PLAN_LABELS) as PlanTier[]).map((p) => (
            <option key={p} value={p}>
              {PLAN_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      <Table>
        <THead>
          <tr>
            <TH>Organization</TH>
            <TH>Primary plan</TH>
            <TH>Status</TH>
            <TH>MRR</TH>
            <TH>Signup</TH>
            <TH>Last active</TH>
          </tr>
        </THead>
        <TBody>
          {filtered.map((m) => {
            const owner = primaryOwner(m)
            const brand = primaryBrand(m)
            const brandSummary =
              m.brands.length === 1
                ? m.brands[0].name
                : `${m.brands.length} brands`
            return (
              <TR key={m.id} onClick={() => onOpenMerchant(m.id)}>
                <TD>
                  <p className="font-medium text-gray-1000">{m.businessName}</p>
                  <p className="text-[11px] text-gray-900">
                    {owner?.name ?? '-'} · {brandSummary} · {m.vertical}
                  </p>
                </TD>
                <TD muted>
                  {brand ? PLAN_LABELS[brand.subscription.plan] : '-'}
                  {m.brands.length > 1 && (
                    <span className="text-gray-900"> +{m.brands.length - 1}</span>
                  )}
                </TD>
                <TD>
                  <MerchantStatusBadge status={m.status} />
                </TD>
                <TD mono muted>
                  {formatRM(orgMrr(m))}
                </TD>
                <TD muted>{formatDate(m.signupDate)}</TD>
                <TD muted>{formatDate(m.lastActive)}</TD>
              </TR>
            )
          })}
          {filtered.length === 0 && (
            <EmptyRow colSpan={6} text="No merchants match." />
          )}
        </TBody>
      </Table>
    </div>
  )
}
