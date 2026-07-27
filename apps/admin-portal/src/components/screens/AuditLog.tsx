'use client'

import { useMemo, useState } from 'react'
import { useAdminStore } from '@/data/store'
import { formatDateTime, merchantName, ADMINS } from '@/data/mock'
import type { AuditActionType, AdminId } from '@/data/types'
import { REASON_CODE_LABELS } from '@/data/types'
import { Badge } from '../ui/Badge'
import { EmptyRow, Table, TBody, TD, TH, THead, TR } from '../ui/Table'
import { IconSearch } from '../icons'

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
  merchant_suspended: 'Organization suspended',
  merchant_reactivated: 'Organization reactivated',
  note_added: 'Note added',
  flagged_reviewed: 'Flagged tx reviewed',
  support_status_updated: 'Support status updated',
  support_priority_updated: 'Support priority updated',
  support_note_added: 'Support notes updated',
  experiment_created: 'Experiment created (deferred)',
  experiment_concluded: 'Experiment concluded (deferred)',
  post_logged: 'Post logged (deferred)',
  post_updated: 'Post updated (deferred)',
  login: 'Login',
}

const MONEY_ACTIONS: AuditActionType[] = [
  'refund_logged',
  'refund_approved',
  'refund_rejected',
  'refund_processed',
  'payout_override_requested',
  'payout_override_approved',
  'payout_override_rejected',
  'subscription_extended',
  'subscription_waived',
]

export function AuditLog({ onOpenMerchant }: Props) {
  const { audit, merchants } = useAdminStore()
  const [adminFilter, setAdminFilter] = useState<AdminId | 'all'>('all')
  const [actionFilter, setActionFilter] = useState<
    AuditActionType | 'all' | 'money'
  >('all')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return audit.filter((e) => {
      if (adminFilter !== 'all' && e.adminId !== adminFilter) return false
      if (actionFilter === 'money' && !MONEY_ACTIONS.includes(e.action)) return false
      if (
        actionFilter !== 'all' &&
        actionFilter !== 'money' &&
        e.action !== actionFilter
      ) {
        return false
      }
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
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="page-title">Audit Log</h1>
        <p className="page-desc">
          Who did what, when, and why. Product audit — not Mendix internals.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-900" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search detail, organization, admin…"
            className="geist-input pl-8"
          />
        </div>
        <select
          value={adminFilter}
          onChange={(e) => setAdminFilter(e.target.value as AdminId | 'all')}
          className="geist-input w-auto"
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
            setActionFilter(e.target.value as AuditActionType | 'all' | 'money')
          }
          className="geist-input w-auto"
        >
          <option value="all">All actions</option>
          <option value="money">Money actions only</option>
          {(Object.keys(ACTION_LABELS) as AuditActionType[]).map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a]}
            </option>
          ))}
        </select>
      </div>

      <Table>
        <THead>
          <tr>
            <TH>When</TH>
            <TH>Admin</TH>
            <TH>Action</TH>
            <TH>Organization</TH>
            <TH>Detail</TH>
          </tr>
        </THead>
        <TBody>
          {rows.map((e) => (
            <TR key={e.id}>
              <TD muted>
                <span className="whitespace-nowrap text-[11px]">
                  {formatDateTime(e.at)}
                </span>
              </TD>
              <TD muted>{e.adminName}</TD>
              <TD>
                <Badge tone="gray">{ACTION_LABELS[e.action]}</Badge>
                {e.reasonCode && (
                  <p className="mt-1 text-[11px] text-gray-900">
                    {REASON_CODE_LABELS[e.reasonCode]}
                    {e.reasonNote ? ` — ${e.reasonNote}` : ''}
                  </p>
                )}
              </TD>
              <TD>
                {e.merchantId ? (
                  <button
                    type="button"
                    onClick={() => onOpenMerchant(e.merchantId!)}
                    className="text-blue-900 hover:underline"
                  >
                    {merchantName(merchants, e.merchantId)}
                  </button>
                ) : (
                  <span className="text-gray-900">-</span>
                )}
              </TD>
              <TD>
                <span className="text-gray-1000">{e.detail}</span>
                {(e.before || e.after) && (
                  <span className="mt-0.5 block text-[11px] text-gray-900">
                    {e.before ?? '-'} → {e.after ?? '-'}
                  </span>
                )}
              </TD>
            </TR>
          ))}
          {rows.length === 0 && (
            <EmptyRow colSpan={5} text="No audit entries match." />
          )}
        </TBody>
      </Table>
    </div>
  )
}
