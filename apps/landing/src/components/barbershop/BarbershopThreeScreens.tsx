'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotionSafe } from '../../hooks/use-reduced-motion-safe'
import { Reveal, RevealGroup, RevealItem, RevealScale } from '../Reveal'
import { surfaces } from './data'
import { SectionHeadline } from './SectionHeadline'

type SurfaceKey = (typeof surfaces)[number]['key']

const spring = { type: 'spring' as const, stiffness: 320, damping: 30, mass: 0.9 }

export function BarbershopThreeScreens() {
  const [active, setActive] = useState<SurfaceKey>('customer')
  const reducedMotion = useReducedMotionSafe()
  const current = surfaces.find((s) => s.key === active)!

  return (
    <section id="surfaces" className="barbershop-band barbershop-band--linen">
      <div className="container-page">
        <div className="barbershop-section-head">
          <SectionHeadline
            segments={[
              { text: 'Three screens.' },
              { text: 'One calm shop.', italic: true },
            ]}
          />
          <Reveal delay={0.25} y={20}>
            <p className="text-body-lg text-muted mt-4 mb-0">
              No customer app. No per-barber login. No juggling WhatsApp bookings
              and a paper queue.
            </p>
          </Reveal>
        </div>

        <RevealScale delay={0.12} scale={0.94} y={56} className="mt-12">
          <div className="relative overflow-hidden rounded-[28px] aspect-[4/3] sm:aspect-[16/9] lg:aspect-[2/1] bg-ink">
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

            <div
              aria-hidden
              className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-black/25 to-transparent pointer-events-none"
            />

            <div
              role="tablist"
              aria-label="Choose a surface"
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 max-w-[85%] sm:max-w-[360px]"
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
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        id={`barbershop-surface-tab-${s.key}`}
                        aria-controls={`barbershop-surface-panel-${s.key}`}
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
                            id={`barbershop-surface-panel-${s.key}`}
                            role="tabpanel"
                            aria-labelledby={`barbershop-surface-tab-${s.key}`}
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
                            className="block pl-[26px] pt-1 text-body-sm text-paper/85 w-[240px] sm:w-[300px]"
                          >
                            <span className="block font-medium text-paper mb-1">
                              {s.subtitle}
                            </span>
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
