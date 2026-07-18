'use client'

import type { ReactNode } from 'react'
import type { AdminScreen, AdminUser } from '@/data/types'
import { ADMINS } from '@/data/mock'
import type { AdminId } from '@/data/types'
import {
  IconAudit,
  IconCard,
  IconHome,
  IconLogout,
  IconMegaphone,
  IconRefund,
  IconScale,
  IconTx,
  IconUsers,
} from './icons'

const nav: { id: AdminScreen; label: string; icon: typeof IconHome }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: IconHome },
  { id: 'merchants', label: 'Merchants', icon: IconUsers },
  { id: 'refunds', label: 'Refunds', icon: IconRefund },
  { id: 'subscriptions', label: 'Subscriptions', icon: IconCard },
  { id: 'transactions', label: 'Transactions', icon: IconTx },
  { id: 'reconciliation', label: 'Reconciliation', icon: IconScale },
  { id: 'marketing', label: 'Marketing', icon: IconMegaphone },
  { id: 'audit', label: 'Audit Log', icon: IconAudit },
]

type ShellProps = {
  admin: AdminUser
  activeScreen: AdminScreen
  queueCounts: {
    refunds: number
    suspensions: number
    flagged: number
    dualApprovals: number
  }
  onNavigate: (screen: AdminScreen) => void
  onSwitchAdmin: (id: AdminId) => void
  onLogout: () => void
  children: ReactNode
}

export function Shell({
  admin,
  activeScreen,
  queueCounts,
  onNavigate,
  onSwitchAdmin,
  onLogout,
  children,
}: ShellProps) {
  const screenKey =
    activeScreen === 'merchant-detail'
      ? 'merchants'
      : activeScreen === 'marketing-detail'
        ? 'marketing'
        : activeScreen

  return (
    <div className="flex min-h-dvh bg-linen">
      <aside className="flex w-[240px] shrink-0 flex-col bg-carbon text-paper-white">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
            Miki Admin
          </p>
          <p className="mt-1 text-sm font-semibold tracking-ui">Ops Console</p>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {nav.map((item) => {
            const active = screenKey === item.id
            const Icon = item.icon
            const badge =
              item.id === 'refunds'
                ? queueCounts.refunds
                : item.id === 'subscriptions'
                  ? queueCounts.suspensions
                  : item.id === 'transactions'
                    ? queueCounts.flagged
                    : item.id === 'reconciliation'
                      ? queueCounts.dualApprovals
                      : 0
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={[
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition',
                  active
                    ? 'bg-white/12 text-paper-white'
                    : 'text-white/65 hover:bg-white/6 hover:text-paper-white',
                ].join(' ')}
              >
                <Icon className="shrink-0 opacity-80" />
                <span className="flex-1 tracking-ui">{item.label}</span>
                {badge > 0 && (
                  <span className="rounded-full bg-amber px-1.5 py-0.5 text-[10px] font-semibold text-carbon">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <label className="mb-1 block px-2 text-[10px] uppercase tracking-[0.12em] text-white/40">
            Acting as
          </label>
          <select
            value={admin.id}
            onChange={(e) => onSwitchAdmin(e.target.value as AdminId)}
            className="mb-2 w-full rounded-lg border border-white/15 bg-white/8 px-2 py-1.5 text-xs text-paper-white outline-none"
          >
            {ADMINS.map((a) => (
              <option key={a.id} value={a.id} className="text-carbon">
                {a.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/55 transition hover:bg-white/6 hover:text-paper-white"
          >
            <IconLogout />
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
      </main>
    </div>
  )
}
