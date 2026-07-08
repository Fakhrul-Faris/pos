import { motion } from 'motion/react'
import type { ReactNode } from 'react'

type ComparisonRow = {
  oldWay: string
  mikiWay: string
  oldIcon: ReactNode
  mikiIcon: ReactNode
}

const rows: ComparisonRow[] = [
  {
    oldWay: 'WhatsApp bookings',
    mikiWay: 'No more "did they confirm?"',
    oldIcon: <ChatIcon />,
    mikiIcon: <CalendarIcon />,
  },
  {
    oldWay: 'Shared QR stands',
    mikiWay: 'One QR. One checkout.',
    oldIcon: <QrIcon />,
    mikiIcon: <CheckoutIcon />,
  },
  {
    oldWay: 'End-of-day detective work',
    mikiWay: 'Closing that takes a minute',
    oldIcon: <DetectiveIcon />,
    mikiIcon: <ChartIcon />,
  },
]

function IconTile({ children, tone }: { children: ReactNode; tone: 'positive' | 'muted' }) {
  return (
    <div
      className={`size-14 shrink-0 rounded-2xl flex items-center justify-center ${
        tone === 'positive'
          ? 'bg-linen text-signal'
          : 'bg-black/[0.04] text-muted'
      }`}
      aria-hidden
    >
      {children}
    </div>
  )
}

function ComparisonRowItem({
  icon,
  label,
  tone,
}: {
  icon: ReactNode
  label: string
  tone: 'positive' | 'muted'
}) {
  return (
    <div className="flex items-center gap-4">
      <IconTile tone={tone}>{icon}</IconTile>
      <p
        className={`flex-1 text-body font-medium leading-[1.35] tracking-[-0.01em] m-0 ${
          tone === 'positive' ? 'text-ink' : 'text-muted'
        }`}
      >
        {label}
      </p>
    </div>
  )
}

export function ComparisonCards() {
  return (
    <div className="relative w-full pt-4">
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 w-0.5 rounded-full h-16 md:h-20 bg-signal"
        style={{ boxShadow: '0 4px 16px rgba(56, 206, 135, 0.35)' }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-0.5 rounded-full top-16 md:top-20 bottom-0 bg-signal"
        style={{ boxShadow: '0 4px 16px rgba(56, 206, 135, 0.35)' }}
      />

      <div className="grid md:grid-cols-2 gap-6 md:gap-8 w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="h-full rounded-[32px] md:rounded-[40px] bg-paper p-8 md:p-10 flex flex-col gap-7 border border-black/10 shadow-card">
            <p className="text-heading-sm text-ink m-0">
              <span className="text-signal">Miki</span>
            </p>
            <p className="text-caption text-muted uppercase tracking-[0.12em] -mt-5 m-0">
              The Miki way
            </p>
            <div className="h-px w-full bg-black/10" />
            <div className="flex flex-col gap-6">
              {rows.map((row) => (
                <ComparisonRowItem
                  key={row.mikiWay}
                  icon={row.mikiIcon}
                  label={row.mikiWay}
                  tone="positive"
                />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <div className="h-full rounded-[32px] md:rounded-[40px] bg-[#ebebeb] p-8 md:p-10 flex flex-col gap-7 border border-black/10">
            <h3 className="text-heading-sm text-ink/80 m-0">The old way</h3>
            <div className="h-px w-full bg-black/15" />
            <div className="flex flex-col gap-6">
              {rows.map((row) => (
                <ComparisonRowItem
                  key={row.oldWay}
                  icon={row.oldIcon}
                  label={row.oldWay}
                  tone="muted"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 9.5h10M7 13h6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v6A3.5 3.5 0 0 1 15.5 16H10l-4.5 3.5V16H8.5A3.5 3.5 0 0 1 5 12.5v-6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4V6M17 4V6M5 9h14M6.5 6.5h11A2.5 2.5 0 0 1 20 9v9.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5V9a2.5 2.5 0 0 1 2.5-2.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12.5h2.25v2.25H8.5V12.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

function QrIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5h5v5H5V5ZM14 5h5v5h-5V5ZM5 14h5v5H5v-5ZM14 14h2.25v2.25H14V14ZM17.75 14H19v1.25h-1.25V14ZM14 17.75V19h1.25v-1.25H14ZM17.75 17.75H19V19h-1.25v-1.25ZM17.75 14.75V17h2.25v-2.25H17.75Z"
        fill="currentColor"
      />
    </svg>
  )
}

function CheckoutIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 7.5h15l-1.25 8.25A2 2 0 0 1 16.28 17.5H7.72a2 2 0 0 1-1.97-1.75L4.5 7.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M8 10.5h8M9.5 4.5h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DetectiveIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="5.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M15.25 15.25 19 19"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M9.25 10.75h3.5M11 9v3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 18.5V8.75M10 18.5V5.5M15 18.5v-7M20 18.5V11"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M4 18.5h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}
