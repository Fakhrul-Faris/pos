import type {
  AdminUser,
  AuditEntry,
  MarketingExperiment,
  MarketingPost,
  Merchant,
  PayoutOverride,
  ReconciliationRow,
  RefundRequest,
  SupportSubmission,
  Transaction,
} from './types'

export const ADMINS: AdminUser[] = [
  { id: 'fakhrul', name: 'Fakhrul', email: 'fakhrul@miki.my' },
  { id: 'haziq', name: 'Haziq', email: 'haziq@miki.my' },
  { id: 'helmi', name: 'Helmi', email: 'helmi@miki.my' },
]

/** Shared mock password for all Super Admins (frontend-only). */
export const MOCK_ADMIN_PASSWORD = 'mikiadmin'

export const INITIAL_MERCHANTS: Merchant[] = [
  {
    id: 'm-001',
    businessName: 'Fade Room KL',
    vertical: 'Barbershop',
    status: 'active',
    signupDate: '2026-04-12',
    lastActive: '2026-07-16',
    notes: [
      {
        id: 'n-1',
        adminId: 'fakhrul',
        adminName: 'Fakhrul',
        body: 'Founding barber - locked RM89 promo until Apr 2027.',
        createdAt: '2026-04-12T10:00:00+08:00',
      },
    ],
    owners: [
      {
        id: 'own-001',
        name: 'Amir Razak',
        email: 'amir@faderoom.my',
        role: 'owner',
        bankAccountMasked: 'Maybank .... 4281',
      },
    ],
    brands: [
      {
        id: 'br-001',
        organizationId: 'm-001',
        name: 'Fade Room',
        mrr: 109,
        subscription: {
          plan: 'ocelot',
          status: 'active',
          nextBillingDate: '2026-08-12',
          lastPaymentDate: '2026-07-12',
          lastPaymentAmount: 109,
          graceEndsAt: null,
          paymentHistory: [
            { id: 'pay-1', date: '2026-07-12', amount: 109, status: 'paid' },
            { id: 'pay-2', date: '2026-06-12', amount: 109, status: 'paid' },
            { id: 'pay-3', date: '2026-05-12', amount: 109, status: 'paid' },
          ],
        },
        branches: [
          {
            id: 'bh-001',
            brandId: 'br-001',
            name: 'Fade Room Bukit Bintang',
            address: '12 Jalan Bukit Bintang',
            city: 'Kuala Lumpur',
            hoursSummary: 'Mon-Sat 10:00-20:00',
            isHeadquarters: true,
            isActive: true,
          },
        ],
      },
    ],
  },
  {
    id: 'm-002',
    businessName: 'Clip & Co Sdn Bhd',
    vertical: 'Barbershop',
    status: 'suspension_pending',
    signupDate: '2026-03-01',
    lastActive: '2026-07-14',
    notes: [],
    owners: [
      {
        id: 'own-002',
        name: 'Siti Nur',
        email: 'siti@clipco.my',
        role: 'owner',
        bankAccountMasked: 'CIMB .... 9012',
      },
    ],
    brands: [
      {
        id: 'br-002',
        organizationId: 'm-002',
        name: 'Clip & Co',
        mrr: 199,
        subscription: {
          plan: 'mantis',
          status: 'past_due',
          nextBillingDate: '2026-07-01',
          lastPaymentDate: '2026-06-01',
          lastPaymentAmount: 199,
          graceEndsAt: '2026-07-20',
          paymentHistory: [
            { id: 'pay-4', date: '2026-07-01', amount: 199, status: 'failed' },
            { id: 'pay-5', date: '2026-06-01', amount: 199, status: 'paid' },
            { id: 'pay-6', date: '2026-05-01', amount: 199, status: 'paid' },
          ],
        },
        branches: [
          {
            id: 'bh-002a',
            brandId: 'br-002',
            name: 'Clip & Co Bangsar',
            address: '45 Jalan Telawi 3',
            city: 'Kuala Lumpur',
            hoursSummary: 'Daily 10:00-21:00',
            isHeadquarters: true,
            isActive: true,
          },
          {
            id: 'bh-002b',
            brandId: 'br-002',
            name: 'Clip & Co Damansara',
            address: '88 Persiaran Tropicana',
            city: 'Petaling Jaya',
            hoursSummary: 'Daily 11:00-20:00',
            isHeadquarters: false,
            isActive: true,
          },
        ],
      },
    ],
  },
  {
    id: 'm-003',
    businessName: 'Barber Bros PJ',
    vertical: 'Barbershop',
    status: 'active',
    signupDate: '2026-07-13',
    lastActive: '2026-07-16',
    notes: [],
    owners: [
      {
        id: 'own-003',
        name: 'Lim Wei',
        email: 'wei@barberbros.my',
        role: 'owner',
        bankAccountMasked: 'Maybank .... 3310',
      },
    ],
    brands: [
      {
        id: 'br-003',
        organizationId: 'm-003',
        name: 'Barber Bros',
        mrr: 0,
        subscription: {
          plan: 'trial',
          status: 'active',
          nextBillingDate: '2026-07-19',
          lastPaymentDate: null,
          lastPaymentAmount: null,
          graceEndsAt: null,
          paymentHistory: [],
        },
        branches: [
          {
            id: 'bh-003',
            brandId: 'br-003',
            name: 'Barber Bros SS2',
            address: '21 Jalan SS2/24',
            city: 'Petaling Jaya',
            hoursSummary: 'Tue-Sun 10:00-19:00',
            isHeadquarters: true,
            isActive: true,
          },
        ],
      },
    ],
  },
  {
    id: 'm-004',
    businessName: 'Sharp Edge Cheras',
    vertical: 'Barbershop',
    status: 'active',
    signupDate: '2026-02-18',
    lastActive: '2026-07-10',
    notes: [],
    owners: [
      {
        id: 'own-004',
        name: 'Hafiz Ali',
        email: 'hafiz@sharpedge.my',
        role: 'owner',
        bankAccountMasked: 'RHB .... 7744',
      },
    ],
    brands: [
      {
        id: 'br-004',
        organizationId: 'm-004',
        name: 'Sharp Edge',
        mrr: 0,
        subscription: {
          plan: 'lite',
          status: 'active',
          nextBillingDate: '-',
          lastPaymentDate: null,
          lastPaymentAmount: null,
          graceEndsAt: null,
          paymentHistory: [],
        },
        branches: [
          {
            id: 'bh-004',
            brandId: 'br-004',
            name: 'Sharp Edge Cheras',
            address: '3 Jalan Cheras Utama',
            city: 'Kuala Lumpur',
            hoursSummary: 'Wed-Mon 11:00-20:00',
            isHeadquarters: true,
            isActive: true,
          },
        ],
      },
    ],
  },
  {
    id: 'm-005',
    businessName: 'Queen Cuts Mont Kiara',
    vertical: 'Salon',
    status: 'suspended',
    signupDate: '2026-01-20',
    lastActive: '2026-06-28',
    notes: [
      {
        id: 'n-2',
        adminId: 'helmi',
        adminName: 'Helmi',
        body: 'Suspended after repeated failed billing + no response.',
        createdAt: '2026-07-02T14:20:00+08:00',
      },
    ],
    owners: [
      {
        id: 'own-005',
        name: 'Aisha Rahman',
        email: 'aisha@queencuts.my',
        role: 'owner',
        bankAccountMasked: 'Maybank .... 5520',
      },
    ],
    brands: [
      {
        id: 'br-005',
        organizationId: 'm-005',
        name: 'Queen Cuts',
        mrr: 0,
        subscription: {
          plan: 'ocelot',
          status: 'cancelled',
          nextBillingDate: '-',
          lastPaymentDate: '2026-05-20',
          lastPaymentAmount: 109,
          graceEndsAt: null,
          paymentHistory: [
            { id: 'pay-7', date: '2026-06-20', amount: 109, status: 'failed' },
            { id: 'pay-8', date: '2026-05-20', amount: 109, status: 'paid' },
          ],
        },
        branches: [
          {
            id: 'bh-005',
            brandId: 'br-005',
            name: 'Queen Cuts Mont Kiara',
            address: 'Plaza Mont Kiara, Lot 2-12',
            city: 'Kuala Lumpur',
            hoursSummary: 'Tue-Sun 10:00-19:00',
            isHeadquarters: true,
            isActive: false,
          },
        ],
      },
    ],
  },
  {
    id: 'm-006',
    businessName: 'Trim Lab Group',
    vertical: 'Barbershop',
    status: 'active',
    signupDate: '2026-05-22',
    lastActive: '2026-07-15',
    notes: [],
    owners: [
      {
        id: 'own-006',
        name: 'Jason Tan',
        email: 'jason@trimlab.my',
        role: 'owner',
        bankAccountMasked: 'HSBC .... 1199',
      },
      {
        id: 'own-006b',
        name: 'Mei Ling',
        email: 'mei@trimlab.my',
        role: 'billing',
        bankAccountMasked: 'HSBC .... 1199',
      },
    ],
    brands: [
      {
        id: 'br-006a',
        organizationId: 'm-006',
        name: 'Trim Lab',
        mrr: 109,
        subscription: {
          plan: 'ocelot',
          status: 'active',
          nextBillingDate: '2026-08-22',
          lastPaymentDate: '2026-07-22',
          lastPaymentAmount: 109,
          graceEndsAt: null,
          paymentHistory: [
            { id: 'pay-9', date: '2026-07-22', amount: 109, status: 'paid' },
            { id: 'pay-10', date: '2026-06-22', amount: 109, status: 'paid' },
          ],
        },
        branches: [
          {
            id: 'bh-006a',
            brandId: 'br-006a',
            name: 'Trim Lab Ampang',
            address: '9 Jalan Ampang',
            city: 'Kuala Lumpur',
            hoursSummary: 'Mon-Sat 10:00-20:00',
            isHeadquarters: true,
            isActive: true,
          },
        ],
      },
      {
        id: 'br-006b',
        organizationId: 'm-006',
        name: 'Trim Lab Kids',
        mrr: 0,
        subscription: {
          plan: 'lite',
          status: 'active',
          nextBillingDate: '-',
          lastPaymentDate: null,
          lastPaymentAmount: null,
          graceEndsAt: null,
          paymentHistory: [],
        },
        branches: [
          {
            id: 'bh-006b',
            brandId: 'br-006b',
            name: 'Trim Lab Kids Ampang',
            address: '9 Jalan Ampang (unit B)',
            city: 'Kuala Lumpur',
            hoursSummary: 'Weekends 09:00-17:00',
            isHeadquarters: true,
            isActive: true,
          },
        ],
      },
    ],
  },
]

