'use client'

import { useMemo, useState } from 'react'
import { useAdminStore } from '@/data/store'
import {
  formatDate,
  formatDateTime,
  formatRM,
} from '@/data/mock'
import type { AdminScreen } from '@/data/types'
import { PLAN_LABELS } from '@/data/types'
import { MerchantStatusBadge, RefundStatusBadge, FlagBadge } from '../StatusBadge'

type Props = {
  merchantId: string
  onBack: () => void
  onNavigate: (screen: AdminScreen) => void
}

export function MerchantDetail({ merchantId, onBack, onNavigate }: Props) {
  const store = useAdminStore()
  const merchant = store.merchants.find((m) => m.id === merchantId)
  const [note, setNote] = useState('')
  const [actionNote, setActionNote] = useState('')
  const [extendDays, setExtendDays] = useState(7)

  const txs = useMemo(
    () => store.transactions.filter((t) => t.merchantId === merchantId),
    [store.transactions, merchantId],
  )
  const refunds = useMemo(
    () => store.refunds.filter((r) => r.merchantId === merchantId),
    [store.refunds, merchantId],
  )

  if (!merchant) {
    return (
      <div>
        <button type="button" onClick={onBack} className="text-sm text-lavender">
          ← Merchants
        </button>
        <p className="mt-4 text-sm text-ash">Merchant not found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="w-fit text-sm text-lavender hover:underline"
      >
        ← Merchants
      </button>

      <div className="grid grid-cols-[1fr_280px] gap-5">
        <div className="flex flex-col gap-5">
          <header className="rounded-xl border border-fog bg-paper-white p-5 shadow-subtle-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-ui text-carbon">
                  {merchant.businessName}
                </h1>
                <p className="mt-1 text-sm text-graphite">
                  {merchant.ownerName} · {merchant.ownerEmail}
                </p>
                <p className="mt-1 text-xs text-ash">
                  {merchant.vertical} · signed up {formatDate(merchant.signupDate)} ·{' '}
                  {merchant.outlets} outlet{merchant.outlets === 1 ? '' : 's'}
                </p>
              </div>
              <MerchantStatusBadge status={merchant.status} />
            </div>
          </header>

          <section className="rounded-xl border border-fog bg-paper-white p-5 shadow-subtle-2">
            <h2 className="text-sm font-semibold text-carbon">Subscription</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-ash">Plan</dt>
                <dd className="font-medium text-carbon">
                  {PLAN_LABELS[merchant.subscription.plan]}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ash">Billing status</dt>
                <dd className="font-medium capitalize text-carbon">
                  {merchant.subscription.status.replace('_', ' ')}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ash">Next billing</dt>
                <dd className="text-graphite">
                  {formatDate(merchant.subscription.nextBillingDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ash">Last payment</dt>
                <dd className="text-graphite">
                  {merchant.subscription.lastPaymentDate
                    ? `${formatDate(merchant.subscription.lastPaymentDate)} · ${formatRM(merchant.subscription.lastPaymentAmount ?? 0)}`
                    : '—'}
                </dd>
              </div>
              {merchant.subscription.graceEndsAt && (
                <div className="col-span-2 rounded-lg bg-[#fff4e0] px-3 py-2 text-amber">
                  Grace period ends {formatDate(merchant.subscription.graceEndsAt)}
                </div>
              )}
            </dl>

            <div className="mt-4 overflow-hidden rounded-lg border border-fog">
              <table className="w-full text-left text-xs">
                <thead className="bg-mist text-ash">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fog">
                  {merchant.subscription.paymentHistory.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 text-graphite">{formatDate(p.date)}</td>
                      <td className="px-3 py-2 tabular-nums">{formatRM(p.amount)}</td>
                      <td className="px-3 py-2 capitalize text-graphite">{p.status}</td>
                    </tr>
                  ))}
                  {merchant.subscription.paymentHistory.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-ash">
                        No payment history
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-fog bg-paper-white p-5 shadow-subtle-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-carbon">Transactions</h2>
              <button
                type="button"
                onClick={() => onNavigate('transactions')}
                className="text-xs text-lavender hover:underline"
              >
                Open queue
              </button>
            </div>
            <ul className="mt-3 divide-y divide-fog">
              {txs.slice(0, 5).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-carbon">
                      {t.id} · {formatRM(t.amount)}
                    </p>
                    <p className="text-xs text-ash">{formatDateTime(t.timestamp)}</p>
                  </div>
                  {t.status === 'flagged' ? (
                    <FlagBadge />
                  ) : (
                    <span className="text-xs capitalize text-ash">{t.status}</span>
                  )}
                </li>
              ))}
              {txs.length === 0 && (
                <li className="py-4 text-center text-sm text-ash">No transactions</li>
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-fog bg-paper-white p-5 shadow-subtle-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-carbon">Refunds</h2>
              <button
                type="button"
                onClick={() => onNavigate('refunds')}
                className="text-xs text-lavender hover:underline"
              >
                Open refunds
              </button>
            </div>
            <ul className="mt-3 divide-y divide-fog">
              {refunds.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-carbon">
                      {r.receiptId} · {formatRM(r.amount)}
                    </p>
                    <p className="text-xs text-ash">{r.reason}</p>
                  </div>
                  <RefundStatusBadge status={r.status} />
                </li>
              ))}
              {refunds.length === 0 && (
                <li className="py-4 text-center text-sm text-ash">No refunds</li>
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-fog bg-paper-white p-5 shadow-subtle-2">
            <h2 className="text-sm font-semibold text-carbon">Internal notes</h2>
            <div className="mt-3 flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note…"
                className="flex-1 rounded-lg border border-fog px-3 py-2 text-sm outline-none focus:border-lavender"
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  store.addNote(merchant.id, note)
                  setNote('')
                }}
              >
                Add
              </button>
            </div>
            <ul className="mt-4 divide-y divide-fog">
              {merchant.notes.map((n) => (
                <li key={n.id} className="py-3">
                  <p className="text-sm text-carbon">{n.body}</p>
                  <p className="mt-1 text-xs text-ash">
                    {n.adminName} · {formatDateTime(n.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-fog bg-carbon p-4 text-paper-white shadow-panel">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/45">
              Summary
            </p>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-white/55">MRR</dt>
                <dd className="tabular-nums font-medium">{formatRM(merchant.mrr)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/55">Bookings / mo</dt>
                <dd className="tabular-nums font-medium">{merchant.bookingsThisMonth}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/55">Bank</dt>
                <dd className="font-medium">{merchant.bankAccountMasked}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/55">Last active</dt>
                <dd className="font-medium">{formatDate(merchant.lastActive)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-fog bg-paper-white p-4 shadow-subtle-2">
            <h3 className="text-sm font-semibold text-carbon">Admin actions</h3>
            <textarea
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder="Optional note for action…"
              rows={2}
              className="mt-3 w-full rounded-lg border border-fog px-3 py-2 text-sm outline-none focus:border-lavender"
            />

            {(merchant.status === 'suspension_pending' ||
              merchant.subscription.status === 'past_due') && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={extendDays}
                    onChange={(e) => setExtendDays(Number(e.target.value) || 7)}
                    className="w-16 rounded-lg border border-fog px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    className="btn-ghost flex-1"
                    onClick={() => {
                      store.extendSubscription(
                        merchant.id,
                        extendDays,
                        actionNote || `Extended ${extendDays} days`,
                      )
                      setActionNote('')
                    }}
                  >
                    Extend trial/grace
                  </button>
                </div>
                <button
                  type="button"
                  className="btn-ghost w-full"
                  onClick={() => {
                    store.waiveSubscription(
                      merchant.id,
                      actionNote || 'Waived subscription payment',
                    )
                    setActionNote('')
                  }}
                >
                  Waive payment
                </button>
              </div>
            )}

            {merchant.status !== 'suspended' ? (
              <button
                type="button"
                className="mt-3 w-full rounded-full bg-ember px-4 py-2.5 text-sm font-medium text-paper-white shadow-btn"
                onClick={() => {
                  store.suspendMerchant(merchant.id, actionNote || undefined)
                  setActionNote('')
                }}
              >
                Suspend merchant
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary mt-3 w-full"
                onClick={() => {
                  store.reactivateMerchant(merchant.id, actionNote || undefined)
                  setActionNote('')
                }}
              >
                Reactivate merchant
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
