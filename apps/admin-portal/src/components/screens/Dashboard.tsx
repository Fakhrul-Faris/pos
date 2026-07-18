'use client'

import { useMemo, type ReactNode } from 'react'
import { useAdminStore } from '@/data/store'
import { formatDate, formatRM, merchantName } from '@/data/mock'
import type { AdminScreen } from '@/data/types'
import { PLATFORM_LABELS } from '@/data/types'
import {
  MerchantStatusBadge,
  RefundStatusBadge,
  DualStatusBadge,
  FlagBadge,
} from '../StatusBadge'
import { IconAlert } from '../icons'

const MS_DAY = 24 * 60 * 60 * 1000
const RECENT_DAYS = 7
const STALE_METRIC_DAYS = 7
const SILENT_DAYS = 7
const TRIAL_WINDOW_DAYS = 7

type Props = {
  queueCounts: {
    refunds: number
    suspensions: number
    flagged: number
    dualApprovals: number
  }
  onNavigate: (screen: AdminScreen) => void
  onOpenMerchant: (id: string) => void
  onOpenExperiment: (id: string) => void
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
  onOpenExperiment,
}: Props) {
  const { merchants, refunds, transactions, payoutOverrides, experiments, posts } =
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
    if (m.plan !== 'trial' && m.subscription.plan !== 'trial') return false
    const end = m.subscription.nextBillingDate
    if (!end || end === '—') return false
    const daysLeft = -daysBetween(end, now)
    return daysLeft >= 0 && daysLeft <= TRIAL_WINDOW_DAYS
  })

  const silentMerchants = merchants.filter((m) => {
    if (m.status === 'suspended' || m.status === 'churned') return false
    return daysBetween(m.lastActive, now) >= SILENT_DAYS
  })

  const activeExperiments = experiments.filter((e) => e.status === 'active')
  const emptyExperiments = activeExperiments.filter(
    (e) => posts.filter((p) => p.experimentId === e.id).length === 0,
  )
  const stalePosts = posts.filter((p) => {
    const exp = experiments.find((e) => e.id === p.experimentId)
    if (!exp || exp.status !== 'active') return false
    if (!p.metrics.updatedAt) return true
    return daysBetween(p.metrics.updatedAt, now) >= STALE_METRIC_DAYS
  })

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

  const marketingCards = [
    {
      label: 'Active experiments',
      count: activeExperiments.length,
      screen: 'marketing' as AdminScreen,
    },
    {
      label: 'Empty experiments',
      count: emptyExperiments.length,
      screen: 'marketing' as AdminScreen,
    },
    {
      label: 'Stale metric check-ins',
      count: stalePosts.length,
      screen: 'marketing' as AdminScreen,
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

  const marketingEmpty =
    emptyExperiments.length + stalePosts.length === 0 && activeExperiments.length === 0

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-ui text-carbon">Dashboard</h1>
        <p className="mt-1 text-sm text-graphite">
          Ops + growth attention queue — decisions and check-ins, not analytics charts.
        </p>
      </header>

      {/* Money */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-ash">
          Ops / money
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {moneyCards.map((c) => (
            <CountCard
              key={c.label}
              label={c.label}
              count={c.count}
              onClick={() => onNavigate(c.screen)}
            />
          ))}
        </div>
        <QueuePanel title="Needs decision" icon>
          {pendingSuspensions.map((m) => (
            <QueueRow
              key={m.id}
              title={m.businessName}
              subtitle={`Past due · grace ends ${m.subscription.graceEndsAt ?? '—'}`}
              onClick={() => onOpenMerchant(m.id)}
              trailing={<MerchantStatusBadge status={m.status} />}
            />
          ))}
          {pendingRefunds.map((r) => (
            <QueueRow
              key={r.id}
              title={`Refund ${r.receiptId} · ${formatRM(r.amount)}`}
              subtitle={`${merchantName(merchants, r.merchantId)} · logged by ${r.loggedBy}`}
              onClick={() => onNavigate('refunds')}
              trailing={<RefundStatusBadge status={r.status} />}
            />
          ))}
          {flagged.map((t) => (
            <QueueRow
              key={t.id}
              title={`Flagged ${t.id} · ${formatRM(t.amount)}`}
              subtitle={`${merchantName(merchants, t.merchantId)} · ${t.hitpayFlagReason}`}
              onClick={() => onNavigate('transactions')}
              trailing={<FlagBadge />}
            />
          ))}
          {pendingPayouts.map((p) => (
            <QueueRow
              key={p.id}
              title={`Payout override · ${formatRM(p.amount)}`}
              subtitle={`${merchantName(merchants, p.merchantId)} · ${p.period}`}
              onClick={() => onNavigate('reconciliation')}
              trailing={<DualStatusBadge status={p.status} />}
            />
          ))}
          {moneyEmpty && <EmptyRow text="No money items waiting." />}
        </QueuePanel>
      </section>

      {/* Growth */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-ash">
          Growth / signup
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {growthCards.map((c) => (
            <CountCard
              key={c.label}
              label={c.label}
              count={c.count}
              onClick={() => onNavigate(c.screen)}
            />
          ))}
        </div>
        <QueuePanel title="Follow up">
          {recentSignups.map((m) => (
            <QueueRow
              key={`signup-${m.id}`}
              title={m.businessName}
              subtitle={`Signed up ${formatDate(m.signupDate)} · ${m.ownerEmail}`}
              onClick={() => onOpenMerchant(m.id)}
              trailing={
                <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-medium text-graphite">
                  New signup
                </span>
              }
            />
          ))}
          {trialsEnding.map((m) => (
            <QueueRow
              key={`trial-${m.id}`}
              title={m.businessName}
              subtitle={`Trial ends ${formatDate(m.subscription.nextBillingDate)} · then Lite or paid`}
              onClick={() => onOpenMerchant(m.id)}
              trailing={
                <span className="rounded-full bg-[#fff4e0] px-2 py-0.5 text-xs font-medium text-amber">
                  Trial ending
                </span>
              }
            />
          ))}
          {silentMerchants.map((m) => (
            <QueueRow
              key={`silent-${m.id}`}
              title={m.businessName}
              subtitle={`Last active ${formatDate(m.lastActive)} · ${m.plan}`}
              onClick={() => onOpenMerchant(m.id)}
              trailing={
                <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-medium text-ash">
                  Silent
                </span>
              }
            />
          ))}
          {growthEmpty && <EmptyRow text="No signup follow-ups right now." />}
        </QueuePanel>
      </section>

      {/* Marketing */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-ash">
          Marketing (organic)
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {marketingCards.map((c) => (
            <CountCard
              key={c.label}
              label={c.label}
              count={c.count}
              onClick={() => onNavigate(c.screen)}
            />
          ))}
        </div>
        <QueuePanel title="Check-ins">
          {emptyExperiments.map((e) => (
            <QueueRow
              key={`empty-${e.id}`}
              title={e.name}
              subtitle="Active experiment with 0 posts — log the first organic post"
              onClick={() => onOpenExperiment(e.id)}
              trailing={
                <span className="rounded-full bg-[#fff4e0] px-2 py-0.5 text-xs font-medium text-amber">
                  Empty
                </span>
              }
            />
          ))}
          {stalePosts.map((p) => {
            const exp = experiments.find((e) => e.id === p.experimentId)
            return (
              <QueueRow
                key={`stale-${p.id}`}
                title={`${PLATFORM_LABELS[p.platform]} · ${p.hook}`}
                subtitle={`${exp?.name ?? p.experimentId} · metrics last updated ${p.metrics.updatedAt ? formatDate(p.metrics.updatedAt) : 'never'}`}
                onClick={() => onOpenExperiment(p.experimentId)}
                trailing={
                  <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-medium text-graphite">
                    Stale metrics
                  </span>
                }
              />
            )
          })}
          {marketingEmpty && (
            <EmptyRow text="No marketing check-ins. Create an experiment to start." />
          )}
          {!marketingEmpty &&
            emptyExperiments.length === 0 &&
            stalePosts.length === 0 && (
              <EmptyRow text="Active experiments look fresh — no check-ins due." />
            )}
        </QueuePanel>
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
      className="rounded-xl border border-fog bg-paper-white p-4 text-left shadow-subtle-2 transition hover:border-lavender"
    >
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-ash">{label}</p>
      <p
        className={[
          'mt-2 text-3xl font-semibold tabular-nums tracking-ui',
          count > 0 ? 'text-carbon' : 'text-ash',
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
    <div className="rounded-xl border border-fog bg-paper-white shadow-subtle-2">
      <div className="flex items-center gap-2 border-b border-fog px-4 py-3">
        {icon && <IconAlert className="text-amber" />}
        <h3 className="text-sm font-semibold text-carbon">{title}</h3>
      </div>
      <ul className="divide-y divide-fog">{children}</ul>
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
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-mist"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-carbon">{title}</p>
          <p className="truncate text-xs text-ash">{subtitle}</p>
        </div>
        <div className="shrink-0">{trailing}</div>
      </button>
    </li>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <li className="px-4 py-6 text-center text-sm text-ash">{text}</li>
}