/** Org display name */
export function merchantName(merchants: Merchant[], id: string) {
  return merchants.find((m) => m.id === id)?.businessName ?? id
}

export function orgMrr(m: Merchant) {
  return m.brands.reduce((s, b) => s + b.mrr, 0)
}

export function branchCount(m: Merchant) {
  return m.brands.reduce((s, b) => s + b.branches.length, 0)
}

export function primaryOwner(m: Merchant) {
  return m.owners.find((o) => o.role === 'owner') ?? m.owners[0]
}

export function primaryBrand(m: Merchant) {
  return m.brands[0]
}

export function allBrandRows(merchants: Merchant[]) {
  return merchants.flatMap((m) =>
    m.brands.map((b) => ({
      organization: m,
      brand: b,
    })),
  )
}

/** Resolve Brand / Branch labels for Finance context columns */
export function brandName(merchants: Merchant[], merchantId: string, brandId?: string) {
  if (!brandId) return null
  const org = merchants.find((m) => m.id === merchantId)
  return org?.brands.find((b) => b.id === brandId)?.name ?? brandId
}

export function branchName(
  merchants: Merchant[],
  merchantId: string,
  brandId?: string,
  branchId?: string,
) {
  if (!branchId) return null
  const org = merchants.find((m) => m.id === merchantId)
  if (!org) return branchId
  for (const b of org.brands) {
    if (brandId && b.id !== brandId) continue
    const bh = b.branches.find((x) => x.id === branchId)
    if (bh) return bh.name
  }
  return branchId
}

