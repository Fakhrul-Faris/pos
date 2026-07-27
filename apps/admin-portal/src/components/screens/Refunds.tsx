'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useAdminStore } from '@/data/store'
import {
  financeContextLabel,
  formatDateTime,
  formatRM,
  merchantName,
  primaryBrand,
} from '@/data/mock'
import type { ReasonCode, RefundStatus } from '@/data/types'
import { REASON_CODE_LABELS } from '@/data/types'
import { RefundStatusBadge } from '../StatusBadge'
import { Chip } from '../ui/Badge'
import { Button } from '../ui/Button'
import { EmptyRow, Table, TBody, TD, TH, THead, TR } from '../ui/Table'

type Props = {
  onOpenMerchant: (id: string) => void
}

export function Refunds({ onOpenMerchant }: Props) {
  const store = useAdminStore()
  const [filter, setFilter] = useState<RefundStatus | 'queue' | 'all'>('queue')
  const [showForm, setShowForm] = useState(false)
  const firstOrg = store.merchants[0]
  const firstBrand = firstOrg ? primaryBrand(firstOrg) : undefined
  const [form, setForm] = useState({
    merchantId: firstOrg?.id ?? '',
    brandId: firstBrand?.id ?? '',
    branchId: firstBrand?.branches[0]?.id ?? '',
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

  const selectedOrg = store.merchants.find((m) => m.id === form.merchantId)
  const selectedBrand = selectedOrg?.brands.find((b) => b.id === form.brandId)
  const brandOptions = selectedOrg?.brands ?? []
  const branchOptions = selectedBrand?.branches ?? []

  const rows = useMemo(() => {
    if (filter === 'all') return store.refunds
    if (filter === 'queue') {
      return store.refunds.filter(
        (r) => r.status === 'pending_first' || r.status === 'pending_second',
      )
    }
    return store.refunds.filter((r) => r.status === filter)
  }, [store.refunds, filter])

  const resetForm = (merchantId?: string) => {
    const org =
      store.merchants.find((m) => m.id === merchantId) ?? store.merchants[0]
    const brand = org ? primaryBrand(org) : undefined
    setForm({
      merchantId: org?.id ?? '',
      brandId: brand?.id ?? '',
      branchId: brand?.branches[0]?.id ?? '',
      receiptId: '',
      amount: '',
      reason: '',
      notes: '',
    })
  }

  const submitLog = () => {
    const amount = Number(form.amount)
    if (!form.receiptId || !form.reason || !amount) {
      setError('Receipt, reason, and amount are required')
      return
    }
    store.logRefund({
      merchantId: form.merchantId,
      brandId: form.brandId || undefined,
      branchId: form.branchId || undefined,
      receiptId: form.receiptId,
      amount,
      reason: form.reason,
      notes: form.notes,
    })
    setShowForm(false)
    resetForm()
    setError('')
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Refunds</h1>
          <p className="page-desc">
            Dual approval on organization settlement. Brand / branch is outlet
            context only — not SaaS billing.
          </p>
        </div>
        <Button
          size="small"
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
        >
          Log refund request
        </Button>
      </header>

      <div className="flex flex-wrap gap-1">
        {(
          [
            ['queue', 'Queue'],
            ['all', 'All'],
            ['approved', 'Approved'],
            ['rejected', 'Rejected'],
            ['processed', 'Processed'],
          ] as const
        ).map(([id, label]) => (
          <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>
            {label}
          </Chip>
        ))}
      </div>

      {showForm && (
        <div className="geist-panel p-4">
          <h2 className="text-[13px] font-semibold text-gray-1000">
            New refund request
          </h2>
          <p className="mt-1 text-[11px] text-gray-900">
            Organization required. Brand / branch optional for outlet context.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-[11px] text-gray-900">
              Organization
              <select
                value={form.merchantId}
                onChange={(e) => {
                  const org = store.merchants.find((m) => m.id === e.target.value)
                  const brand = org ? primaryBrand(org) : undefined
                  setForm({
                    ...form,
                    merchantId: e.target.value,
                    brandId: brand?.id ?? '',
                    branchId: brand?.branches[0]?.id ?? '',
                  })
                }}
                className="geist-input mt-1"
              >
                {store.merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.businessName}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-gray-900">
              Brand (context)
              <select
                value={form.brandId}
                onChange={(e) => {
                  const brand = brandOptions.find((b) => b.id === e.target.value)
                  setForm({
                    ...form,
                    brandId: e.target.value,
                    branchId: brand?.branches[0]?.id ?? '',
                  })
                }}
                className="geist-input mt-1"
              >
                {brandOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-gray-900">
              Branch (context)
              <select
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                className="geist-input mt-1"
              >
                {branchOptions.map((bh) => (
                  <option key={bh.id} value={bh.id}>
                    {bh.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-gray-900">
              Receipt ID
              <input
                value={form.receiptId}
                onChange={(e) => setForm({ ...form, receiptId: e.target.value })}
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
              Reason
              <input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="geist-input mt-1"
              />
            </label>
            <label className="col-span-2 text-[11px] text-gray-900">
              Supporting notes
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="geist-input mt-1"
              />
            </label>
          </div>
          {error && <p className="mt-2 text-[11px] text-red-900">{error}</p>}
          <div className="mt-3 flex gap-2">
            <Button size="small" onClick={submitLog}>
              Submit (first approval)
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => {
                setShowForm(false)
                setError('')
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <Table>
        <THead>
          <tr>
            <TH>Receipt</TH>
            <TH>Organization</TH>
            <TH>Outlet</TH>
            <TH>Amount</TH>
            <TH>Status</TH>
            <TH>Logged</TH>
            <TH>Actions</TH>
          </tr>
        </THead>
        <TBody>
          {rows.map((r) => {
            const canApprove =
              (r.status === 'pending_second' || r.status === 'pending_first') &&
              store.currentAdmin &&
              r.loggedBy !== store.currentAdmin.id &&
              r.firstApprover !== store.currentAdmin.id
            const ctx = financeContextLabel(
              store.merchants,
              r.merchantId,
              r.brandId,
              r.branchId,
            )
            return (
              <TR key={r.id}>
                <TD>
                  <p className="font-medium text-gray-1000">{r.receiptId}</p>
                  <p className="text-[11px] text-gray-900">{r.reason}</p>
                </TD>
                <TD>
                  <button
                    type="button"
                    onClick={() => onOpenMerchant(r.merchantId)}
                    className="text-blue-900 hover:underline"
                  >
                    {merchantName(store.merchants, r.merchantId)}
                  </button>
                </TD>
                <TD muted>{ctx ?? '-'}</TD>
                <TD mono muted>
                  {formatRM(r.amount)}
                </TD>
                <TD>
                  <RefundStatusBadge status={r.status} />
                </TD>
                <TD muted>
                  <span className="text-[11px]">
                    {r.loggedBy} · {formatDateTime(r.loggedAt)}
                  </span>
                </TD>
                <TD>
                  <div className="flex flex-wrap gap-1">
                    {canApprove && (
                      <>
                        <Button
                          size="tiny"
                          variant="secondary"
                          className="!border-green-700 !text-green-900"
                          onClick={() => {
                            setApproveId(r.id)
                            setError('')
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="tiny"
                          variant="error"
                          onClick={() => {
                            setRejectId(r.id)
                            setError('')
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <Button
                        size="tiny"
                        variant="tertiary"
                        onClick={() => store.markRefundProcessed(r.id)}
                      >
                        Mark processed
                      </Button>
                    )}
                    {(r.status === 'pending_second' ||
                      r.status === 'pending_first') &&
                      store.currentAdmin &&
                      (r.loggedBy === store.currentAdmin.id ||
                        r.firstApprover === store.currentAdmin.id) && (
                        <span className="text-[11px] text-gray-900">
                          Waiting for another admin
                        </span>
                      )}
                  </div>
                </TD>
              </TR>
            )
          })}
          {rows.length === 0 && (
            <EmptyRow colSpan={7} text="No refunds in this view." />
          )}
        </TBody>
      </Table>

      {approveId && (
        <Modal title="Approve refund" onClose={() => setApproveId(null)}>
          <label className="block text-[11px] text-gray-900">
            Reason code
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value as ReasonCode)}
              className="geist-input mt-1"
            >
              {(Object.keys(REASON_CODE_LABELS) as ReasonCode[]).map((c) => (
                <option key={c} value={c}>
                  {REASON_CODE_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          {reasonCode === 'other' && (
            <label className="mt-3 block text-[11px] text-gray-900">
              Note (required)
              <input
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                className="geist-input mt-1"
              />
            </label>
          )}
          {error && <p className="mt-2 text-[11px] text-red-900">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button
              size="small"
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
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setApproveId(null)}
            >
              Cancel
            </Button>
          </div>
        </Modal>
      )}

      {rejectId && (
        <Modal title="Reject refund" onClose={() => setRejectId(null)}>
          <label className="block text-[11px] text-gray-900">
            Reason (required)
            <input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="geist-input mt-1"
            />
          </label>
          {error && <p className="mt-2 text-[11px] text-red-900">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button
              size="small"
              variant="error"
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
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setRejectId(null)}
            >
              Cancel
            </Button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-[12px] border border-gray-400 bg-gray-100 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-gray-1000">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-900 hover:text-gray-1000"
          >
            ✕
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  )
}
