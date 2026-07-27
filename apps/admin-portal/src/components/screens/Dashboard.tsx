'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useAdminStore } from '@/data/store'
import {
  formatDate,
  formatRM,
  merchantName,
  primaryBrand,
  primaryOwner,
} from '@/data/mock'
import type { AdminScreen } from '@/data/types'
import { PLAN_LABELS } from '@/data/types'
import {
  MerchantStatusBadge,
  RefundStatusBadge,
  DualStatusBadge,
  FlagBadge,
} from '../StatusBadge'
import { IconAlert } from '../icons'
import { Badge, Chip } from '../ui/Badge'
import { Button } from '../ui/Button'
import { TD, TH, TR } from '../ui/Table'

const MS_DAY = 24 * 60 * 60 * 1000
const RECENT_DAYS = 7
const SILENT_DAYS = 7
const TRIAL_WINDOW_DAYS = 7

type Props = {
  queueCounts: {
    refunds: number
    suspensions: number
    flagged: number
    dualApprovals: number
    support: number
  }
  onNavigate: (screen: AdminScreen) => void
  onOpenMerchant: (id: string) => void
}

function daysBetween(iso: string, now: Date) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return Infinity
  return (now.getTime() - d.getTime()) / MS_DAY
}

export function Dashboard({
  queueCounts,
  onNavigate,
  onOpenMerchant,
}: Props) {
  const { merchants, refunds, transactions, payoutOverrides, support } =
    useAdminStore()

  const now = useMemo(() => new Date(), [])

  const pendingRefunds = refunds.filter(
    (r) => r.status === 'pending_first' || r.status === 'pending_second',
  )
  const pendingSuspensions = merchants.filter((m) => m.status === 'suspension_pending')
  const flagged = transactions.filter((t) => t.status === 'flagged')
  const pendingPayouts = payoutOverrides.filter(
    (p) => p.status === 'pending_first' || p.status === 'pending_second',
  )

  const recentSignups = merchants.filter(
    (m) => daysBetween(m.signupDate, now) <= RECENT_DAYS && daysBetween(m.signupDate, now) >= 0,
  )

  const trialsEnding = merchants.filter((m) => {
    const trialBrand = m.brands.find((b) => b.subscription.plan === 'trial')
    if (!trialBrand) return false
    const end = trialBrand.subscription.nextBillingDate
    if (!end || end === '-') return false
    const daysLeft = -daysBetween(end, now)
    return daysLeft >= 0 && daysLeft <= TRIAL_WINDOW_DAYS
  })

  const silentMerchants = merchants.filter((m) => {
    if (m.status === 'suspended' || m.status === 'churned') return false
    return daysBetween(m.lastActive, now) >= SILENT_DAYS
  })

  const supportOpen = support.filter((s) => s.status !== 'resolved')
  const supportHigh = supportOpen.filter((s) => s.priority === 'high')

  const moneyCards = [
    {
      label: 'Pending refunds',
      count: queueCounts.refunds,
      screen: 'refunds' as AdminScreen,
    },
    {
      label: 'Suspension pending',
      count: queueCounts.suspensions,
      screen: 'subscriptions' as AdminScreen,
    },
    {
      label: 'Flagged transactions',
      count: queueCounts.flagged,
      screen: 'transactions' as AdminScreen,
    },
    {
      label: 'Payout dual-approvals',
      count: queueCounts.dualApprovals,
      screen: 'reconciliation' as AdminScreen,
    },
  ]

  const growthCards = [
    {
      label: 'Signups (7d)',
      count: recentSignups.length,
      screen: 'merchants' as AdminScreen,
    },
    {
      label: 'Trials ending (7d)',
      count: trialsEnding.length,
      screen: 'merchants' as AdminScreen,
    },
    {
      label: 'Silent merchants',
      count: silentMerchants.length,
      screen: 'merchants' as AdminScreen,
    },
  ]

  const supportCards = [
    {
      label: 'Open / high priority',
      count: queueCounts.support,
      screen: 'support' as AdminScreen,
    },
    {
      label: 'High priority open',
      count: supportHigh.length,
      screen: 'support' as AdminScreen,
    },
  ]

  const moneyEmpty =
    pendingSuspensions.length +
      pendingRefunds.length +
      flagged.length +
      pendingPayouts.length ===
    0

  const growthEmpty =
    recentSignups.length + trialsEnding.length + silentMerchants.length === 0

  const supportEmpty = supportOpen.length === 0

  type TableTab = 'money' | 'growth' | 'support'
  const [tableTab, setTableTab] = useState<TableTab>('money')

  type ChartRange = '3m' | '30d' | '7d'
  const [chartRange, setChartRange] = useState<ChartRange>('30d')

  const chartValues = useMemo(() => {
    const base =
      queueCounts.refunds * 2 +
      queueCounts.suspensions * 1.6 +
      queueCounts.flagged * 1.2 +
      queueCounts.dualApprovals * 1.4 +
      queueCounts.support * 1.1

    const points = chartRange === '7d' ? 10 : chartRange === '30d' ? 16 : 22
    const scale = chartRange === '7d' ? 0.9 : chartRange === '30d' ? 1.15 : 1.35

    return Array.from({ length: points }, (_, i) => {
      const t = points <= 1 ? 0 : i / (points - 1)
      const wave =
        Math.sin(t * Math.PI * 1.3) * 0.35 + Math.cos(t * Math.PI * 2.1) * 0.18
      const ramp = t * 0.35
      return Math.max(0.1, (base * (0.55 + wave + ramp) * scale) / 10)
    })
  }, [chartRange, queueCounts])

  type DashboardRow = {
    key: string
    typeLabel: string
    title: string
    dueLabel: string
    reviewerLabel: string
    statusNode: ReactNode
    onClick: () => void
  }

  const rows = useMemo<DashboardRow[]>(() => {
    const mkMerchantReviewer = (m: (typeof merchants)[number]) =>
      primaryOwner(m)?.email ?? '-'

    if (tableTab === 'money') {
      return [
        ...pendingSuspensions.map((m) => {
          const pastDue = m.brands.find(
            (b) =>
              b.subscription.status === 'past_due' ||
              Boolean(b.subscription.graceEndsAt),
          )
          const grace =
            pastDue?.subscription.graceEndsAt != null
              ? formatDate(pastDue.subscription.graceEndsAt)
              : null
          const dueLabel = grace ? `Grace ends ${grace}` : 'Pending'
          return {
            key: `susp-${m.id}`,
            typeLabel: 'Suspension',
            title: m.businessName,
            dueLabel,
            reviewerLabel: mkMerchantReviewer(m),
            statusNode: <MerchantStatusBadge status={m.status} />,
            onClick: () => onOpenMerchant(m.id),
          }
        }),
        ...pendingRefunds.map((r) => ({
          key: `refund-${r.id}`,
          typeLabel: 'Refund',
          title: `Refund ${r.receiptId}`,
          dueLabel: `Logged ${formatDate(r.loggedAt)}`,
          reviewerLabel: String(r.loggedBy),
          statusNode: <RefundStatusBadge status={r.status} />,
          onClick: () => onOpenMerchant(r.merchantId),
        })),
        ...flagged.map((t) => ({
          key: `flag-${t.id}`,
          typeLabel: 'Flagged tx',
          title: `Flagged ${t.id}`,
          dueLabel: formatDate(t.timestamp),
          reviewerLabel: t.reviewedBy
            ? String(t.reviewedBy)
            : merchantName(merchants, t.merchantId),
          statusNode: <FlagBadge />,
          onClick: () => onOpenMerchant(t.merchantId),
        })),
        ...pendingPayouts.map((p) => ({
          key: `payout-${p.id}`,
          typeLabel: 'Payout override',
          title: `Payout override · ${formatRM(p.amount)}`,
          dueLabel: p.period,
          reviewerLabel: String(p.loggedBy),
          statusNode: <DualStatusBadge status={p.status} />,
          onClick: () => onOpenMerchant(p.merchantId),
        })),
      ]
    }

    if (tableTab === 'growth') {
      return [
        ...recentSignups.map((m) => ({
          key: `signup-${m.id}`,
          typeLabel: 'Signup',
          title: m.businessName,
          dueLabel: `Signed ${formatDate(m.signupDate)}`,
          reviewerLabel: mkMerchantReviewer(m),
          statusNode: <Badge tone="amber">New signup</Badge>,
          onClick: () => onOpenMerchant(m.id),
        })),
        ...trialsEnding.map((m) => {
          const trialBrand = m.brands.find(
            (b) => b.subscription.plan === 'trial',
          )!
          return {
            key: `trial-${m.id}`,
            typeLabel: 'Trial',
            title: m.businessName,
            dueLabel: `Trial ends ${formatDate(
              trialBrand.subscription.nextBillingDate,
            )}`,
            reviewerLabel: mkMerchantReviewer(m),
            statusNode: <Badge tone="blue">Trial ending</Badge>,
            onClick: () => onOpenMerchant(m.id),
          }
        }),
        ...silentMerchants.map((m) => ({
          key: `silent-${m.id}`,
          typeLabel: 'Reactivation',
          title: m.businessName,
          dueLabel: `Last active ${formatDate(m.lastActive)}`,
          reviewerLabel: mkMerchantReviewer(m),
          statusNode: <Badge tone="gray">Silent</Badge>,
          onClick: () => onOpenMerchant(m.id),
        })),
      ]
    }

    // support
    return supportOpen.map((s) => ({
      key: `support-${s.id}`,
      typeLabel: 'Support',
      title: s.subject,
      dueLabel: formatDate(s.submittedAt),
      reviewerLabel: s.merchantId
        ? merchantName(merchants, s.merchantId)
        : s.customerName,
      statusNode: (
        <Badge tone={s.priority === 'high' ? 'red' : 'gray'}>
          {s.status.replace('_', ' ')}
        </Badge>
      ),
      onClick: () =>
        s.merchantId ? onOpenMerchant(s.merchantId) : onNavigate('support'),
    }))
  }, [
    tableTab,
    pendingSuspensions,
    pendingRefunds,
    flagged,
    pendingPayouts,
    recentSignups,
    trialsEnding,
    silentMerchants,
    supportOpen,
    merchants,
    onOpenMerchant,
    onNavigate,
  ])

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-desc">
          Attention queue — money, signup, support. Not analytics or marketing.
        </p>
      </header>
      {/* Screenshot-style: top stat cards + chart + unified table */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {moneyCards.map((c) => (
          <CountCard
            key={c.label}
            label={c.label}
            count={c.count}
            onClick={() => onNavigate(c.screen)}
          />
        ))}
      </div>

      <section className="geist-panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.1em] text-gray-900">
              Ops activity
            </h2>
            <p className="mt-1 text-[11px] text-gray-900/70">
              A quick signal for current queue pressure.
            </p>
          </div>

          <div className="flex gap-1">
            {(
              [
                ['3m', 'Last 3 months'],
                ['30d', 'Last 30 days'],
                ['7d', 'Last 7 days'],
              ] as const
            ).map(([id, label]) => (
              <Chip key={id} active={chartRange === id} onClick={() => setChartRange(id)}>
                {label}
              </Chip>
            ))}
          </div>
        </div>

        <MiniLineChart values={chartValues} />
      </section>

      <section className="geist-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-400 px-4 py-3">
          <div className="flex flex-wrap gap-1">
            <Chip
              active={tableTab === 'money'}
              onClick={() => setTableTab('money')}
            >
              Money queue ({pendingSuspensions.length + pendingRefunds.length + flagged.length + pendingPayouts.length})
            </Chip>
            <Chip
              active={tableTab === 'growth'}
              onClick={() => setTableTab('growth')}
            >
              Growth ({recentSignups.length + trialsEnding.length + silentMerchants.length})
            </Chip>
            <Chip
              active={tableTab === 'support'}
              onClick={() => setTableTab('support')}
            >
              Support ({supportOpen.length})
            </Chip>
          </div>

          <div className="flex items-center gap-2">
            <Button size="small" variant="secondary">
              Customize Columns
            </Button>
            <Button size="small">Add Section</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="geist-table min-w-[860px]">
            <thead>
              <tr>
                <TH className="w-[40%]">Header</TH>
                <TH className="w-[18%]">Section Type</TH>
                <TH className="w-[14%]">Status</TH>
                <TH className="w-[14%]">Target</TH>
                <TH className="w-[14%]">Reviewer</TH>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((r) => (
                  <TR key={r.key} onClick={r.onClick}>
                    <TD className="cursor-pointer">
                      <p className="font-medium text-gray-1000">{r.title}</p>
                    </TD>
                    <TD muted className="cursor-pointer">
                      {r.typeLabel}
                    </TD>
                    <TD className="cursor-pointer">{r.statusNode}</TD>
                    <TD muted className="cursor-pointer">{r.dueLabel}</TD>
                    <TD muted className="cursor-pointer">{r.reviewerLabel}</TD>
                  </TR>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="!border-0 px-3 py-10 text-center text-gray-900"
                  >
                    No items in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function CountCard({
  label,
  count,
  onClick,
}: {
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[12px] border border-gray-400 bg-gray-100 p-3.5 text-left transition hover:border-gray-500 hover:bg-gray-200"
    >
      <p className="text-[11px] font-medium text-gray-900">{label}</p>
      <p
        className={[
          'mt-1.5 font-mono text-2xl font-semibold tabular-nums tracking-ui',
          count > 0 ? 'text-gray-1000' : 'text-gray-900',
        ].join(' ')}
      >
        {count}
      </p>
    </button>
  )
}

function QueuePanel({
  title,
  icon,
  children,
}: {
  title: string
  icon?: boolean
  children: ReactNode
}) {
  return (
    <div className="rounded-[12px] border border-gray-400 bg-gray-100">
      <div className="flex items-center gap-2 border-b border-gray-400 px-3 py-2">
        {icon && <IconAlert className="text-amber-900" />}
        <h3 className="text-[13px] font-semibold text-gray-1000">{title}</h3>
      </div>
      <ul className="divide-y divide-gray-400">{children}</ul>
    </div>
  )
}

function QueueRow({
  title,
  subtitle,
  onClick,
  trailing,
}: {
  title: string
  subtitle: string
  onClick: () => void
  trailing: ReactNode
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-gray-200"
      >
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-gray-1000">{title}</p>
          <p className="truncate text-[11px] text-gray-900">{subtitle}</p>
        </div>
        <div className="shrink-0">{trailing}</div>
      </button>
    </li>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <li className="px-3 py-6 text-center text-[13px] text-gray-900">{text}</li>
}

function MiniLineChart({ values }: { values: number[] }) {
  const width = 1000
  const height = 240
  const paddingTop = 18
  const paddingBottom = 28

  const min = Math.min(...values)
  const max = Math.max(...values)
  const denom = max - min || 1

  const xFor = (i: number) =>
    values.length <= 1 ? width / 2 : (i * (width - 60)) / (values.length - 1) + 30

  const yFor = (v: number) =>
    paddingTop +
    (height - paddingTop - paddingBottom) * (1 - (v - min) / denom)

  const d = values
    .map((v, i) => {
      const x = xFor(i)
      const y = yFor(v)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')

  const lastX = xFor(values.length - 1)
  const baseY = yFor(min)

  return (
    <div className="mt-4">
      <div className="relative h-[210px] w-full overflow-hidden rounded-[12px] bg-gray-100">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="dash-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgb(250 204 21)" stopOpacity="0.28" />
              <stop offset="1" stopColor="rgb(250 204 21)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grid */}
          {[0, 1, 2, 3].map((i) => {
            const y = 40 + i * 45
            return (
              <path
                key={i}
                d={`M 30 ${y} L ${width - 30} ${y}`}
                stroke="rgba(120,120,120,0.28)"
                strokeWidth="1"
              />
            )
          })}

          {/* area */}
          <path
            d={`${d} L ${lastX.toFixed(2)} ${baseY.toFixed(2)} L 30 ${baseY.toFixed(
              2,
            )} Z`}
            fill="url(#dash-area)"
          />

          {/* line */}
          <path d={d} fill="none" stroke="rgb(161 98 7)" strokeWidth="3" />

          {/* end marker */}
          {values.length > 0 && (
            <>
              <circle
                cx={xFor(values.length - 1)}
                cy={yFor(values[values.length - 1])}
                r="6"
                fill="rgb(161 98 7)"
              />
              <circle
                cx={xFor(values.length - 1)}
                cy={yFor(values[values.length - 1])}
                r="10"
                fill="rgb(161 98 7)"
                opacity="0.18"
              />
            </>
          )}
        </svg>
      </div>
    </div>
  )
}
