'use client'

import type { ReactNode } from 'react'

type SidebarLinkProps = {
  label: string
  icon: ReactNode
  active?: boolean
  collapsed?: boolean
  onClick?: () => void
}

export function SidebarLink({ label, icon, active, collapsed, onClick }: SidebarLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={[
        'group/sidebar flex w-full items-center rounded-md py-2 text-left text-sm transition-colors duration-150',
        collapsed ? 'justify-center px-2' : 'gap-2 px-2',
        active
          ? 'bg-mist font-medium text-carbon'
          : 'text-graphite hover:bg-linen hover:text-carbon',
      ].join(' ')}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-inherit">
        {icon}
      </span>
      <span
        className={[
          'truncate tracking-ui transition-all duration-200',
          collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
        ].join(' ')}
      >
        {label}
      </span>
    </button>
  )
}
