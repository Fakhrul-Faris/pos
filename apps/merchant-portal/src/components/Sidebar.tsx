'use client'

import { useMemo, useState } from 'react'
import type { PortalScreen } from '../data/mock'
import {
  IconCalendar,
  IconChevronLeft,
  IconCreditCard,
  IconHelp,
  IconHome,
  IconLogout,
  IconReceipt,
  IconSettings,
  IconUsers,
  IconUserCircle,
  IconList,
  IconChart,
} from './icons'
import { SidebarLink } from './SidebarLink'

type NavId =
  | PortalScreen
  | 'inventory'
  | 'roster'
  | 'leave'
  | 'payroll'
  | 'accounting'

type NavItem = {
  id: NavId
  label: string
  icon: typeof IconHome
  dynamic?: boolean
  /** Wired in prototype */
  live?: boolean
}

type NavSection = {
  label?: string
  items: NavItem[]
}

/** Aligns with Merchant Portal IA Brief §4.2 */
const navSections: NavSection[] = [
  {
    items: [{ id: 'dashboard', label: 'Dashboard', icon: IconHome, live: true }],
  },
  {
    label: 'Schedule',
    items: [
      { id: 'calendar', label: 'Calendar', icon: IconCalendar, live: true },
      { id: 'bookings', label: 'Bookings', icon: IconReceipt, live: true },
      { id: 'customers', label: 'Customers', icon: IconUsers, live: true },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { id: 'services', label: 'Services', icon: IconList, live: true },
      { id: 'inventory', label: 'Inventory', icon: IconList, live: true },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'staff', label: 'Staff', icon: IconUserCircle, dynamic: true, live: true },
      { id: 'roster', label: 'Roster', icon: IconCalendar, live: true },
      { id: 'leave', label: 'Leave', icon: IconUsers, live: true },
      { id: 'payroll', label: 'Payroll', icon: IconReceipt, live: true },
    ],
  },
  {
    label: 'Money',
    items: [
      { id: 'payments', label: 'Payments', icon: IconCreditCard, live: true },
      { id: 'reports', label: 'Reports', icon: IconChart, live: true },
      { id: 'accounting', label: 'Accounting', icon: IconChart, live: true },
    ],
  },
  {
    items: [{ id: 'settings', label: 'Settings', icon: IconSettings, live: true }],
  },
]

type SidebarProps = {
  businessName: string
  staffLabel?: string
  collapsed: boolean
  activeScreen: PortalScreen
  onNavigate: (screen: PortalScreen) => void
  onToggle: () => void
}

export function Sidebar({
  businessName,
  staffLabel = 'Staff',
  collapsed,
  activeScreen,
  onNavigate,
  onToggle,
}: SidebarProps) {
  const [hovered, setHovered] = useState(false)
  const isExpanded = !collapsed || hovered

  return (
    <aside
      onMouseEnter={() => collapsed && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        'm-px flex h-full shrink-0 flex-col overflow-hidden rounded-xl border border-fog bg-paper-white transition-[width] duration-200 ease-out',
        isExpanded ? 'w-[240px]' : 'w-14',
      ].join(' ')}
    >
      <div
        className={[
          'flex w-full items-center py-5',
          isExpanded ? 'gap-2 px-4' : 'flex-col justify-center gap-2 px-2',
        ].join(' ')}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-carbon">
          <span className="font-display text-xs font-semibold text-paper-white">M</span>
        </div>
        <div
          className={[
            'min-w-0 flex-1 transition-all duration-200',
            isExpanded ? 'opacity-100' : 'hidden',
          ].join(' ')}
        >
          <p className="truncate font-display text-sm font-semibold tracking-ui text-carbon">
            Miki
          </p>
          <p className="truncate text-xs text-ash">{businessName}</p>
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ash transition-colors hover:bg-linen hover:text-carbon"
          >
            <IconChevronLeft />
          </button>
        )}
      </div>

      <nav
        className={[
          'flex flex-1 flex-col gap-0.5 overflow-y-auto',
          isExpanded ? 'px-3' : 'px-2',
        ].join(' ')}
      >
        {navSections.map((section, sectionIndex) => (
          <div key={section.label ?? `s-${sectionIndex}`} className={sectionIndex > 0 ? 'mt-2' : ''}>
            {section.label && isExpanded && (
              <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-[0.12em] text-ash">
                {section.label}
              </p>
            )}
            {!section.label && sectionIndex > 0 && (
              <div className="mb-2 border-t border-fog" />
            )}
            {section.items.map((item) => {
              const label = item.id === 'staff' && staffLabel ? staffLabel : item.label
              const isActive = activeScreen === item.id
              return (
                <SidebarLink
                  key={item.id}
                  label={label}
                  icon={<item.icon />}
                  active={isActive}
                  collapsed={!isExpanded}
                  muted={!item.live}
                  onClick={
                    item.live
                      ? () => onNavigate(item.id as PortalScreen)
                      : undefined
                  }
                />
              )
            })}
          </div>
        ))}

        <div className="my-2 border-t border-fog" />
        <SidebarLink label="Logout" icon={<IconLogout />} collapsed={!isExpanded} />
      </nav>

      <div
        className={[
          'flex flex-col gap-0.5 py-3',
          isExpanded ? 'px-3' : 'px-2',
        ].join(' ')}
      >
        <SidebarLink
          label="Help"
          icon={<IconHelp />}
          collapsed={!isExpanded}
          onClick={() => onNavigate('help')}
        />
        {isExpanded && (
          <p className="px-2 pt-1 text-[10px] leading-snug text-ash">
            Docs & contact Miki
          </p>
        )}
      </div>

      <div className="border-t border-fog p-3">
        <button
          type="button"
          title={!isExpanded ? 'Ahmad Kamal · Owner' : undefined}
          aria-label={!isExpanded ? 'Ahmad Kamal · Owner' : undefined}
          className={[
            'flex w-full items-center rounded-md py-2 text-left transition-colors hover:bg-linen',
            isExpanded ? 'gap-2.5 px-2' : 'justify-center px-0',
          ].join(' ')}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist text-xs font-medium text-carbon">
            AK
          </span>
          <span
            className={[
              'min-w-0 flex-1 transition-all duration-200',
              isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0',
            ].join(' ')}
          >
            <span className="block truncate text-sm font-medium text-carbon">
              Ahmad Kamal
            </span>
            <span className="block truncate text-[11px] text-ash">Owner</span>
          </span>
        </button>
      </div>
    </aside>
  )
}
