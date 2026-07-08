import { useState, type ReactNode } from 'react'
import type { PortalScreen } from '../data/mock'
import { Sidebar } from './Sidebar'

type ShellProps = {
  businessName: string
  staffLabel?: string
  activeScreen: PortalScreen
  onNavigate: (screen: PortalScreen) => void
  children: ReactNode
}

export function Shell({
  businessName,
  staffLabel,
  activeScreen,
  onNavigate,
  children,
}: ShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex min-h-0 flex-1 items-stretch justify-center gap-0 p-1.5">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-1.5 overflow-visible md:flex-row">
        <Sidebar
          businessName={businessName}
          staffLabel={staffLabel}
          collapsed={sidebarCollapsed}
          activeScreen={activeScreen}
          onNavigate={onNavigate}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />
        <main className="m-px min-h-0 min-w-0 flex-1 overflow-y-auto rounded-xl bg-paper-white">
          {children}
        </main>
      </div>
    </div>
  )
}
