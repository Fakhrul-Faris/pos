import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Reveal, RevealGroup, RevealHeadline, RevealItem, RevealScale } from './Reveal'

type SurfaceKey = 'customer' | 'counter' | 'owner'

const surfaces: Array<{
  key: SurfaceKey
  title: string
  copy: string
  image: string
  alt: string
}> = [
  {
    key: 'customer',
    title: 'Customer',
    copy: 'Books and pays from their phone. No app to download.',
    image: '/mockup/Phone.png',
    alt: 'Customer holding a phone on a green velvet couch',
  },
  {
    key: 'counter',
    title: 'Counter',
    copy: 'Runs the queue and checkout from your tablet.',
    image: '/mockup/Tablet.jpg',
    alt: 'Staff tablet resting on a lap outdoors on the grass',
  },
  {
    key: 'owner',
    title: 'Owner',
    copy: 'Checks sales and manages staff from the merchant portal. Anywhere.',
    image: '/mockup/Laptop.png',
    alt: 'Owner typing on a laptop from a cozy pink rug',
  },
]

const spring = { type: 'spring' as const, stiffness: 320, damping: 30, mass: 0.9 }

export function ThreeSurfaces() {
  const [active, setActive] = useState<SurfaceKey>('customer')
  const reducedMotion = useReducedMotion()
  const current = surfaces.find((s) => s.key === active)!

  return (
    <section id="how-it-works" className="py-[var(--section-gap)] bg-linen/50">
      <div className="container-page">
        <div className="text-center max-w-[640px] mx-auto">
          <RevealHeadline
            segments={[
              { text: 'Bring' },
              { text: 'your', className: 'text-muted' },
              { text: 'device.' },
            ]}
            className="text-heading-lg text-ink m-0"
          />
          <Reveal delay={0.25} y={20}>
            <p className="text-body-lg text-muted mt-4 mb-0">
              No terminal to buy, no hardware bundle to wait on.
              <br className="hidden sm:block" /> Miki runs on iPhone and Android.
            </p>
          </Reveal>
        </div>

        <RevealScale delay={0.12} scale={0.94} y={56} className="mt-12">
          <div className="relative overflow-hidden rounded-[24px] aspect-[4/3] sm:aspect-[16/9] lg:aspect-[2/1] bg-ink">
          <AnimatePresence initial={false}>
            <motion.img
              key={current.key}
              src={current.image}
              alt={current.alt}
              initial={{ opacity: 0, scale: reducedMotion ? 1 : 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
              }
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
          </AnimatePresence>

          {/* subtle scrim so the pills stay legible on any photo */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-black/25 to-transparent pointer-events-none"
          />

          <div
            role="tablist"
            aria-label="Choose a surface"
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 max-w-[85%] sm:max-w-[340px]"
          >
          <RevealGroup
            className="flex flex-col items-start gap-3"
            stagger={0.12}
            delay={0.35}
          >
            {surfaces.map((s) => {
              const isActive = s.key === active
              return (
                <RevealItem key={s.key} x={-20}>
                <motion.button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  id={`surface-tab-${s.key}`}
                  aria-controls={`surface-panel-${s.key}`}
                  onClick={() => setActive(s.key)}
                  layout={!reducedMotion}
                  transition={spring}
                  style={{ borderRadius: isActive ? 18 : 20 }}
                  className={[
                    'flex flex-col items-start text-left cursor-pointer border-0 overflow-hidden',
                    'bg-black/45 backdrop-blur-md text-paper px-4 py-2.5',
                    isActive ? '' : 'hover:bg-black/60 transition-colors',
                  ].join(' ')}
                >
                  <motion.span
                    layout={!reducedMotion ? 'position' : undefined}
                    transition={spring}
                    className="flex items-center gap-2.5 text-body-sm font-medium"
                  >
                    <motion.span
                      aria-hidden
                      animate={{ rotate: isActive ? 45 : 0 }}
                      transition={reducedMotion ? { duration: 0 } : spring}
                      className="inline-flex w-4 h-4 items-center justify-center text-base leading-none text-paper/80"
                    >
                      +
                    </motion.span>
                    {s.title}
                  </motion.span>

                  {isActive && (
                    <motion.span
                      key="copy"
                      id={`surface-panel-${s.key}`}
                      role="tabpanel"
                      aria-labelledby={`surface-tab-${s.key}`}
                      layout={!reducedMotion ? 'position' : undefined}
                      initial={
                        reducedMotion ? { opacity: 1 } : { opacity: 0, y: 4 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { ...spring, delay: 0.06 }
                      }
                      className="block pl-[26px] pt-1 text-body-sm text-paper/85 w-[230px] sm:w-[260px]"
                    >
                      {s.copy}
                    </motion.span>
                  )}
                </motion.button>
                </RevealItem>
              )
            })}
          </RevealGroup>
          </div>
          </div>
        </RevealScale>
      </div>
    </section>
  )
}
