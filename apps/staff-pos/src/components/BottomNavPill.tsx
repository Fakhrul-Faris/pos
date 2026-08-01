'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { spring } from '@/lib/motion'

export type BottomNavTab = 'today' | 'calendar' | 'more' | 'cashier'

type BottomNavPillProps = {
  active: BottomNavTab | null
  visible?: boolean
  onToday: () => void
  onWalkIn: () => void
  onCashier: () => void
  onCalendar: () => void
  onMore: () => void
}

function NavIcon({ name }: { name: 'today' | 'walkin' | 'calendar' | 'more' | 'cashier' }) {
  const common = 'h-5 w-5'
  if (name === 'today') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 6.5h16v12H4v-12Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        <path d="M8 6.5V4.5M16 6.5V4.5M4 10h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M8 14h3M13 14h3M8 17h3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'walkin') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M6.5 19c1.2-2.8 3.1-4.2 5.5-4.2S16.3 16.2 17.5 19"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path d="M18.5 7v5M16 9.5h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'cashier') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3.5" y="6" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M7 10h4M7 13h2M14 10h3M14 13h3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'calendar') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M8 3.5V7M16 3.5V7M4 10h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M8 14h2M12 14h2M16 14h.01M8 17h2M12 17h2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function BottomNavPill({
  active,
  visible = true,
  onToday,
  onWalkIn,
  onCashier,
  onCalendar,
  onMore,
}: BottomNavPillProps) {
  const reduce = useReducedMotion()

  const itemClass = (selected: boolean) =>
    `flex min-h-11 min-w-[3.75rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1.5 py-1 text-[10px] font-medium transition-colors ${
      selected ? 'bg-barber-muted text-carbon' : 'text-graphite hover:bg-mist/80 hover:text-carbon'
    }`

  return (
    <AnimatePresence>
      {visible ? (
        <motion.nav
          aria-label="Primary"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={reduce ? { duration: 0.01 } : spring.playful}
        >
      <div className="pointer-events-auto flex w-full max-w-[28rem] items-center gap-0.5 rounded-full border border-fog bg-paper-white p-1.5 shadow-panel backdrop-blur-sm">
        <button type="button" onClick={onToday} className={itemClass(active === 'today')} aria-current={active === 'today' ? 'page' : undefined}>
          <NavIcon name="today" />
          Today
        </button>
        <button type="button" onClick={onWalkIn} className={itemClass(false)}>
          <NavIcon name="walkin" />
          Walk-in
        </button>

        <button
          type="button"
          onClick={onCashier}
          className="-mt-5 flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full bg-carbon text-paper-white ring-4 ring-paper-white shadow-panel transition-transform hover:scale-105"
          aria-label="Cashier"
          aria-current={active === 'cashier' ? 'page' : undefined}
        >
          <NavIcon name="cashier" />
          <span className="text-[9px] font-semibold">Pay</span>
        </button>

        <button
          type="button"
          onClick={onCalendar}
          className={itemClass(active === 'calendar')}
          aria-current={active === 'calendar' ? 'page' : undefined}
        >
          <NavIcon name="calendar" />
          Calendar
        </button>
        <button
          type="button"
          onClick={onMore}
          className={itemClass(active === 'more')}
          aria-current={active === 'more' ? 'page' : undefined}
        >
          <NavIcon name="more" />
          More
        </button>
      </div>
        </motion.nav>
      ) : null}
    </AnimatePresence>
  )
}