export function financeContextLabel(
  merchants: Merchant[],
  merchantId: string,
  brandId?: string,
  branchId?: string,
) {
  const brand = brandName(merchants, merchantId, brandId)
  const branch = branchName(merchants, merchantId, brandId, branchId)
  if (brand && branch) return `${brand} · ${branch}`
  if (brand) return brand
  if (branch) return branch
  return null
}


export const INITIAL_REFUNDS: RefundRequest[] = [
  {
    id: 'rf-001',
    merchantId: 'm-001',
    brandId: 'br-001',
    branchId: 'bh-001',
    receiptId: 'RCP-88421',
    amount: 45,
    reason: 'Customer charged twice for same cut',
    notes: 'Merchant WhatsApped screenshots',
    status: 'pending_second',
    loggedBy: 'fakhrul',
    loggedAt: '2026-07-15T11:30:00+08:00',
    firstApprover: 'fakhrul',
    firstApprovedAt: '2026-07-15T11:30:00+08:00',
  },
  {
    id: 'rf-002',
    merchantId: 'm-006',
    brandId: 'br-006a',
    branchId: 'bh-006a',
    receiptId: 'RCP-90102',
    amount: 80,
    reason: 'Service not completed - walkout',
    notes: '',
    status: 'pending_first',
    loggedBy: 'helmi',
    loggedAt: '2026-07-16T09:15:00+08:00',
  },
  {
    id: 'rf-003',
    merchantId: 'm-002',
    brandId: 'br-002',
    branchId: 'bh-002a',
    receiptId: 'RCP-77210',
    amount: 120,
    reason: 'Wrong amount on dynamic QR',
    notes: 'Platform error suspected',
    status: 'approved',
    loggedBy: 'haziq',
    loggedAt: '2026-07-10T16:00:00+08:00',
    firstApprover: 'haziq',
    firstApprovedAt: '2026-07-10T16:00:00+08:00',
    secondApprover: 'fakhrul',
    secondApprovedAt: '2026-07-10T17:20:00+08:00',
    reasonCode: 'platform_error',
  },
]

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1001',
    merchantId: 'm-001',
    brandId: 'br-001',
    branchId: 'bh-001',
    amount: 45,
    surcharge: 0.9,
    settlementAmount: 44.1,
    timestamp: '2026-07-16T10:22:00+08:00',
    method: 'duitnow_qr',
    status: 'completed',
  },
  {
    id: 'tx-1002',
    merchantId: 'm-002',
    brandId: 'br-002',
    branchId: 'bh-002b',
    amount: 200,
    surcharge: 4,
    settlementAmount: 196,
    timestamp: '2026-07-16T09:05:00+08:00',
    method: 'duitnow_qr',
    status: 'flagged',
    hitpayFlagReason: 'Unusual velocity - 8 payments in 12 minutes',
  },
  {
    id: 'tx-1003',
    merchantId: 'm-006',
    brandId: 'br-006a',
    branchId: 'bh-006a',
    amount: 35,
    surcharge: 0.7,
    settlementAmount: 34.3,
    timestamp: '2026-07-15T18:40:00+08:00',
    method: 'card',
    status: 'completed',
  },
  {
    id: 'tx-1004',
    merchantId: 'm-001',
    brandId: 'br-001',
    branchId: 'bh-001',
    amount: 60,
    surcharge: 1.2,
    settlementAmount: 58.8,
    timestamp: '2026-07-15T14:10:00+08:00',
    method: 'duitnow_qr',
    status: 'flagged',
    hitpayFlagReason: 'Card issuer risk score elevated',
  },
  {
    id: 'tx-1005',
    merchantId: 'm-003',
    brandId: 'br-003',
    branchId: 'bh-003',
    amount: 40,
    surcharge: 0,
    settlementAmount: 40,
    timestamp: '2026-07-14T11:00:00+08:00',
    method: 'cash',
    status: 'completed',
  },
  {
    id: 'tx-1006',
    merchantId: 'm-002',
    brandId: 'br-002',
    branchId: 'bh-002a',
    amount: 150,
    surcharge: 3,
    settlementAmount: 147,
    timestamp: '2026-07-13T16:55:00+08:00',
    method: 'duitnow_qr',
    status: 'reviewed',
    hitpayFlagReason: 'Matched known dispute pattern',
    reviewedBy: 'helmi',
    reviewedAt: '2026-07-14T09:00:00+08:00',
  },
]

