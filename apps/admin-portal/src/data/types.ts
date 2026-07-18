export type AdminScreen =
  | 'dashboard'
  | 'merchants'
  | 'merchant-detail'
  | 'refunds'
  | 'subscriptions'
  | 'transactions'
  | 'reconciliation'
  | 'marketing'
  | 'marketing-detail'
  | 'audit'

export type AdminId = 'fakhrul' | 'haziq' | 'helmi'

export type MerchantStatus =
  | 'active'
  | 'suspension_pending'
  | 'suspended'
  | 'churned'

export type PlanTier = 'trial' | 'lite' | 'ocelot' | 'mantis' | 'patriot'

export type ReasonCode =
  | 'merchant_dispute'
  | 'platform_error'
  | 'goodwill'
  | 'duplicate_charge'
  | 'other'

export type RefundStatus =
  | 'pending_first'
  | 'pending_second'
  | 'approved'
  | 'rejected'
  | 'processed'

export type DualApprovalStatus =
  | 'pending_first'
  | 'pending_second'
  | 'approved'
  | 'rejected'

export type AuditActionType =
  | 'refund_logged'
  | 'refund_approved'
  | 'refund_rejected'
  | 'refund_processed'
  | 'payout_override_requested'
  | 'payout_override_approved'
  | 'payout_override_rejected'
  | 'subscription_extended'
  | 'subscription_waived'
  | 'merchant_suspended'
  | 'merchant_reactivated'
  | 'note_added'
  | 'flagged_reviewed'
  | 'experiment_created'
  | 'experiment_concluded'
  | 'post_logged'
  | 'post_updated'
  | 'login'

export type AdminUser = {
  id: AdminId
  name: string
  email: string
}

export type Merchant = {
  id: string
  businessName: string
  ownerName: string
  ownerEmail: string
  vertical: string
  plan: PlanTier
  status: MerchantStatus
  signupDate: string
  lastActive: string
  mrr: number
  outlets: number
  bookingsThisMonth: number
  notes: MerchantNote[]
  bankAccountMasked: string
  subscription: SubscriptionInfo
}

export type MerchantNote = {
  id: string
  adminId: AdminId
  adminName: string
  body: string
  createdAt: string
}

export type SubscriptionInfo = {
  plan: PlanTier
  status: 'active' | 'past_due' | 'waived' | 'cancelled'
  nextBillingDate: string
  lastPaymentDate: string | null
  lastPaymentAmount: number | null
  graceEndsAt: string | null
  paymentHistory: PaymentRecord[]
}

export type PaymentRecord = {
  id: string
  date: string
  amount: number
  status: 'paid' | 'failed' | 'waived' | 'refunded'
}

export type RefundRequest = {
  id: string
  merchantId: string
  receiptId: string
  amount: number
  reason: string
  notes: string
  status: RefundStatus
  loggedBy: AdminId
  loggedAt: string
  firstApprover?: AdminId
  firstApprovedAt?: string
  secondApprover?: AdminId
  secondApprovedAt?: string
  rejector?: AdminId
  rejectedAt?: string
  rejectReason?: string
  reasonCode?: ReasonCode
  reasonCodeNote?: string
  processedAt?: string
}

export type PayoutOverride = {
  id: string
  merchantId: string
  period: string
  amount: number
  notes: string
  status: DualApprovalStatus
  loggedBy: AdminId
  loggedAt: string
  firstApprover?: AdminId
  firstApprovedAt?: string
  secondApprover?: AdminId
  secondApprovedAt?: string
  rejector?: AdminId
  rejectedAt?: string
  rejectReason?: string
  reasonCode?: ReasonCode
  reasonCodeNote?: string
}

export type Transaction = {
  id: string
  merchantId: string
  amount: number
  surcharge: number
  settlementAmount: number
  timestamp: string
  method: 'duitnow_qr' | 'card' | 'cash'
  status: 'completed' | 'refunded' | 'flagged' | 'reviewed'
  hitpayFlagReason?: string
  reviewedBy?: AdminId
  reviewedAt?: string
}

export type ReconciliationRow = {
  merchantId: string
  period: string
  hitpayCollected: number
  surchargeRevenue: number
  owedToMerchant: number
  settledAmount: number
}

export type AuditEntry = {
  id: string
  at: string
  adminId: AdminId
  adminName: string
  action: AuditActionType
  merchantId?: string
  entityId?: string
  reasonCode?: ReasonCode
  reasonNote?: string
  before?: string
  after?: string
  detail: string
}

/** Organic marketing — experiment log (not a social dashboard). */
export type SocialPlatform = 'facebook' | 'threads' | 'x' | 'reddit'

export type ContentType =
  | 'meme'
  | 'testimonial'
  | 'feature_demo'
  | 'pain_point_rant'
  | 'behind_the_scenes'
  | 'other'

export type ExperimentStatus = 'active' | 'concluded'

/** Manual metrics now; fields shaped so a future API pull can fill the same shape. */
export type PostMetrics = {
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  views: number | null
  /** ISO timestamp of last manual (or future API) update */
  updatedAt: string | null
  source: 'manual' | 'api'
}

export type MarketingExperiment = {
  id: string
  name: string
  hypothesis: string
  startDate: string
  endDate: string | null
  status: ExperimentStatus
  learnings: string
  createdBy: AdminId
  createdAt: string
}

export type MarketingPost = {
  id: string
  experimentId: string
  platform: SocialPlatform
  url: string
  postedAt: string
  postedBy: AdminId
  contentType: ContentType
  hook: string
  metrics: PostMetrics
}

export const REASON_CODE_LABELS: Record<ReasonCode, string> = {
  merchant_dispute: 'Merchant dispute resolved in their favor',
  platform_error: 'Platform error',
  goodwill: 'Goodwill / retention',
  duplicate_charge: 'Duplicate charge',
  other: 'Other',
}

export const PLAN_LABELS: Record<PlanTier, string> = {
  trial: 'Trial',
  lite: 'Lite',
  ocelot: 'Ocelot',
  mantis: 'Mantis',
  patriot: 'Patriot',
}

export const STATUS_LABELS: Record<MerchantStatus, string> = {
  active: 'Active',
  suspension_pending: 'Suspension pending',
  suspended: 'Suspended',
  churned: 'Churned',
}

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  threads: 'Threads',
  x: 'X',
  reddit: 'Reddit',
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  meme: 'Meme',
  testimonial: 'Testimonial',
  feature_demo: 'Feature demo',
  pain_point_rant: 'Pain-point rant',
  behind_the_scenes: 'Behind the scenes',
  other: 'Other',
}
