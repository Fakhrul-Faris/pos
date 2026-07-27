'use client'

import { useMemo, useState } from 'react'
import { useAdminStore } from '@/data/store'
import {
  branchCount,
  formatDate,
  formatDateTime,
  formatRM,
  orgMrr,
  primaryOwner,
} from '@/data/mock'
import type { AdminScreen, Brand } from '@/data/types'
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
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)

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
        <button type="button" onClick={onBack} className="text-sm text-blue-900">
          ← Merchants
        </button>
        <p className="mt-4 text-sm text-gray-900">Merchant not found.</p>
      </div>
    )
  }

  const owner = primaryOwner(merchant)
  const branches = merchant.brands.flatMap((b) =>
    b.branches.map((bh) => ({ branch: bh, brand: b })),
  )
  const selectedBrand: Brand | undefined =
    merchant.brands.find((b) => b.id === selectedBrandId) ?? merchant.brands[0]
  const brandNeedsBilling =
    !!selectedBrand &&
    (selectedBrand.subscription.status === 'past_due' ||
      merchant.status === 'suspension_pending')

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="w-fit text-sm text-blue-900 hover:underline"
      >
        ← Merchants
      </button>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-4">
          <header className="geist-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="page-title">
                  {merchant.businessName}
                </h1>
                <p className="mt-1 text-sm text-gray-900">
                  {owner?.name ?? '-'} · {owner?.email ?? '-'}
                </p>
                <p className="mt-1 text-xs text-gray-900">
                  {merchant.vertical} · signed up {formatDate(merchant.signupDate)} ·{' '}
                  {merchant.brands.length} brand
                  {merchant.brands.length === 1 ? '' : 's'} · {branchCount(merchant)}{' '}
                  branch
                  {branchCount(merchant) === 1 ? '' : 'es'}
                </p>
              </div>
              <MerchantStatusBadge status={merchant.status} />
            </div>
          </header>

          <section className="geist-panel p-4">
            <h2 className="text-sm font-semibold text-gray-1000">Brands</h2>
            <p className="mt-1 text-xs text-gray-900">
              Billing lives on Brand. Select a brand to extend, waive, or review payments.
            </p>
            <ul className="mt-3 divide-y divide-gray-400">
              {merchant.brands.map((b) => {
                const active = selectedBrand?.id === b.id
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedBrandId(b.id)}
                      className={[
                        'flex w-full items-center justify-between gap-3 py-3 text-left',
                        active ? 'opacity-100' : 'opacity-80 hover:opacity-100',
                      ].join(' ')}
                    >
                      <div>
                        <p className="font-medium text-gray-1000">{b.name}</p>
                        <p className="text-xs text-gray-900">
                          {PLAN_LABELS[b.subscription.plan]} ·{' '}
                          {b.subscription.status.replace('_', ' ')} ·{' '}
                          {b.branches.length} branch
                          {b.branches.length === 1 ? '' : 'es'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="tabular-nums text-sm font-medium text-gray-1000">
                          {formatRM(b.mrr)}
                        </p>
                        {b.subscription.graceEndsAt && (
                          <p className="text-xs text-amber-900">
                            Grace {formatDate(b.subscription.graceEndsAt)}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          {selectedBrand && (
            <section className="geist-panel p-4">
              <h2 className="text-sm font-semibold text-gray-1000">
                Brand billing · {selectedBrand.name}
              </h2>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-gray-900">Plan</dt>
                  <dd className="font-medium text-gray-1000">
                    {PLAN_LABELS[selectedBrand.subscription.plan]}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-900">Billing status</dt>
                  <dd className="font-medium capitalize text-gray-1000">
                    {selectedBrand.subscription.status.replace('_', ' ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-900">Next billing</dt>
                  <dd className="text-gray-900">
                    {formatDate(selectedBrand.subscription.nextBillingDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-900">Last payment</dt>
                  <dd className="text-gray-900">
                    {selectedBrand.subscription.lastPaymentDate
                      ? `${formatDate(selectedBrand.subscription.lastPaymentDate)} · ${formatRM(selectedBrand.subscription.lastPaymentAmount ?? 0)}`
                      : '-'}
                  </dd>
                </div>
                {selectedBrand.subscription.graceEndsAt && (
                  <div className="col-span-2 rounded-lg bg-amber-100 px-3 py-2 text-amber-900">
                    Grace period ends{' '}
                    {formatDate(selectedBrand.subscription.graceEndsAt)}
                  </div>
                )}
              </dl>

              <div className="mt-4 overflow-hidden rounded-[6px] border border-gray-400">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-200 text-gray-900">
                    <tr>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Amount</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-400">
                    {selectedBrand.subscription.paymentHistory.map((p) => (
                      <tr key={p.id}>
                        <td className="px-3 py-2 text-gray-900">
                          {formatDate(p.date)}
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {formatRM(p.amount)}
                        </td>
                        <td className="px-3 py-2 capitalize text-gray-900">
                          {p.status}
                        </td>
                      </tr>
                    ))}
                    {selectedBrand.subscription.paymentHistory.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-gray-900">
                          No payment history
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {brandNeedsBilling && (
                <div className="mt-4 space-y-2 border-t border-gray-400 pt-4">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-gray-900">
                    Billing actions (this brand)
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={extendDays}
                      onChange={(e) => setExtendDays(Number(e.target.value) || 7)}
                      className="w-16 rounded-[6px] border border-gray-400 px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => {
                        store.extendSubscription(
                          merchant.id,
                          selectedBrand.id,
                          extendDays,
                          actionNote || `Extended ${extendDays} days`,
                        )
                        setActionNote('')
                      }}
                    >
                      Extend trial/grace
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => {
                        store.waiveSubscription(
                          merchant.id,
                          selectedBrand.id,
                          actionNote || 'Waived subscription payment',
                        )
                        setActionNote('')
                      }}
                    >
                      Waive payment
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="geist-panel p-4">
            <h2 className="text-sm font-semibold text-gray-1000">Branches</h2>
            <ul className="mt-3 divide-y divide-gray-400">
              {branches.map(({ branch, brand }) => (
                <li
                  key={branch.id}
                  className="flex items-start justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-1000">{branch.name}</p>
                    <p className="text-xs text-gray-900">
                      Brand: {brand.name} · {branch.city}
                      {branch.isHeadquarters ? ' · HQ' : ''}
                    </p>
                    <p className="text-xs text-gray-900">
                      {branch.address} · {branch.hoursSummary}
                    </p>
                  </div>
                  <span
                    className={[
                      'rounded-[6px] px-1.5 py-0.5 text-xs font-medium',
                      branch.isActive
                        ? 'bg-gray-200 text-gray-900'
                        : 'bg-red-100 text-red-900',
                    ].join(' ')}
                  >
                    {branch.isActive ? 'Active' : 'Inactive'}
                  </span>
                </li>
              ))}
              {branches.length === 0 && (
                <li className="py-4 text-center text-sm text-gray-900">No branches</li>
              )}
            </ul>
          </section>

          <section className="geist-panel p-4">
            <h2 className="text-sm font-semibold text-gray-1000">Owners / payout</h2>
            <ul className="mt-3 divide-y divide-gray-400">
              {merchant.owners.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-1000">
                      {o.name}{' '}
                      <span className="text-xs font-normal capitalize text-gray-900">
                        ({o.role})
                      </span>
                    </p>
                    <p className="text-xs text-gray-900">{o.email}</p>
                  </div>
                  <p className="text-xs text-gray-900">{o.bankAccountMasked}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="geist-panel p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-1000">
                Linked Finance activity (org)
              </h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('transactions')}
                  className="text-xs text-blue-900 hover:underline"
                >
                  Transactions
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('refunds')}
                  className="text-xs text-blue-900 hover:underline"
                >
                  Refunds
                </button>
              </div>
            </div>
            <ul className="mt-3 divide-y divide-gray-400">
              {txs.slice(0, 4).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-1000">
                      {t.id} · {formatRM(t.amount)}
                    </p>
                    <p className="text-xs text-gray-900">{formatDateTime(t.timestamp)}</p>
                  </div>
                  {t.status === 'flagged' ? (
                    <FlagBadge />
                  ) : (
                    <span className="text-xs capitalize text-gray-900">{t.status}</span>
                  )}
                </li>
              ))}
              {refunds.slice(0, 3).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-1000">
                      Refund {r.receiptId} · {formatRM(r.amount)}
                    </p>
                    <p className="text-xs text-gray-900">{r.reason}</p>
                  </div>
                  <RefundStatusBadge status={r.status} />
                </li>
              ))}
              {txs.length === 0 && refunds.length === 0 && (
                <li className="py-4 text-center text-sm text-gray-900">
                  No linked transactions or refunds
                </li>
              )}
            </ul>
          </section>

          <section className="geist-panel p-4">
            <h2 className="text-sm font-semibold text-gray-1000">Internal notes</h2>
            <div className="mt-3 flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 rounded-[6px] border border-gray-400 px-3 py-2 text-sm outline-none focus:border-gray-600"
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
            <ul className="mt-4 divide-y divide-gray-400">
              {merchant.notes.map((n) => (
                <li key={n.id} className="py-3">
                  <p className="text-sm text-gray-1000">{n.body}</p>
                  <p className="mt-1 text-xs text-gray-900">
                    {n.adminName} · {formatDateTime(n.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="geist-panel p-4 text-foreground">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-900">
              Organization
            </p>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">MRR (all brands)</dt>
                <dd className="font-mono tabular-nums font-medium">{formatRM(orgMrr(merchant))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Brands</dt>
                <dd className="font-mono tabular-nums font-medium">{merchant.brands.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Branches</dt>
                <dd className="font-mono tabular-nums font-medium">{branchCount(merchant)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Last active</dt>
                <dd className="font-medium">{formatDate(merchant.lastActive)}</dd>
              </div>
            </dl>
          </div>

          <div className="geist-panel p-4">
            <h3 className="text-sm font-semibold text-gray-1000">Org actions</h3>
            <p className="mt-1 text-xs text-gray-900">
              Suspend / reactivate apply to the whole organization. Billing extend /
              waive are on the Brand panel.
            </p>
            <textarea
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder="Optional note for action..."
              rows={2}
              className="geist-input mt-3"
            />

            {merchant.status !== 'suspended' ? (
              <button
                type="button"
                className="mt-3 w-full rounded-[6px] border border-red-700 bg-red-700 px-3 py-2 text-[13px] font-medium text-white"
                onClick={() => {
                  store.suspendMerchant(merchant.id, actionNote || undefined)
                  setActionNote('')
                }}
              >
                Suspend organization
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
                Reactivate organization
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
