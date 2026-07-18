'use client'

import type { MerchantStatus, RefundStatus, DualApprovalStatus } from '@/data/types'
import { STATUS_LABELS } from '@/data/types'

const merchantStatusClass: Record<MerchantStatus, string> = {
  active: 'bg-mint-wash text-mint',
  suspension_pending: 'bg-[#fff4e0] text-amber',
  suspended: 'bg-[#ffe8e0] text-ember',
  churned: 'bg-mist text-ash',
}

export function MerchantStatusBadge({ status }: { status: MerchantStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${merchantStatusClass[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

const refundClass: Record<RefundStatus, string> = {
  pending_first: 'bg-mist text-graphite',
  pending_second: 'bg-[#fff4e0] text-amber',
  approved: 'bg-mint-wash text-mint',
  rejected: 'bg-[#ffe8e0] text-ember',
  processed: 'bg-mist text-ash',
}

const refundLabel: Record<RefundStatus, string> = {
  pending_first: 'Awaiting first review',
  pending_second: 'Awaiting second approval',
  approved: 'Approved',
  rejected: 'Rejected',
  processed: 'Processed',
}

export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${refundClass[status]}`}
    >
      {refundLabel[status]}
    </span>
  )
}

const dualClass: Record<DualApprovalStatus, string> = {
  pending_first: 'bg-mist text-graphite',
  pending_second: 'bg-[#fff4e0] text-amber',
  approved: 'bg-mint-wash text-mint',
  rejected: 'bg-[#ffe8e0] text-ember',
}

const dualLabel: Record<DualApprovalStatus, string> = {
  pending_first: 'Awaiting first review',
  pending_second: 'Awaiting second approval',
  approved: 'Approved',
  rejected: 'Rejected',
}

export function DualStatusBadge({ status }: { status: DualApprovalStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${dualClass[status]}`}
    >
      {dualLabel[status]}
    </span>
  )
}

export function FlagBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-[#ffe8e0] px-2 py-0.5 text-xs font-medium text-ember">
      Flagged
    </span>
  )
}