export const INITIAL_RECONCILIATION: ReconciliationRow[] = [
  {
    merchantId: 'm-001',
    period: '2026-07-01 → 2026-07-15',
    hitpayCollected: 4820,
    surchargeRevenue: 96.4,
    owedToMerchant: 4723.6,
    settledAmount: 4723.6,
  },
  {
    merchantId: 'm-002',
    period: '2026-07-01 → 2026-07-15',
    hitpayCollected: 9100,
    surchargeRevenue: 182,
    owedToMerchant: 8918,
    settledAmount: 8500,
  },
  {
    merchantId: 'm-006',
    period: '2026-07-01 → 2026-07-15',
    hitpayCollected: 2140,
    surchargeRevenue: 42.8,
    owedToMerchant: 2097.2,
    settledAmount: 2097.2,
  },
  {
    merchantId: 'm-003',
    period: '2026-07-01 → 2026-07-15',
    hitpayCollected: 0,
    surchargeRevenue: 0,
    owedToMerchant: 0,
    settledAmount: 0,
  },
]

export const INITIAL_PAYOUT_OVERRIDES: PayoutOverride[] = [
  {
    id: 'po-001',
    merchantId: 'm-002',
    period: '2026-07-01 → 2026-07-15',
    amount: 418,
    notes: 'Top-up remaining settlement after partial DuitNow transfer',
    status: 'pending_first',
    loggedBy: 'haziq',
    loggedAt: '2026-07-16T08:00:00+08:00',
  },
]

