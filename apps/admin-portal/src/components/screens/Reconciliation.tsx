'use client'

import { useState } from 'react'
import { useAdminStore } from '@/data/store'
import { formatDateTime, formatRM, merchantName, primaryOwner } from '@/data/mock'
import type { ReasonCode } from '@/data/types'
import { REASON_CODE_LABELS } from '@/data/types'
import { DualStatusBadge } from '../StatusBadge'
import { Button } from '../ui/Button'
import { EmptyRow, Table, TBody, TD, TH, THead, TR } from '../ui/Table'

type Props = {
  onOpenMerchant: (id: string) => void
}

export function Reconciliation({ onOpenMerchant }: Props) {
  const store = useAdminStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    merchantId: store.merchants[0]?.id ?? '',
    period: '2026-07-01 → 2026-07-15',
    amount: '',
    notes: '',
    reasonCode: 'platform_error' as ReasonCode,
    reasonCodeNote: '',
  })
  const [error, setError] = useState('')

  const totals = store.reconciliation.reduce(
    (acc, r) => ({
      hitpay: acc.hitpay + r.hitpayCollected,
      surcharge: acc.surcharge + r.surchargeRevenue,
      owed: acc.owed + r.owedToMerchant,
      settled: acc.settled + r.settledAmount,
    }),
    { hitpay: 0, surcharge: 0, owed: 0, settled: 0 },
  )

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Reconciliation</h1>
          <p className="page-desc">
            HitPay collected vs owed per organization. Settlement runs outside
            Miki — not platform Accounting / GL.
          </p>
        </div>
        <Button size="small" onClick={() => setShowForm(true)}>
          Request payout override
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          ['HitPay collected', totals.hitpay],
          ['Surcharge revenue', totals.surcharge],
          ['Owed to orgs', totals.owed],
          ['Actually settled', totals.settled],
        ].map(([label, value]) => (
          <div key={label as string} className="geist-panel p-3.5">
            <p className="text-[11px] font-medium text-gray-900">{label}</p>
            <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-gray-1000">
              {formatRM(value as number)}
            </p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="geist-panel p-4">
          <h2 className="text-[13px] font-semibold text-gray-1000">
            Payout override
          </h2>
          <p className="mt-1 text-[11px] text-gray-900">
            Dual approval. Targets organization payout (owner bank), not Brand
            SaaS.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-[11px] text-gray-900">
              Organization
              <select
                value={form.merchantId}
                onChange={(e) => setForm({ ...form, merchantId: e.target.value })}
                className="geist-input mt-1"
              >
                {store.merchants.map((m) => {
                  const owner = primaryOwner(m)
                  return (
                    <option key={m.id} value={m.id}>
                      {m.businessName}
                      {owner ? ` · ${owner.bankAccountMasked}` : ''}
                    </option>
                  )
                })}
              </select>
            </label>
            <label className="text-[11px] text-gray-900">
              Period
              <input
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                className="geist-input mt-1"
              />
            </label>
            <label className="text-[11px] text-gray-900">
              Amount (RM)
              <input
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="geist-input mt-1"
              />
            </label>
            <label className="text-[11px] text-gray-900">
              Reason code
              <select
                value={form.reasonCode}
                onChange={(e) =>
                  setForm({ ...form, reasonCode: e.target.value as ReasonCode })
                }
                className="geist-input mt-1"
              >
                {(Object.keys(REASON_CODE_LABELS) as ReasonCode[]).map((c) => (
                  <option key={c} value={c}>
                    {REASON_CODE_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
            {form.reasonCode === 'other' && (
              <label className="col-span-2 text-[11px] text-gray-900">
                Note (required)
                <input
                  value={form.reasonCodeNote}
                  onChange={(e) =>
                    setForm({ ...form, reasonCodeNote: e.target.value })
                  }
                  className="geist-input mt-1"
                />
              </label>
            )}
            <label className="col-span-2 text-[11px] text-gray-900">
              Notes
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="geist-input mt-1"
              />
            </label>
          </div>
          {error && <p className="mt-2 text-[11px] text-red-900">{error}</p>}
          <div className="mt-3 flex gap-2">
            <Button
              size="small"
              onClick={() => {
                const amount = Number(form.amount)
                if (!amount) {
                  setError('Amount required')
                  return
                }
                if (form.reasonCode === 'other' && !form.reasonCodeNote.trim()) {
                  setError('Note required for Other')
                  return
                }
                store.requestPayoutOverride({
                  merchantId: form.merchantId,
                  period: form.period,
                  amount,
                  notes: form.notes,
                  reasonCode: form.reasonCode,
                  reasonCodeNote: form.reasonCodeNote,
                })
                setShowForm(false)
                setError('')
              }}
            >
              Submit (first approval)
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <section>
        <div className="mb-2">
          <h2 className="text-[13px] font-semibold text-gray-1000">
            Per-organization period
          </h2>
          <p className="text-[11px] text-gray-900">
            Grain = Organization (payout bank). Brand breakdown deferred.
          </p>
        </div>
        <Table>
          <THead>
            <tr>
              <TH>Organization</TH>
              <TH>Period</TH>
              <TH>HitPay</TH>
              <TH>Surcharge</TH>
              <TH>Owed</TH>
              <TH>Settled</TH>
              <TH>Gap</TH>
            </tr>
          </THead>
          <TBody>
            {store.reconciliation.map((r) => {
              const gap = r.owedToMerchant - r.settledAmount
              const org = store.merchants.find((m) => m.id === r.merchantId)
              const owner = org ? primaryOwner(org) : undefined
              return (
                <TR key={`${r.merchantId}-${r.period}`}>
                  <TD>
                    <button
                      type="button"
                      onClick={() => onOpenMerchant(r.merchantId)}
                      className="font-medium text-blue-900 hover:underline"
                    >
                      {merchantName(store.merchants, r.merchantId)}
                    </button>
                    {owner && (
                      <p className="text-[11px] text-gray-900">
                        {owner.bankAccountMasked}
                      </p>
                    )}
                  </TD>
                  <TD muted>{r.period}</TD>
                  <TD mono muted>
                    {formatRM(r.hitpayCollected)}
                  </TD>
                  <TD mono muted>
                    {formatRM(r.surchargeRevenue)}
                  </TD>
                  <TD mono muted>
                    {formatRM(r.owedToMerchant)}
                  </TD>
                  <TD mono muted>
                    {formatRM(r.settledAmount)}
                  </TD>
                  <TD
                    mono
                    className={
                      gap > 0
                        ? 'font-medium text-red-900'
                        : 'font-medium text-green-900'
                    }
                  >
                    {formatRM(gap)}
                  </TD>
                </TR>
              )
            })}
          </TBody>
        </Table>
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold text-gray-1000">
          Payout override queue
        </h2>
        <Table>
          <THead>
            <tr>
              <TH>Organization</TH>
              <TH>Amount</TH>
              <TH>Status</TH>
              <TH>Logged</TH>
              <TH>Actions</TH>
            </tr>
          </THead>
          <TBody>
            {store.payoutOverrides.map((p) => {
              const canApprove =
                (p.status === 'pending_second' || p.status === 'pending_first') &&
                store.currentAdmin &&
                p.loggedBy !== store.currentAdmin.id &&
                p.firstApprover !== store.currentAdmin.id
              return (
                <TR key={p.id}>
                  <TD>
                    <button
                      type="button"
                      onClick={() => onOpenMerchant(p.merchantId)}
                      className="font-medium text-blue-900 hover:underline"
                    >
                      {merchantName(store.merchants, p.merchantId)}
                    </button>
                    <p className="text-[11px] text-gray-900">{p.period}</p>
                  </TD>
                  <TD mono muted>
                    {formatRM(p.amount)}
                  </TD>
                  <TD>
                    <DualStatusBadge status={p.status} />
                  </TD>
                  <TD muted>
                    <span className="text-[11px]">
                      {p.loggedBy} · {formatDateTime(p.loggedAt)}
                    </span>
                  </TD>
                  <TD>
                    {canApprove ? (
                      <div className="flex gap-1">
                        <Button
                          size="tiny"
                          variant="secondary"
                          className="!border-green-700 !text-green-900"
                          onClick={() => store.approvePayoutOverride(p.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="tiny"
                          variant="error"
                          onClick={() => {
                            const reason = window.prompt('Reject reason?')
                            if (reason) store.rejectPayoutOverride(p.id, reason)
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : p.status === 'pending_second' ||
                      p.status === 'pending_first' ? (
                      <span className="text-[11px] text-gray-900">
                        Waiting for another admin
                      </span>
                    ) : null}
                  </TD>
                </TR>
              )
            })}
            {store.payoutOverrides.length === 0 && (
              <EmptyRow colSpan={5} text="No payout overrides." />
            )}
          </TBody>
        </Table>
      </section>
    </div>
  )
}
