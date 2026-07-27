'use client'

import { useMemo, useState } from 'react'
import { useAdminStore } from '@/data/store'
import {
  financeContextLabel,
  formatDateTime,
  formatRM,
  merchantName,
} from '@/data/mock'
import { FlagBadge } from '../StatusBadge'
import { Chip } from '../ui/Badge'
import { Button } from '../ui/Button'
import { EmptyRow, Table, TBody, TD, TH, THead, TR } from '../ui/Table'

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

  const flaggedCount = store.transactions.filter((t) => t.status === 'flagged').length

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="page-title">Transactions</h1>
        <p className="page-desc">
          HitPay detects anomalies. Triage here — mark reviewed, or open the
          organization hub to suspend manually. No auto-suspend.
        </p>
      </header>

      <div className="flex gap-1">
        <Chip active={tab === 'flagged'} onClick={() => setTab('flagged')}>
          Flagged ({flaggedCount})
        </Chip>
        <Chip active={tab === 'all'} onClick={() => setTab('all')}>
          All
        </Chip>
      </div>

      <Table>
        <THead>
          <tr>
            <TH>ID</TH>
            <TH>Organization</TH>
            <TH>Outlet</TH>
            <TH>Amount</TH>
            <TH>Surcharge</TH>
            <TH>Settlement</TH>
            <TH>When</TH>
            <TH>Status</TH>
            <TH>Actions</TH>
          </tr>
        </THead>
        <TBody>
          {rows.map((t) => {
            const ctx = financeContextLabel(
              store.merchants,
              t.merchantId,
              t.brandId,
              t.branchId,
            )
            return (
              <TR key={t.id}>
                <TD>
                  <span className="font-mono text-[12px] text-gray-1000">{t.id}</span>
                </TD>
                <TD>
                  <button
                    type="button"
                    onClick={() => onOpenMerchant(t.merchantId)}
                    className="text-blue-900 hover:underline"
                  >
                    {merchantName(store.merchants, t.merchantId)}
                  </button>
                </TD>
                <TD muted className="text-[11px]">
                  {ctx ?? '-'}
                </TD>
                <TD mono>{formatRM(t.amount)}</TD>
                <TD mono muted>
                  {formatRM(t.surcharge)}
                </TD>
                <TD mono muted>
                  {formatRM(t.settlementAmount)}
                </TD>
                <TD muted className="whitespace-nowrap text-[11px]">
                  {formatDateTime(t.timestamp)}
                </TD>
                <TD>
                  {t.status === 'flagged' ? (
                    <FlagBadge />
                  ) : (
                    <span className="text-[11px] capitalize text-gray-900">
                      {t.status}
                    </span>
                  )}
                  {t.hitpayFlagReason && (
                    <p className="mt-0.5 max-w-[200px] text-[11px] text-gray-900">
                      {t.hitpayFlagReason}
                    </p>
                  )}
                </TD>
                <TD>
                  {t.status === 'flagged' && (
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => store.reviewFlaggedTx(t.id)}
                      >
                        Mark reviewed
                      </Button>
                      <Button
                        size="small"
                        variant="error"
                        onClick={() => onOpenMerchant(t.merchantId)}
                      >
                        Open org
                      </Button>
                    </div>
                  )}
                </TD>
              </TR>
            )
          })}
          {rows.length === 0 && (
            <EmptyRow colSpan={9} text="No transactions in this view." />
          )}
        </TBody>
      </Table>
    </div>
  )
}
