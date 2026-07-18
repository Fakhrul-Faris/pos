'use client'

import { useState } from 'react'
import { useAdminStore } from '@/data/store'
import { formatDateTime, formatRM, merchantName } from '@/data/mock'
import type { ReasonCode } from '@/data/types'
import { REASON_CODE_LABELS } from '@/data/types'
import { DualStatusBadge } from '../StatusBadge'

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
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-ui text-carbon">
            Reconciliation
          </h1>
          <p className="mt-1 text-sm text-graphite">
            HitPay balance vs amounts owed. Settlement still runs outside the
            system (manual DuitNow). Overrides need dual approval + reason code.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>
          Request payout override
        </button>
      </header>

      <div className="grid grid-cols-4 gap-3">
        {[
          ['HitPay collected', totals.hitpay],
          ['Surcharge revenue', totals.surcharge],
          ['Owed to merchants', totals.owed],
          ['Actually settled', totals.settled],
        ].map(([label, value]) => (
          <div
            key={label as string}
            className="rounded-xl border border-fog bg-paper-white p-4 shadow-subtle-2"
          >
            <p className="text-xs uppercase tracking-[0.08em] text-ash">{label}</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-carbon">
              {formatRM(value as number)}
            </p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="rounded-xl border border-fog bg-paper-white p-5 shadow-subtle-2">
          <h2 className="text-sm font-semibold text-carbon">Payout override</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-xs text-ash">
              Merchant
              <select
                value={form.merchantId}
                onChange={(e) => setForm({ ...form, merchantId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm"
              >
                {store.merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.businessName}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-ash">
              Period
              <input
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-ash">
              Amount (RM)
              <input
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-ash">
              Reason code
              <select
                value={form.reasonCode}
                onChange={(e) =>
                  setForm({ ...form, reasonCode: e.target.value as ReasonCode })
                }
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm"
              >
                {(Object.keys(REASON_CODE_LABELS) as ReasonCode[]).map((c) => (
                  <option key={c} value={c}>
                    {REASON_CODE_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
            {form.reasonCode === 'other' && (
              <label className="col-span-2 text-xs text-ash">
                Note (required)
                <input
                  value={form.reasonCodeNote}
                  onChange={(e) =>
                    setForm({ ...form, reasonCodeNote: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm"
                />
              </label>
            )}
            <label className="col-span-2 text-xs text-ash">
              Notes
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm"
              />
            </label>
          </div>
          {error && <p className="mt-2 text-xs text-ember">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="btn-primary"
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
              Submit (counts as first approval)
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-fog bg-paper-white shadow-subtle-2">
        <div className="border-b border-fog px-4 py-3">
          <h2 className="text-sm font-semibold text-carbon">Per-merchant period</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-fog bg-mist/60 text-xs uppercase tracking-[0.06em] text-ash">
            <tr>
              <th className="px-4 py-3 font-medium">Merchant</th>
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">HitPay</th>
              <th className="px-4 py-3 font-medium">Surcharge</th>
              <th className="px-4 py-3 font-medium">Owed</th>
              <th className="px-4 py-3 font-medium">Settled</th>
              <th className="px-4 py-3 font-medium">Gap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fog">
            {store.reconciliation.map((r) => {
              const gap = r.owedToMerchant - r.settledAmount
              return (
                <tr key={`${r.merchantId}-${r.period}`}>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onOpenMerchant(r.merchantId)}
                      className="font-medium text-lavender hover:underline"
                    >
                      {merchantName(store.merchants, r.merchantId)}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-ash">{r.period}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatRM(r.hitpayCollected)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatRM(r.surchargeRevenue)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatRM(r.owedToMerchant)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatRM(r.settledAmount)}
                  </td>
                  <td
                    className={[
                      'px-4 py-3 tabular-nums font-medium',
                      gap > 0 ? 'text-ember' : 'text-mint',
                    ].join(' ')}
                  >
                    {formatRM(gap)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <section className="overflow-hidden rounded-xl border border-fog bg-paper-white shadow-subtle-2">
        <div className="border-b border-fog px-4 py-3">
          <h2 className="text-sm font-semibold text-carbon">
            Payout override queue
          </h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-fog bg-mist/60 text-xs uppercase tracking-[0.06em] text-ash">
            <tr>
              <th className="px-4 py-3 font-medium">Merchant</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Logged</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fog">
            {store.payoutOverrides.map((p) => {
              const canApprove =
                (p.status === 'pending_second' || p.status === 'pending_first') &&
                store.currentAdmin &&
                p.loggedBy !== store.currentAdmin.id &&
                p.firstApprover !== store.currentAdmin.id
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onOpenMerchant(p.merchantId)}
                      className="font-medium text-lavender hover:underline"
                    >
                      {merchantName(store.merchants, p.merchantId)}
                    </button>
                    <p className="text-xs text-ash">{p.period}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatRM(p.amount)}</td>
                  <td className="px-4 py-3">
                    <DualStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-ash">
                    {p.loggedBy} · {formatDateTime(p.loggedAt)}
                  </td>
                  <td className="px-4 py-3">
                    {canApprove ? (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          className="rounded-full bg-mint px-2.5 py-1 text-xs font-medium text-paper-white"
                          onClick={() => store.approvePayoutOverride(p.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-ember px-2.5 py-1 text-xs font-medium text-paper-white"
                          onClick={() => {
                            const reason = window.prompt('Reject reason?')
                            if (reason) store.rejectPayoutOverride(p.id, reason)
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : p.status === 'pending_second' || p.status === 'pending_first' ? (
                      <span className="text-xs text-ash">Waiting for another admin</span>
                    ) : null}
                  </td>
                </tr>
              )
            })}
            {store.payoutOverrides.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ash">
                  No payout overrides.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
