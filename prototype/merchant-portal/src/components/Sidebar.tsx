import { useState } from 'react'
import type { PortalScreen } from '../data/mock'
import {
  IconBook,
  IconCalendar,
  IconChevronLeft,
  IconCreditCard,
  IconHelp,
  IconHome,
  IconLifeBuoy,
  IconLogout,
  IconReceipt,
  IconSettings,
  IconUsers,
  IconUserCircle,
  IconList,
  IconChart,
} from './icons'
import { SidebarLink } from './SidebarLink'

const primaryNav: {
  id: PortalScreen | 'customers' | 'services' | 'staff' | 'reports' | 'settings'
  label: string
  icon: typeof IconHome
  dynamic?: boolean
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: IconHome },
  { id: 'calendar', label: 'Calendar', icon: IconCalendar },
  { id: 'bookings', label: 'Bookings', icon: IconReceipt },
  { id: 'customers', label: 'Customers', icon: IconUsers },
  { id: 'services', label: 'Services', icon: IconList },
  { id: 'staff', label: 'Staff', icon: IconUserCircle, dynamic: true },
  { id: 'payments', label: 'Payments', icon: IconCreditCard },
  { id: 'reports', label: 'Reports', icon: IconChart },
  { id: 'settings', label: 'Settings', icon: IconSettings },
] as const

const footerNav = [
  { id: 'documentation', label: 'Documentation', icon: IconBook },
  { id: 'help', label: 'Help center', icon: IconHelp },
  { id: 'support', label: 'Support', icon: IconLifeBuoy },
] as const

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
      {/* Brand */}
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

      {/* Primary navigation */}
      <nav
        className={[
          'flex flex-1 flex-col gap-0.5 overflow-y-auto',
          isExpanded ? 'px-3' : 'px-2',
        ].join(' ')}
      >
        {primaryNav.map((item) => {
          const label = item.id === 'staff' && staffLabel ? staffLabel : item.label
          const isNavigable =
            item.id === 'dashboard' ||
            item.id === 'calendar' ||
            item.id === 'bookings' ||
            item.id === 'payments' ||
            item.id === 'staff'
          const isActive = activeScreen === item.id
          return (
            <SidebarLink
              key={item.id}
              label={label}
              icon={<item.icon />}
              active={isActive}
              collapsed={!isExpanded}
              onClick={isNavigable ? () => onNavigate(item.id as PortalScreen) : undefined}
            />
          )
        })}

        <div className="my-2 border-t border-fog" />

        <SidebarLink label="Logout" icon={<IconLogout />} collapsed={!isExpanded} />
      </nav>

      {/* Footer links */}
      <div
        className={[
          'flex flex-col gap-0.5 py-3',
          isExpanded ? 'px-3' : 'px-2',
        ].join(' ')}
      >
        {footerNav.map((item) => (
          <SidebarLink
            key={item.id}
            label={item.label}
            icon={<item.icon />}
            collapsed={!isExpanded}
          />
        ))}
      </div>

      {/* User */}
      <div className="border-t border-fog p-3">
        <button
          type="button"
          title={!isExpanded ? 'Ahmad Kamal' : undefined}
          aria-label={!isExpanded ? 'Ahmad Kamal' : undefined}
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
              'min-w-0 flex-1 truncate text-sm font-medium text-carbon transition-all duration-200',
              isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0',
            ].join(' ')}
          >
            Ahmad Kamal
          </span>
        </button>
      </div>
    </aside>
  )
}
