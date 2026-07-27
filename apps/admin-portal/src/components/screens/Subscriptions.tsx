'use client'

import { useMemo, useState } from 'react'
import { useAdminStore } from '@/data/store'
import { allBrandRows, formatDate, formatRM } from '@/data/mock'
import { PLAN_LABELS } from '@/data/types'
import { MerchantStatusBadge } from '../StatusBadge'
import { Chip } from '../ui/Badge'
import { EmptyRow, Table, TBody, TD, TH, THead, TR } from '../ui/Table'

type Props = {
  onOpenMerchant: (id: string) => void
}

export function Subscriptions({ onOpenMerchant }: Props) {
  const store = useAdminStore()
  const [tab, setTab] = useState<'attention' | 'all'>('attention')

  const rows = useMemo(() => allBrandRows(store.merchants), [store.merchants])

  const attention = useMemo(
    () =>
      rows.filter(
        ({ organization: m, brand: b }) =>
          m.status === 'suspension_pending' ||
          m.status === 'suspended' ||
          b.subscription.status === 'past_due',
      ),
    [rows],
  )

  const visible = tab === 'attention' ? attention : rows

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="page-title">Subscriptions & Suspensions</h1>
        <p className="page-desc">
          Brand-scoped billing. Open the organization to extend, waive, suspend, or
          reactivate.
        </p>
      </header>

      <div className="flex gap-1">
        <Chip active={tab === 'attention'} onClick={() => setTab('attention')}>
          Needs attention ({attention.length})
        </Chip>
        <Chip active={tab === 'all'} onClick={() => setTab('all')}>
          All brands
        </Chip>
      </div>

      <Table>
        <THead>
          <tr>
            <TH>Brand</TH>
            <TH>Organization</TH>
            <TH>Plan</TH>
            <TH>Billing</TH>
            <TH>Org status</TH>
            <TH>Next / grace</TH>
            <TH>MRR</TH>
          </tr>
        </THead>
        <TBody>
          {visible.map(({ organization: m, brand: b }) => (
            <TR key={b.id} onClick={() => onOpenMerchant(m.id)}>
              <TD>
                <span className="font-medium text-gray-1000">{b.name}</span>
              </TD>
              <TD muted>{m.businessName}</TD>
              <TD muted>{PLAN_LABELS[b.subscription.plan]}</TD>
              <TD muted className="capitalize">
                {b.subscription.status.replace('_', ' ')}
              </TD>
              <TD>
                <MerchantStatusBadge status={m.status} />
              </TD>
              <TD muted>
                {b.subscription.graceEndsAt
                  ? `Grace ${formatDate(b.subscription.graceEndsAt)}`
                  : formatDate(b.subscription.nextBillingDate)}
              </TD>
              <TD mono muted>
                {formatRM(b.mrr)}
              </TD>
            </TR>
          ))}
          {visible.length === 0 && (
            <EmptyRow colSpan={7} text="No brands in this view." />
          )}
        </TBody>
      </Table>
    </div>
  )
}