export const INITIAL_SUPPORT: SupportSubmission[] = [
  {
    id: 'cs-101',
    merchantId: 'm-001',
    subject: 'Payment stuck after HitPay QR',
    type: 'payment',
    channel: 'in_app',
    priority: 'high',
    status: 'open',
    submittedAt: '2026-07-22T09:14:00+08:00',
    body: 'Customer paid via QR but booking still shows unpaid. Receipt TXN-88421.',
    customerName: 'Ahmad R.',
    resolutionNotes: '',
    resolvedAt: null,
  },
  {
    id: 'cs-102',
    merchantId: 'm-002',
    subject: 'Cannot log in to Owner portal',
    type: 'access',
    channel: 'email',
    priority: 'normal',
    status: 'in_progress',
    submittedAt: '2026-07-21T16:40:00+08:00',
    body: 'Reset link expires immediately. Using Chrome on Mac.',
    customerName: 'Siti N.',
    resolutionNotes: 'Asked for screenshot of reset email. Waiting.',
    resolvedAt: null,
  },
  {
    id: 'cs-103',
    merchantId: 'm-003',
    subject: 'Request invoice PDF for June',
    type: 'billing',
    channel: 'web',
    priority: 'low',
    status: 'open',
    submittedAt: '2026-07-20T11:02:00+08:00',
    body: 'Need branded invoice for accounting.',
    customerName: 'Lee W.',
    resolutionNotes: '',
    resolvedAt: null,
  },
  {
    id: 'cs-104',
    merchantId: 'm-006',
    subject: 'Roster not syncing across branches',
    type: 'product',
    channel: 'in_app',
    priority: 'high',
    status: 'open',
    submittedAt: '2026-07-22T14:20:00+08:00',
    body: 'Trim Lab Ampang roster edits do not show on Kids brand staff view.',
    customerName: 'Jason T.',
    resolutionNotes: '',
    resolvedAt: null,
  },
]

export const INITIAL_AUDIT: AuditEntry[] = [
  {
    id: 'au-001',
    at: '2026-07-15T11:30:00+08:00',
    adminId: 'fakhrul',
    adminName: 'Fakhrul',
    action: 'refund_logged',
    merchantId: 'm-001',
    entityId: 'rf-001',
    detail: 'Logged refund RCP-88421 for RM45',
  },
  {
    id: 'au-002',
    at: '2026-07-14T09:00:00+08:00',
    adminId: 'helmi',
    adminName: 'Helmi',
    action: 'flagged_reviewed',
    merchantId: 'm-002',
    entityId: 'tx-1006',
    detail: 'Marked flagged tx tx-1006 as reviewed — no suspension',
  },
  {
    id: 'au-003',
    at: '2026-07-10T17:20:00+08:00',
    adminId: 'fakhrul',
    adminName: 'Fakhrul',
    action: 'refund_approved',
    merchantId: 'm-002',
    entityId: 'rf-003',
    reasonCode: 'platform_error',
    detail: 'Second approval for refund RCP-77210',
  },
  {
    id: 'au-004',
    at: '2026-07-02T14:20:00+08:00',
    adminId: 'helmi',
    adminName: 'Helmi',
    action: 'merchant_suspended',
    merchantId: 'm-005',
    before: 'suspension_pending',
    after: 'suspended',
    detail: 'Manual suspend — no response after past_due',
  },
  {
    id: 'au-005',
    at: '2026-07-07T10:00:00+08:00',
    adminId: 'fakhrul',
    adminName: 'Fakhrul',
    action: 'experiment_created',
    entityId: 'exp-001',
    detail: 'Created experiment: Week 2 pain-point hooks',
  },
]

