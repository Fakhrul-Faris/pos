'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotionSafe } from '../hooks/use-reduced-motion-safe'
import { ItalicHeadline } from './ui'
import { Reveal } from './Reveal'

const ROTATE_MS = 6000

const punches = [
  {
    id: 'door',
    label: 'At the door',
    hit: 'They leave when you can\'t answer "how long?"',
    fix: 'Live queue for walk-ins and bookings. They check their phone. You keep working.',
  },
  {
    id: 'rush',
    label: 'At rush hour',
    hit: 'Your busiest hour has no single truth.',
    fix: 'One board. Bookings keep their slot. Walk-ins fill the gaps. No double guesses.',
  },
  {
    id: 'close',
    label: 'At close',
    hit: 'Closing is counting, not going home.',
    fix: 'Every sale tied to whoever was on duty. One export. Done before you lock up.',
  },
] as const

export function WhyChooseMiki() {
  const reducedMotion = useReducedMotionSafe()
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [epoch, setEpoch] = useState(0)

  useEffect(() => {
    if (reducedMotion || paused) return

    const timer = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % punches.length)
    }, ROTATE_MS)

    return () => window.clearInterval(timer)
  }, [paused, epoch, reducedMotion])

  function selectIndex(index: number) {
    setActiveIndex(index)
    setEpoch((e) => e + 1)
  }

  const current = punches[activeIndex]

  return (
    <section id="why-miki" className="why-miki-section">
      <div className="container-page">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <ItalicHeadline before="Three leaks." italic="One counter." />
          <Reveal delay={0.2} y={16}>
            <p className="text-body text-muted m-0 mt-4">
              Brick-and-mortar shops lose customers, capacity, and closing time.
              Usually across five apps and one notepad.
            </p>
          </Reveal>
        </div>

        <div
          className="why-miki-card"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="why-miki-card__layout">
            <aside className="why-miki-card__nav">
              <nav className="why-miki-card__nav-list" aria-label="Why choose Miki">
                {punches.map((item, index) => {
                  const isActive = index === activeIndex
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`why-miki-nav-item ${isActive ? 'is-active' : ''}`}
                      aria-current={isActive ? 'true' : undefined}
                      onClick={() => selectIndex(index)}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </nav>
            </aside>

            <div className="why-miki-card__content">
              <div className="why-miki-card__visual" aria-hidden>
                <div className="why-miki-card__visual-placeholder">
                  <span>Image placeholder</span>
                </div>
              </div>

              <div className="why-miki-card__copy">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h3 className="why-miki-card__hit m-0">{current.hit}</h3>
                    <p className="why-miki-card__fix m-0">{current.fix}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
