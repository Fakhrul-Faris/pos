'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useAdminStore } from '@/data/store'
import { formatDateTime, formatRM, merchantName } from '@/data/mock'
import type { ReasonCode, RefundStatus } from '@/data/types'
import { REASON_CODE_LABELS } from '@/data/types'
import { RefundStatusBadge } from '../StatusBadge'

type Props = {
  onOpenMerchant: (id: string) => void
}

export function Refunds({ onOpenMerchant }: Props) {
  const store = useAdminStore()
  const [filter, setFilter] = useState<RefundStatus | 'queue' | 'all'>('queue')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    merchantId: store.merchants[0]?.id ?? '',
    receiptId: '',
    amount: '',
    reason: '',
    notes: '',
  })
  const [approveId, setApproveId] = useState<string | null>(null)
  const [reasonCode, setReasonCode] = useState<ReasonCode>('duplicate_charge')
  const [reasonNote, setReasonNote] = useState('')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState('')

  const rows = useMemo(() => {
    if (filter === 'all') return store.refunds
    if (filter === 'queue') {
      return store.refunds.filter(
        (r) => r.status === 'pending_first' || r.status === 'pending_second',
      )
    }
    return store.refunds.filter((r) => r.status === filter)
  }, [store.refunds, filter])

  const submitLog = () => {
    const amount = Number(form.amount)
    if (!form.receiptId || !form.reason || !amount) {
      setError('Receipt, reason, and amount are required')
      return
    }
    store.logRefund({
      merchantId: form.merchantId,
      receiptId: form.receiptId,
      amount,
      reason: form.reason,
      notes: form.notes,
    })
    setShowForm(false)
    setForm({
      merchantId: store.merchants[0]?.id ?? '',
      receiptId: '',
      amount: '',
      reason: '',
      notes: '',
    })
    setError('')
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-ui text-carbon">Refunds</h1>
          <p className="mt-1 text-sm text-graphite">
            Admins log requests; second admin must approve. Same person cannot dual-approve.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>
          Log refund request
        </button>
      </header>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['queue', 'Queue'],
            ['all', 'All'],
            ['approved', 'Approved'],
            ['rejected', 'Rejected'],
            ['processed', 'Processed'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={[
              'rounded-full px-3 py-1.5 text-xs font-medium',
              filter === id
                ? 'bg-carbon text-paper-white'
                : 'bg-mist text-graphite hover:bg-fog',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="rounded-xl border border-fog bg-paper-white p-5 shadow-subtle-2">
          <h2 className="text-sm font-semibold text-carbon">New refund request</h2>
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
              Receipt ID
              <input
                value={form.receiptId}
                onChange={(e) => setForm({ ...form, receiptId: e.target.value })}
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
              Reason
              <input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm"
              />
            </label>
            <label className="col-span-2 text-xs text-ash">
              Supporting notes
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm"
              />
            </label>
          </div>
          {error && <p className="mt-2 text-xs text-ember">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn-primary" onClick={submitLog}>
              Submit (counts as first approval)
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setShowForm(false)
                setError('')
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-fog bg-paper-white shadow-subtle-2">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-fog bg-mist/60 text-xs uppercase tracking-[0.06em] text-ash">
            <tr>
              <th className="px-4 py-3 font-medium">Receipt</th>
              <th className="px-4 py-3 font-medium">Merchant</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Logged</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fog">
            {rows.map((r) => {
              const canApprove =
                (r.status === 'pending_second' || r.status === 'pending_first') &&
                store.currentAdmin &&
                r.loggedBy !== store.currentAdmin.id &&
                r.firstApprover !== store.currentAdmin.id
              return (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-carbon">{r.receiptId}</p>
                    <p className="text-xs text-ash">{r.reason}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onOpenMerchant(r.merchantId)}
                      className="text-lavender hover:underline"
                    >
                      {merchantName(store.merchants, r.merchantId)}
                    </button>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatRM(r.amount)}</td>
                  <td className="px-4 py-3">
                    <RefundStatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-ash">
                    {r.loggedBy} · {formatDateTime(r.loggedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {canApprove && (
                        <>
                          <button
                            type="button"
                            className="rounded-full bg-mint px-2.5 py-1 text-xs font-medium text-paper-white"
                            onClick={() => {
                              setApproveId(r.id)
                              setError('')
                            }}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="rounded-full bg-ember px-2.5 py-1 text-xs font-medium text-paper-white"
                            onClick={() => {
                              setRejectId(r.id)
                              setError('')
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {r.status === 'approved' && (
                        <button
                          type="button"
                          className="btn-ghost px-2.5 py-1 text-xs"
                          onClick={() => store.markRefundProcessed(r.id)}
                        >
                          Mark processed
                        </button>
                      )}
                      {(r.status === 'pending_second' || r.status === 'pending_first') &&
                        store.currentAdmin &&
                        (r.loggedBy === store.currentAdmin.id ||
                          r.firstApprover === store.currentAdmin.id) && (
                          <span className="text-xs text-ash">Waiting for another admin</span>
                        )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ash">
                  No refunds in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {approveId && (
        <Modal title="Approve refund" onClose={() => setApproveId(null)}>
          <label className="block text-xs text-ash">
            Reason code (if override / exception)
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value as ReasonCode)}
              className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm"
            >
              {(Object.keys(REASON_CODE_LABELS) as ReasonCode[]).map((c) => (
                <option key={c} value={c}>
                  {REASON_CODE_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          {reasonCode === 'other' && (
            <label className="mt-3 block text-xs text-ash">
              Note (required)
              <input
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm"
              />
            </label>
          )}
          {error && <p className="mt-2 text-xs text-ember">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                const res = store.approveRefund(approveId, {
                  reasonCode,
                  reasonCodeNote: reasonNote,
                })
                if (!res.ok) {
                  setError(res.error ?? 'Failed')
                  return
                }
                setApproveId(null)
                setReasonNote('')
              }}
            >
              Confirm approval
            </button>
            <button type="button" className="btn-ghost" onClick={() => setApproveId(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {rejectId && (
        <Modal title="Reject refund" onClose={() => setRejectId(null)}>
          <label className="block text-xs text-ash">
            Reason (required)
            <input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm"
            />
          </label>
          {error && <p className="mt-2 text-xs text-ember">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="rounded-full bg-ember px-4 py-2.5 text-sm font-medium text-paper-white"
              onClick={() => {
                const res = store.rejectRefund(rejectId, rejectReason)
                if (!res.ok) {
                  setError(res.error ?? 'Failed')
                  return
                }
                setRejectId(null)
                setRejectReason('')
              }}
            >
              Confirm reject
            </button>
            <button type="button" className="btn-ghost" onClick={() => setRejectId(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-carbon/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-paper-white p-5 shadow-panel">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-carbon">{title}</h3>
          <button type="button" onClick={onClose} className="text-ash hover:text-carbon">
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
