import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ItalicHeadline } from './ui'

const ROTATE_MS = 6000

const features = [
  {
    id: 'book',
    verb: 'Book',
    headline: 'Customers book from your QR.',
    body: 'Pick a slot from their phone. No app. No account.',
    surface: 'customer' as const,
  },
  {
    id: 'queue',
    verb: 'Queue',
    headline: 'Walk-ins and bookings, one queue.',
    body: 'Same day. No stolen slots.',
    surface: 'queue' as const,
  },
  {
    id: 'assign',
    verb: 'Assign',
    headline: 'One tablet at the counter.',
    body: "Who's next, what's owed, who's serving.",
    surface: 'counter' as const,
  },
  {
    id: 'pay',
    verb: 'Pay',
    headline: 'Cash, DuitNow, or integrated.',
    body: 'Your choice. Integrated payments auto-match when you turn them on.',
    surface: 'payment' as const,
  },
  {
    id: 'report',
    verb: 'Report',
    headline: 'Close without the detective work.',
    body: 'Revenue by day, by staff. Export for your accountant.',
    surface: 'reports' as const,
  },
  {
    id: 'sync',
    verb: 'Sync',
    headline: 'Spotty Wi‑Fi happens.',
    body: 'Core counter flow keeps going. Sync when you\'re back.',
    surface: 'offline' as const,
  },
]

function FeatureVisual({ surface }: { surface: (typeof features)[number]['surface'] }) {
  return (
    <div className="feature-visual-panel">
      {surface === 'customer' && (
        <div className="p-6 flex flex-col gap-4 h-full">
          <div className="text-caption text-muted">Shop QR · Book</div>
          <div className="space-y-2">
            {['Service', 'Add-on', '2:30pm · Ali'].map((row) => (
              <div
                key={row}
                className="flex items-center justify-between p-3 rounded-xl bg-[#f6f5f4] text-body-sm"
              >
                <span>{row}</span>
                {row.includes('Ali') && (
                  <span className="text-signal text-caption">Selected</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-auto h-10 rounded-full bg-signal flex items-center justify-center text-paper text-body-sm">
            Confirm booking
          </div>
        </div>
      )}

      {surface === 'queue' && (
        <div className="p-6 flex flex-col gap-3 h-full">
          <div className="flex gap-2 text-caption">
            <span className="px-2 py-1 rounded-full bg-signal text-paper">Walk-in #14</span>
            <span className="px-2 py-1 rounded-full bg-[#f6f5f4]">Booked 2:00</span>
          </div>
          {['#12 · Ben · arrived', '#13 · Cal · serving', '#14 · Walk-in · waiting'].map(
            (row, i) => (
              <div
                key={row}
                className={`p-3 rounded-xl text-body-sm ${i === 2 ? 'bg-linen border border-signal/20' : 'bg-[#f6f5f4]'}`}
              >
                {row}
              </div>
            ),
          )}
        </div>
      )}

      {surface === 'counter' && (
        <div className="p-6 flex flex-col gap-4 h-full">
          <div className="flex gap-2">
            {['Ali', 'Ben', 'Cal'].map((name, i) => (
              <span
                key={name}
                className={`px-3 py-1 rounded-full text-caption ${i === 0 ? 'bg-signal text-paper' : 'bg-[#f6f5f4]'}`}
              >
                {name}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            {['Mark arrived', 'Add extra', 'Complete', 'Take payment'].map((action) => (
              <button
                key={action}
                type="button"
                className="p-3 rounded-xl bg-[#f6f5f4] text-body-sm text-left border-0"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {surface === 'payment' && (
        <div className="p-6 flex flex-col gap-3 h-full justify-center">
          {[
            { label: 'Cash', fee: 'RM0' },
            { label: 'Your DuitNow', fee: 'RM0' },
            { label: 'Integrated QR', fee: 'Customer +2%' },
          ].map((row) => (
            <div
              key={row.label}
              className="flex justify-between items-center p-4 rounded-xl bg-[#f6f5f4] text-body-sm"
            >
              <span>{row.label}</span>
              <span className="text-muted">{row.fee}</span>
            </div>
          ))}
        </div>
      )}

      {surface === 'reports' && (
        <div className="p-6 flex flex-col gap-4 h-full">
          <div className="text-caption text-muted">Today · Per staff</div>
          {[
            { name: 'Ali', rev: 'RM420' },
            { name: 'Ben', rev: 'RM380' },
            { name: 'Cal', rev: 'RM290' },
          ].map((row) => (
            <div key={row.name} className="flex justify-between items-end gap-2">
              <span className="text-body-sm">{row.name}</span>
              <div className="flex-1 h-2 rounded-full bg-[#f6f5f4] overflow-hidden">
                <div
                  className="h-full bg-signal rounded-full"
                  style={{ width: row.rev === 'RM420' ? '85%' : row.rev === 'RM380' ? '72%' : '55%' }}
                />
              </div>
              <span className="text-body-sm font-medium">{row.rev}</span>
            </div>
          ))}
          <div className="text-caption text-signal mt-auto">Export CSV →</div>
        </div>
      )}

      {surface === 'offline' && (
        <div className="p-6 flex flex-col gap-4 h-full justify-center items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#f6f5f4] flex items-center justify-center text-xl">
            ↻
          </div>
          <p className="text-body-sm m-0">Offline mode active</p>
          <p className="text-caption text-muted m-0">3 actions queued · sync when online</p>
          <div className="w-full p-3 rounded-xl bg-linen text-caption text-left">
            Mark arrived · #14 · saved locally
          </div>
        </div>
      )}
    </div>
  )
}

export function FeaturesSection() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const timer = window.setInterval(() => {
      setActive((i) => (i + 1) % features.length)
    }, ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [paused])

  const current = features[active]!

  return (
    <section id="features" className="agents-features-section py-[var(--section-gap)]">
      <div className="container-page mb-12">
        <ItalicHeadline
          before="One system."
          italic="Every surface."
        />
        <p className="text-subheading text-muted mt-4 max-w-2xl">
          Book, queue, pay, report. Without the retail bloat.
        </p>
      </div>

      <div
        className="agents-features-content white"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="container-page py-12 md:py-16">
          <div
            className="flex flex-wrap gap-x-6 gap-y-2 mb-10 md:mb-14"
            role="tablist"
            aria-label="Product features"
          >
            {features.map((feature, i) => (
              <button
                key={feature.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-controls={`feature-panel-${feature.id}`}
                id={`feature-tab-${feature.id}`}
                onClick={() => setActive(i)}
                className={`agents-feature-tab ${i === active ? 'is-active' : ''}`}
              >
                {feature.verb}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="min-h-[200px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  id={`feature-panel-${current.id}`}
                  role="tabpanel"
                  aria-labelledby={`feature-tab-${current.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h3 className="text-heading text-ink m-0 mb-4">{current.headline}</h3>
                  <p className="text-body-lg text-muted m-0 max-w-md leading-[1.5]">
                    {current.body}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="flex gap-2 mt-10" aria-hidden>
                {features.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActive(i)}
                    className={`h-1 rounded-full border-0 cursor-pointer transition-all ${
                      i === active
                        ? 'w-8 bg-signal'
                        : 'w-4 bg-black/10 hover:bg-black/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <FeatureVisual surface={current.surface} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
