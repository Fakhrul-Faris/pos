'use client'

import type { ReactNode } from 'react'
import type { AdminScreen, AdminUser, AdminId } from '@/data/types'
import { ADMINS } from '@/data/mock'
import {
  IconAudit,
  IconCard,
  IconHome,
  IconInbox,
  IconLedger,
  IconLogout,
  IconRefund,
  IconScale,
  IconTx,
  IconUsers,
} from './icons'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuDot,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from './ui/sidebar'

type NavItem = {
  id: AdminScreen
  label: string
  icon: typeof IconHome
}

type NavSection = {
  label?: string
  items: NavItem[]
}

/** Aligns with Admin Portal IA Brief §3.2 */
const navSections: NavSection[] = [
  {
    items: [{ id: 'dashboard', label: 'Dashboard', icon: IconHome }],
  },
  {
    label: 'Merchants',
    items: [
      { id: 'merchants', label: 'Merchants', icon: IconUsers },
      { id: 'subscriptions', label: 'Subscriptions', icon: IconCard },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'refunds', label: 'Refunds', icon: IconRefund },
      { id: 'transactions', label: 'Transactions', icon: IconTx },
      { id: 'reconciliation', label: 'Reconciliation', icon: IconScale },
    ],
  },
  {
    items: [
      { id: 'support', label: 'Support', icon: IconInbox },
      { id: 'accounting', label: 'Accounting', icon: IconLedger },
    ],
  },
  {
    items: [{ id: 'audit', label: 'Audit Log', icon: IconAudit }],
  },
]

type ShellProps = {
  admin: AdminUser
  activeScreen: AdminScreen
  queueCounts: {
    refunds: number
    suspensions: number
    flagged: number
    dualApprovals: number
    support: number
  }
  onNavigate: (screen: AdminScreen) => void
  onSwitchAdmin: (id: AdminId) => void
  onLogout: () => void
  children: ReactNode
}

function queueBadge(
  id: AdminScreen,
  queueCounts: ShellProps['queueCounts'],
): number {
  if (id === 'refunds') return queueCounts.refunds
  if (id === 'subscriptions') return queueCounts.suspensions
  if (id === 'transactions') return queueCounts.flagged
  if (id === 'reconciliation') return queueCounts.dualApprovals
  if (id === 'support') return queueCounts.support
  return 0
}

/**
 * Shell layout using shadcn Sidebar composition
 * @see https://ui.shadcn.com/docs/components/base/sidebar
 */
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
    activeScreen === 'merchant-detail' ? 'merchants' : activeScreen

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="inset" side="left">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-1 py-1">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-sidebar-accent text-[13px] font-semibold text-sidebar-accent-foreground">
              M
            </span>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-[13px] font-semibold tracking-ui text-sidebar-foreground">
                Miki Admin
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/70">
                Ops Console
              </p>
            </div>
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
          </div>
        </SidebarHeader>

        <SidebarContent>
          {navSections.map((section, sectionIndex) => (
            <SidebarGroup key={section.label ?? `s-${sectionIndex}`}>
              {section.label ? (
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              ) : sectionIndex > 0 ? (
                <SidebarSeparator className="mb-2 group-data-[collapsible=icon]:mb-1" />
              ) : null}
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const active = screenKey === item.id
                    const Icon = item.icon
                    const badge = queueBadge(item.id, queueCounts)
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={active}
                          title={item.label}
                          aria-label={
                            badge > 0
                              ? `${item.label} (${badge})`
                              : item.label
                          }
                          aria-current={active ? 'page' : undefined}
                          onClick={() => onNavigate(item.id)}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                        {badge > 0 && (
                          <>
                            <SidebarMenuDot show />
                            <SidebarMenuBadge>{badge}</SidebarMenuBadge>
                          </>
                        )}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <div className="group-data-[collapsible=icon]:hidden">
            <label className="mb-1 block px-2 text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/70">
              Acting as
            </label>
            <select
              value={admin.id}
              onChange={(e) => onSwitchAdmin(e.target.value as AdminId)}
              className="geist-input mb-2"
            >
              {ADMINS.map((a) => (
                <option
                  key={a.id}
                  value={a.id}
                  className="bg-sidebar text-sidebar-foreground"
                >
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative mb-1 hidden justify-center group-data-[collapsible=icon]:flex">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-sidebar-foreground"
            >
              {admin.name.slice(0, 1)}
            </span>
            <select
              value={admin.id}
              onChange={(e) => onSwitchAdmin(e.target.value as AdminId)}
              aria-label={`Acting as ${admin.name}`}
              title={`Acting as ${admin.name}`}
              className="size-8 cursor-pointer appearance-none rounded-full border border-sidebar-border bg-sidebar-accent text-transparent outline-none hover:brightness-110"
            >
              {ADMINS.map((a) => (
                <option
                  key={a.id}
                  value={a.id}
                  className="bg-sidebar text-sidebar-foreground"
                >
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                title="Sign out"
                aria-label="Sign out"
                onClick={onLogout}
              >
                <IconLogout />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
          <div className="container-wrapper flex flex-1 flex-col pb-6">
            <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-8 md:py-6 scroll-mt-20 flex flex-1 flex-col theme-container">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function screenTitle(screen: AdminScreen): string {
  const map: Record<AdminScreen, string> = {
    dashboard: 'Dashboard',
    merchants: 'Merchants',
    'merchant-detail': 'Merchant',
    subscriptions: 'Subscriptions',
    refunds: 'Refunds',
    transactions: 'Transactions',
    reconciliation: 'Reconciliation',
    support: 'Support',
    accounting: 'Accounting',
    audit: 'Audit Log',
  }
  return map[screen] ?? 'Admin'
}