export const INITIAL_EXPERIMENTS: MarketingExperiment[] = [
  {
    id: 'exp-001',
    name: 'Week 2: pain-point hooks',
    hypothesis:
      'Pain-point-driven hooks on barbershop audience outperform feature demos on Facebook + Threads',
    startDate: '2026-07-07',
    endDate: null,
    status: 'active',
    learnings: '',
    createdBy: 'fakhrul',
    createdAt: '2026-07-07T10:00:00+08:00',
  },
  {
    id: 'exp-003',
    name: 'Week 3: Reddit owner stories',
    hypothesis: 'Long-form owner testimonials on r/malaysia drive higher-intent comments than memes',
    startDate: '2026-07-14',
    endDate: null,
    status: 'active',
    learnings: '',
    createdBy: 'helmi',
    createdAt: '2026-07-14T11:00:00+08:00',
  },
  {
    id: 'exp-002',
    name: 'Week 1: meme vs testimonial',
    hypothesis: 'Memes get more shares; testimonials get more saves on X and Reddit',
    startDate: '2026-06-23',
    endDate: '2026-07-06',
    status: 'concluded',
    learnings:
      'Memes won shares on X; testimonials got quieter but higher-intent comments on Reddit. Next: pain-point rants.',
    createdBy: 'helmi',
    createdAt: '2026-06-23T09:00:00+08:00',
  },
]

export const INITIAL_POSTS: MarketingPost[] = [
  {
    id: 'mp-001',
    experimentId: 'exp-001',
    platform: 'facebook',
    url: 'https://facebook.com/miki/posts/1001',
    postedAt: '2026-07-08',
    postedBy: 'fakhrul',
    contentType: 'pain_point_rant',
    hook: 'queue-chaos',
    metrics: {
      likes: 42,
      comments: 11,
      shares: 6,
      saves: 3,
      views: 1200,
      updatedAt: '2026-07-15T18:00:00+08:00',
      source: 'manual',
    },
  },
  {
    id: 'mp-002',
    experimentId: 'exp-001',
    platform: 'threads',
    url: 'https://threads.net/@miki/post/1002',
    postedAt: '2026-07-09',
    postedBy: 'helmi',
    contentType: 'pain_point_rant',
    hook: 'queue-chaos',
    metrics: {
      likes: 88,
      comments: 19,
      shares: 14,
      saves: null,
      views: null,
      updatedAt: '2026-07-15T18:00:00+08:00',
      source: 'manual',
    },
  },
  {
    id: 'mp-003',
    experimentId: 'exp-001',
    platform: 'x',
    url: 'https://x.com/miki/status/1003',
    postedAt: '2026-07-10',
    postedBy: 'haziq',
    contentType: 'feature_demo',
    hook: 'calendar-clarity',
    metrics: {
      likes: 31,
      comments: 4,
      shares: 9,
      saves: null,
      views: 2400,
      updatedAt: '2026-07-01T12:00:00+08:00',
      source: 'manual',
    },
  },
  {
    id: 'mp-004',
    experimentId: 'exp-002',
    platform: 'reddit',
    url: 'https://reddit.com/r/malaysia/comments/abc',
    postedAt: '2026-06-25',
    postedBy: 'helmi',
    contentType: 'testimonial',
    hook: 'owner-story',
    metrics: {
      likes: 156,
      comments: 47,
      shares: 12,
      saves: 28,
      views: null,
      updatedAt: '2026-07-06T20:00:00+08:00',
      source: 'manual',
    },
  },
  {
    id: 'mp-005',
    experimentId: 'exp-002',
    platform: 'x',
    url: 'https://x.com/miki/status/998',
    postedAt: '2026-06-26',
    postedBy: 'fakhrul',
    contentType: 'meme',
    hook: 'walk-in-wait',
    metrics: {
      likes: 210,
      comments: 22,
      shares: 64,
      saves: null,
      views: 8900,
      updatedAt: '2026-07-06T20:00:00+08:00',
      source: 'manual',
    },
  },
]

export function formatRM(n: number): string {
  return `RM ${n.toLocaleString('en-MY', {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDate(iso: string): string {
  if (!iso || iso === '-' || iso === '\u2014') return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-MY', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
