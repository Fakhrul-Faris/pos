'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  ADMINS,
  INITIAL_AUDIT,
  INITIAL_EXPERIMENTS,
  INITIAL_MERCHANTS,
  INITIAL_PAYOUT_OVERRIDES,
  INITIAL_POSTS,
  INITIAL_RECONCILIATION,
  INITIAL_REFUNDS,
  INITIAL_TRANSACTIONS,
} from './mock'
import type {
  AdminId,
  AdminUser,
  AuditActionType,
  AuditEntry,
  ContentType,
  MarketingExperiment,
  MarketingPost,
  Merchant,
  MerchantNote,
  PayoutOverride,
  PostMetrics,
  ReasonCode,
  ReconciliationRow,
  RefundRequest,
  SocialPlatform,
  Transaction,
} from './types'

type AdminStore = {
  currentAdmin: AdminUser | null
  merchants: Merchant[]
  refunds: RefundRequest[]
  transactions: Transaction[]
  reconciliation: ReconciliationRow[]
  payoutOverrides: PayoutOverride[]
  audit: AuditEntry[]
  experiments: MarketingExperiment[]
  posts: MarketingPost[]
  login: (id: AdminId) => void
  logout: () => void
  switchAdmin: (id: AdminId) => void
  addNote: (merchantId: string, body: string) => void
  suspendMerchant: (merchantId: string, note?: string) => void
  reactivateMerchant: (merchantId: string, note?: string) => void
  extendSubscription: (merchantId: string, days: number, note: string) => void
  waiveSubscription: (merchantId: string, note: string) => void
  logRefund: (input: {
    merchantId: string
    receiptId: string
    amount: number
    reason: string
    notes: string
  }) => void
  approveRefund: (
    id: string,
    opts?: { reasonCode?: ReasonCode; reasonCodeNote?: string },
  ) => { ok: boolean; error?: string }
  rejectRefund: (id: string, rejectReason: string) => { ok: boolean; error?: string }
  markRefundProcessed: (id: string) => void
  reviewFlaggedTx: (id: string) => void
  requestPayoutOverride: (input: {
    merchantId: string
    period: string
    amount: number
    notes: string
    reasonCode: ReasonCode
    reasonCodeNote?: string
  }) => void
  approvePayoutOverride: (
    id: string,
  ) => { ok: boolean; error?: string }
  rejectPayoutOverride: (
    id: string,
    rejectReason: string,
  ) => { ok: boolean; error?: string }
  createExperiment: (input: {
    name: string
    hypothesis: string
    startDate: string
    endDate: string | null
  }) => string | null
  concludeExperiment: (id: string, learnings: string) => void
  addPost: (input: {
    experimentId: string
    platform: SocialPlatform
    url: string
    postedAt: string
    contentType: ContentType
    hook: string
    metrics: Omit<PostMetrics, 'updatedAt' | 'source'>
  }) => void
  updatePost: (
    id: string,
    input: {
      platform: SocialPlatform
      url: string
      postedAt: string
      contentType: ContentType
      hook: string
      metrics: Omit<PostMetrics, 'updatedAt' | 'source'>
    },
  ) => void
}

const Ctx = createContext<AdminStore | null>(null)

