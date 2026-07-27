'use client'

import type { MerchantStatus, RefundStatus, DualApprovalStatus } from '@/data/types'
import { STATUS_LABELS } from '@/data/types'
import { Badge } from './ui/Badge'

const merchantTone: Record<MerchantStatus, 'green' | 'amber' | 'red' | 'gray'> = {
  active: 'green',
  suspension_pending: 'amber',
  suspended: 'red',
  churned: 'gray',
}

export function MerchantStatusBadge({ status }: { status: MerchantStatus }) {
  return <Badge tone={merchantTone[status]}>{STATUS_LABELS[status]}</Badge>
}

const refundTone: Record<RefundStatus, 'gray' | 'amber' | 'green' | 'red'> = {
  pending_first: 'gray',
  pending_second: 'amber',
  approved: 'green',
  rejected: 'red',
  processed: 'gray',
}

const refundLabel: Record<RefundStatus, string> = {
  pending_first: 'Awaiting first review',
  pending_second: 'Awaiting second approval',
  approved: 'Approved',
  rejected: 'Rejected',
  processed: 'Processed',
}

export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  return <Badge tone={refundTone[status]}>{refundLabel[status]}</Badge>
}

const dualTone: Record<DualApprovalStatus, 'gray' | 'amber' | 'green' | 'red'> = {
  pending_first: 'gray',
  pending_second: 'amber',
  approved: 'green',
  rejected: 'red',
}

const dualLabel: Record<DualApprovalStatus, string> = {
  pending_first: 'Awaiting first review',
  pending_second: 'Awaiting second approval',
  approved: 'Approved',
  rejected: 'Rejected',
}

export function DualStatusBadge({ status }: { status: DualApprovalStatus }) {
  return <Badge tone={dualTone[status]}>{dualLabel[status]}</Badge>
}

export function FlagBadge() {
  return <Badge tone="red">Flagged</Badge>
}