function nowIso() {
  return new Date().toISOString()
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null)
  const [merchants, setMerchants] = useState(INITIAL_MERCHANTS)
  const [refunds, setRefunds] = useState(INITIAL_REFUNDS)
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS)
  const [reconciliation] = useState(INITIAL_RECONCILIATION)
  const [payoutOverrides, setPayoutOverrides] = useState(INITIAL_PAYOUT_OVERRIDES)
  const [audit, setAudit] = useState(INITIAL_AUDIT)
  const [experiments, setExperiments] = useState(INITIAL_EXPERIMENTS)
  const [posts, setPosts] = useState(INITIAL_POSTS)

  const pushAudit = useCallback(
    (
      admin: AdminUser,
      entry: Omit<AuditEntry, 'id' | 'at' | 'adminId' | 'adminName'>,
    ) => {
      const row: AuditEntry = {
        id: uid('au'),
        at: nowIso(),
        adminId: admin.id,
        adminName: admin.name,
        ...entry,
      }
      setAudit((prev) => [row, ...prev])
    },
    [],
  )

  const login = useCallback(
    (id: AdminId) => {
      const user = ADMINS.find((a) => a.id === id)
      if (!user) return
      setCurrentAdmin(user)
      setAudit((prev) => [
        {
          id: uid('au'),
          at: nowIso(),
          adminId: user.id,
          adminName: user.name,
          action: 'login' as AuditActionType,
          detail: `${user.name} signed in`,
        },
        ...prev,
      ])
    },
    [],
  )

  const logout = useCallback(() => setCurrentAdmin(null), [])

  const switchAdmin = useCallback((id: AdminId) => {
    const user = ADMINS.find((a) => a.id === id)
    if (user) setCurrentAdmin(user)
  }, [])

  const addNote = useCallback(
    (merchantId: string, body: string) => {
      if (!currentAdmin || !body.trim()) return
      const note: MerchantNote = {
        id: uid('n'),
        adminId: currentAdmin.id,
        adminName: currentAdmin.name,
        body: body.trim(),
        createdAt: nowIso(),
      }
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === merchantId ? { ...m, notes: [note, ...m.notes] } : m,
        ),
      )
      pushAudit(currentAdmin, {
        action: 'note_added',
        merchantId,
        detail: `Added note on merchant`,
      })
    },
    [currentAdmin, pushAudit],
  )

  const suspendMerchant = useCallback(
    (merchantId: string, note?: string) => {
      if (!currentAdmin) return
      setMerchants((prev) =>
        prev.map((m) => {
          if (m.id !== merchantId) return m
          const notes = note
            ? [
                {
                  id: uid('n'),
                  adminId: currentAdmin.id,
                  adminName: currentAdmin.name,
                  body: note,
                  createdAt: nowIso(),
                },
                ...m.notes,
              ]
            : m.notes
          return { ...m, status: 'suspended' as const, mrr: 0, notes }
        }),
      )
      pushAudit(currentAdmin, {
        action: 'merchant_suspended',
        merchantId,
        after: 'suspended',
        detail: note || 'Manual suspend',
      })
    },
    [currentAdmin, pushAudit],
  )

  const reactivateMerchant = useCallback(
    (merchantId: string, note?: string) => {
      if (!currentAdmin) return
      setMerchants((prev) =>
        prev.map((m) => {
          if (m.id !== merchantId) return m
          const notes = note
            ? [
                {
                  id: uid('n'),
                  adminId: currentAdmin.id,
                  adminName: currentAdmin.name,
                  body: note,
                  createdAt: nowIso(),
                },
                ...m.notes,
              ]
            : m.notes
          return {
            ...m,
            status: 'active' as const,
            notes,
            subscription: { ...m.subscription, status: 'active' as const, graceEndsAt: null },
          }
        }),
      )
      pushAudit(currentAdmin, {
        action: 'merchant_reactivated',
        merchantId,
        after: 'active',
        detail: note || 'Manual reactivate',
      })
    },
    [currentAdmin, pushAudit],
  )

  const extendSubscription = useCallback(
    (merchantId: string, days: number, note: string) => {
      if (!currentAdmin) return
      setMerchants((prev) =>
        prev.map((m) => {
          if (m.id !== merchantId) return m
          const base = m.subscription.graceEndsAt
            ? new Date(m.subscription.graceEndsAt)
            : new Date()
          base.setDate(base.getDate() + days)
          return {
            ...m,
            status: 'active',
            subscription: {
              ...m.subscription,
              status: 'active',
              graceEndsAt: null,
              nextBillingDate: base.toISOString().slice(0, 10),
            },
          }
        }),
      )
      pushAudit(currentAdmin, {
        action: 'subscription_extended',
        merchantId,
        detail: `Extended ${days} days — ${note}`,
      })
    },
    [currentAdmin, pushAudit],
  )

  const waiveSubscription = useCallback(
    (merchantId: string, note: string) => {
      if (!currentAdmin) return
      setMerchants((prev) =>
        prev.map((m) => {
          if (m.id !== merchantId) return m
          return {
            ...m,
            status: 'active',
            subscription: {
              ...m.subscription,
              status: 'waived',
              graceEndsAt: null,
              paymentHistory: [
                {
                  id: uid('pay'),
                  date: nowIso().slice(0, 10),
                  amount: m.mrr || m.subscription.lastPaymentAmount || 0,
                  status: 'waived' as const,
                },
                ...m.subscription.paymentHistory,
              ],
            },
          }
        }),
      )
      pushAudit(currentAdmin, {
        action: 'subscription_waived',
        merchantId,
        detail: note,
      })
    },
    [currentAdmin, pushAudit],
  )

  const logRefund = useCallback(
    (input: {
      merchantId: string
      receiptId: string
      amount: number
      reason: string
      notes: string
    }) => {
      if (!currentAdmin) return
      const id = uid('rf')
      const row: RefundRequest = {
        id,
        ...input,
        status: 'pending_second',
        loggedBy: currentAdmin.id,
        loggedAt: nowIso(),
        firstApprover: currentAdmin.id,
        firstApprovedAt: nowIso(),
      }
      setRefunds((prev) => [row, ...prev])
      pushAudit(currentAdmin, {
        action: 'refund_logged',
        merchantId: input.merchantId,
        entityId: id,
        detail: `Logged refund ${input.receiptId} for RM${input.amount}`,
      })
    },
    [currentAdmin, pushAudit],
  )

  const approveRefund = useCallback(
    (
      id: string,
      opts?: { reasonCode?: ReasonCode; reasonCodeNote?: string },
    ) => {
      if (!currentAdmin) return { ok: false, error: 'Not signed in' }
      const target = refunds.find((r) => r.id === id)
      if (!target) return { ok: false, error: 'Not found' }
      if (target.status !== 'pending_second' && target.status !== 'pending_first') {
        return { ok: false, error: 'Not awaiting approval' }
      }
      if (target.loggedBy === currentAdmin.id || target.firstApprover === currentAdmin.id) {
        return { ok: false, error: 'You cannot dual-approve your own entry' }
      }
      if (opts?.reasonCode === 'other' && !opts.reasonCodeNote?.trim()) {
        return { ok: false, error: 'Note required for reason code Other' }
      }

      setRefunds((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'approved' as const,
                secondApprover: currentAdmin.id,
                secondApprovedAt: nowIso(),
                reasonCode: opts?.reasonCode,
                reasonCodeNote: opts?.reasonCodeNote,
              }
            : r,
        ),
      )
      pushAudit(currentAdmin, {
        action: 'refund_approved',
        merchantId: target.merchantId,
        entityId: id,
        reasonCode: opts?.reasonCode,
        reasonNote: opts?.reasonCodeNote,
        detail: `Second approval for ${target.receiptId}`,
      })
      return { ok: true }
    },
    [currentAdmin, refunds, pushAudit],
  )

  const rejectRefund = useCallback(
    (id: string, rejectReason: string) => {
      if (!currentAdmin) return { ok: false, error: 'Not signed in' }
      if (!rejectReason.trim()) return { ok: false, error: 'Reject reason required' }
      const target = refunds.find((r) => r.id === id)
      if (!target) return { ok: false, error: 'Not found' }
      setRefunds((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'rejected' as const,
                rejector: currentAdmin.id,
                rejectedAt: nowIso(),
                rejectReason: rejectReason.trim(),
              }
            : r,
        ),
      )
      pushAudit(currentAdmin, {
        action: 'refund_rejected',
        merchantId: target.merchantId,
        entityId: id,
        detail: rejectReason.trim(),
      })
      return { ok: true }
    },
    [currentAdmin, refunds, pushAudit],
  )

  const markRefundProcessed = useCallback(
    (id: string) => {
      if (!currentAdmin) return
      const target = refunds.find((r) => r.id === id)
      if (!target || target.status !== 'approved') return
      setRefunds((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: 'processed' as const, processedAt: nowIso() }
            : r,
        ),
      )
      pushAudit(currentAdmin, {
        action: 'refund_processed',
        merchantId: target.merchantId,
        entityId: id,
        detail: `Marked ${target.receiptId} processed (HitPay outside system)`,
      })
    },
    [currentAdmin, refunds, pushAudit],
  )

  const reviewFlaggedTx = useCallback(
    (id: string) => {
      if (!currentAdmin) return
      const tx = transactions.find((t) => t.id === id)
      if (!tx) return
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status: 'reviewed' as const,
                reviewedBy: currentAdmin.id,
                reviewedAt: nowIso(),
              }
            : t,
        ),
      )
      pushAudit(currentAdmin, {
        action: 'flagged_reviewed',
        merchantId: tx.merchantId,
        entityId: id,
        detail: `Reviewed flagged transaction ${id}`,
      })
    },
    [currentAdmin, transactions, pushAudit],
  )

  const requestPayoutOverride = useCallback(
    (input: {
      merchantId: string
      period: string
      amount: number
      notes: string
      reasonCode: ReasonCode
      reasonCodeNote?: string
    }) => {
      if (!currentAdmin) return
      if (input.reasonCode === 'other' && !input.reasonCodeNote?.trim()) return
      const id = uid('po')
      const row: PayoutOverride = {
        id,
        merchantId: input.merchantId,
        period: input.period,
        amount: input.amount,
        notes: input.notes,
        status: 'pending_second',
        loggedBy: currentAdmin.id,
        loggedAt: nowIso(),
        firstApprover: currentAdmin.id,
        firstApprovedAt: nowIso(),
        reasonCode: input.reasonCode,
        reasonCodeNote: input.reasonCodeNote,
      }
      setPayoutOverrides((prev) => [row, ...prev])
      pushAudit(currentAdmin, {
        action: 'payout_override_requested',
        merchantId: input.merchantId,
        entityId: id,
        reasonCode: input.reasonCode,
        reasonNote: input.reasonCodeNote,
        detail: `Payout override RM${input.amount} for ${input.period}`,
      })
    },
    [currentAdmin, pushAudit],
  )

  const approvePayoutOverride = useCallback(
    (id: string) => {
      if (!currentAdmin) return { ok: false, error: 'Not signed in' }
      const target = payoutOverrides.find((p) => p.id === id)
      if (!target) return { ok: false, error: 'Not found' }
      if (target.status !== 'pending_second' && target.status !== 'pending_first') {
        return { ok: false, error: 'Not awaiting approval' }
      }
      if (target.loggedBy === currentAdmin.id || target.firstApprover === currentAdmin.id) {
        return { ok: false, error: 'You cannot dual-approve your own entry' }
      }
      setPayoutOverrides((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: 'approved' as const,
                secondApprover: currentAdmin.id,
                secondApprovedAt: nowIso(),
              }
            : p,
        ),
      )
      pushAudit(currentAdmin, {
        action: 'payout_override_approved',
        merchantId: target.merchantId,
        entityId: id,
        reasonCode: target.reasonCode,
        detail: `Second approval for payout override RM${target.amount}`,
      })
      return { ok: true }
    },
    [currentAdmin, payoutOverrides, pushAudit],
  )

  const rejectPayoutOverride = useCallback(
    (id: string, rejectReason: string) => {
      if (!currentAdmin) return { ok: false, error: 'Not signed in' }
      if (!rejectReason.trim()) return { ok: false, error: 'Reject reason required' }
      const target = payoutOverrides.find((p) => p.id === id)
      if (!target) return { ok: false, error: 'Not found' }
      setPayoutOverrides((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: 'rejected' as const,
                rejector: currentAdmin.id,
                rejectedAt: nowIso(),
                rejectReason: rejectReason.trim(),
              }
            : p,
        ),
      )
      pushAudit(currentAdmin, {
        action: 'payout_override_rejected',
        merchantId: target.merchantId,
        entityId: id,
        detail: rejectReason.trim(),
      })
      return { ok: true }
    },
    [currentAdmin, payoutOverrides, pushAudit],
  )

  const createExperiment = useCallback(
    (input: {
      name: string
      hypothesis: string
      startDate: string
      endDate: string | null
    }) => {
      if (!currentAdmin || !input.name.trim() || !input.hypothesis.trim()) return null
      const id = uid('exp')
      const row: MarketingExperiment = {
        id,
        name: input.name.trim(),
        hypothesis: input.hypothesis.trim(),
        startDate: input.startDate,
        endDate: input.endDate,
        status: 'active',
        learnings: '',
        createdBy: currentAdmin.id,
        createdAt: nowIso(),
      }
      setExperiments((prev) => [row, ...prev])
      pushAudit(currentAdmin, {
        action: 'experiment_created',
        entityId: id,
        detail: `Created experiment: ${row.name}`,
      })
      return id
    },
    [currentAdmin, pushAudit],
  )

  const concludeExperiment = useCallback(
    (id: string, learnings: string) => {
      if (!currentAdmin) return
      setExperiments((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                status: 'concluded' as const,
                learnings: learnings.trim(),
                endDate: e.endDate ?? nowIso().slice(0, 10),
              }
            : e,
        ),
      )
      pushAudit(currentAdmin, {
        action: 'experiment_concluded',
        entityId: id,
        detail: `Concluded experiment ${id}`,
      })
    },
    [currentAdmin, pushAudit],
  )

  const addPost = useCallback(
    (input: {
      experimentId: string
      platform: SocialPlatform
      url: string
      postedAt: string
      contentType: ContentType
      hook: string
      metrics: Omit<PostMetrics, 'updatedAt' | 'source'>
    }) => {
      if (!currentAdmin || !input.url.trim() || !input.hook.trim()) return
      const id = uid('mp')
      const row: MarketingPost = {
        id,
        experimentId: input.experimentId,
        platform: input.platform,
        url: input.url.trim(),
        postedAt: input.postedAt,
        postedBy: currentAdmin.id,
        contentType: input.contentType,
        hook: input.hook.trim(),
        metrics: {
          ...input.metrics,
          updatedAt: nowIso(),
          source: 'manual',
        },
      }
      setPosts((prev) => [row, ...prev])
      pushAudit(currentAdmin, {
        action: 'post_logged',
        entityId: id,
        detail: `Logged ${input.platform} post under ${input.experimentId}`,
      })
    },
    [currentAdmin, pushAudit],
  )

  const updatePost = useCallback(
    (
      id: string,
      input: {
        platform: SocialPlatform
        url: string
        postedAt: string
        contentType: ContentType
        hook: string
        metrics: Omit<PostMetrics, 'updatedAt' | 'source'>
      },
    ) => {
      if (!currentAdmin) return
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                platform: input.platform,
                url: input.url.trim(),
                postedAt: input.postedAt,
                contentType: input.contentType,
                hook: input.hook.trim(),
                metrics: {
                  ...input.metrics,
                  updatedAt: nowIso(),
                  source: 'manual',
                },
              }
            : p,
        ),
      )
      pushAudit(currentAdmin, {
        action: 'post_updated',
        entityId: id,
        detail: `Updated post ${id} metrics/fields`,
      })
    },
    [currentAdmin, pushAudit],
  )

  const value = useMemo<AdminStore>(
    () => ({
      currentAdmin,
      merchants,
      refunds,
      transactions,
      reconciliation,
      payoutOverrides,
      audit,
      experiments,
      posts,
      login,
      logout,
      switchAdmin,
      addNote,
      suspendMerchant,
      reactivateMerchant,
      extendSubscription,
      waiveSubscription,
      logRefund,
      approveRefund,
      rejectRefund,
      markRefundProcessed,
      reviewFlaggedTx,
      requestPayoutOverride,
      approvePayoutOverride,
      rejectPayoutOverride,
      createExperiment,
      concludeExperiment,
      addPost,
      updatePost,
    }),
    [
      currentAdmin,
      merchants,
      refunds,
      transactions,
      reconciliation,
      payoutOverrides,
      audit,
      experiments,
      posts,
      login,
      logout,
      switchAdmin,
      addNote,
      suspendMerchant,
      reactivateMerchant,
      extendSubscription,
      waiveSubscription,
      logRefund,
      approveRefund,
      rejectRefund,
      markRefundProcessed,
      reviewFlaggedTx,
      requestPayoutOverride,
      approvePayoutOverride,
      rejectPayoutOverride,
      createExperiment,
      concludeExperiment,
      addPost,
      updatePost,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAdminStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAdminStore must be used within AdminStoreProvider')
  return ctx
}
