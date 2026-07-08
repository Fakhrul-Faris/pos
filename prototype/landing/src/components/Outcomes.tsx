import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

type Surface = {
  id: string
  label: string
  tag: string
  detail: string
}

const surfaces: Surface[] = [
  {
    id: 'walk-ins',
    label: 'walk-ins',
    tag: 'Queue',
    detail: 'Same day. No stolen slots.',
  },
  {
    id: 'bookings',
    label: 'bookings',
    tag: 'Calendar',
    detail: 'Online slots keep their time.',
  },
  {
    id: 'counter',
    label: 'the counter',
    tag: 'Staff',
    detail: "Who's next, what's owed, who's serving.",
  },
  {
    id: 'qr',
    label: 'your QR',
    tag: 'Customer',
    detail: 'Book or join the queue from their phone. No app.',
  },
  {
    id: 'duitnow',
    label: 'DuitNow',
    tag: 'Payments',
    detail: 'Cash and your own QR always work.',
  },
  {
    id: 'closing',
    label: 'closing',
    tag: 'Owner',
    detail: 'Revenue by day, by staff. Export when you need it.',
  },
]

const introWords = ['Miki', 'is', 'shop', 'software', 'that', 'connects']
const outroWords = ['on', 'one', 'screen', 'you', 'already', 'run.']

// headline (1) + intro block (1) + chips (6) + outro block (1)
const CHIP_OFFSET = 2
const OUTRO_OFFSET = CHIP_OFFSET + surfaces.length
const TOTAL_STEPS = OUTRO_OFFSET + 1
const SCROLL_VH_PER_STEP = 42

function SurfaceCard({ surface }: { surface: Surface }) {
  return (
    <motion.article
      key={surface.id}
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="scroll-surface-card"
    >
      <span className="scroll-surface-card__tag">{surface.tag}</span>
      <p className="scroll-surface-card__detail m-0">{surface.detail}</p>
      <div className="scroll-surface-card__mock" aria-hidden>
        {surface.id === 'qr' && (
          <div className="scroll-mock-stack">
            <div className="scroll-mock-row">Scan shop QR</div>
            <div className="scroll-mock-row scroll-mock-row--active">Pick a slot</div>
            <div className="scroll-mock-pill">Confirm</div>
          </div>
        )}
        {surface.id === 'walk-ins' && (
          <div className="scroll-mock-stack">
            {['#12 arrived', '#13 serving', '#14 waiting'].map((row, i) => (
              <div
                key={row}
                className={`scroll-mock-row ${i === 2 ? 'scroll-mock-row--active' : ''}`}
              >
                {row}
              </div>
            ))}
          </div>
        )}
        {surface.id === 'bookings' && (
          <div className="scroll-mock-stack">
            <div className="scroll-mock-row scroll-mock-row--active">2:30pm · Ali</div>
            <div className="scroll-mock-row">3:00pm · Ben</div>
            <div className="scroll-mock-row">3:30pm · open</div>
          </div>
        )}
        {surface.id === 'counter' && (
          <div className="scroll-mock-pills">
            {['Ali', 'Ben', 'Cal'].map((name, i) => (
              <span
                key={name}
                className={
                  i === 0 ? 'scroll-mock-pill scroll-mock-pill--active' : 'scroll-mock-pill'
                }
              >
                {name}
              </span>
            ))}
          </div>
        )}
        {surface.id === 'duitnow' && (
          <div className="scroll-mock-stack">
            <div className="scroll-mock-row scroll-mock-row--active">Cash · RM0</div>
            <div className="scroll-mock-row">Your DuitNow · RM0</div>
            <div className="scroll-mock-row">Integrated · optional</div>
          </div>
        )}
        {surface.id === 'closing' && (
          <div className="scroll-mock-stack">
            <div className="scroll-mock-row scroll-mock-row--active">Today · RM1,090</div>
            <div className="scroll-mock-row">Ali · RM420</div>
            <div className="scroll-mock-row">Export CSV</div>
          </div>
        )}
      </div>
    </motion.article>
  )
}

function stepFromProgress(progress: number) {
  return Math.min(TOTAL_STEPS - 1, Math.max(0, Math.floor(progress * TOTAL_STEPS)))
}

export function Outcomes() {
  const sectionRef = useRef<HTMLElement>(null)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    let frame = 0

    const update = () => {
      const scrollable = section.offsetHeight - window.innerHeight
      if (scrollable <= 0) {
        setStep(TOTAL_STEPS - 1)
        return
      }

      const progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / scrollable))
      setStep(stepFromProgress(progress))
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const headlineLit = step >= 1
  const headlineFull = step >= 1
  const introLit = step >= 1
  const outroLit = step >= OUTRO_OFFSET
  const activeChip = Math.min(
    surfaces.length - 1,
    Math.max(0, step - CHIP_OFFSET),
  )
  const current = surfaces[activeChip]!

  return (
    <section
      id="outcomes"
      ref={sectionRef}
      className="scroll-highlight-section"
      style={{ height: `${TOTAL_STEPS * SCROLL_VH_PER_STEP}vh` }}
      aria-label="How Miki fits your shop"
    >
      <div className="scroll-highlight-sticky">
        <div className="scroll-highlight-bg" aria-hidden />

        <div className="container-page scroll-highlight-inner">
          <div className="scroll-highlight-copy">
            <h2
              className={`scroll-highlight-headline m-0 ${headlineLit ? 'is-lit' : ''} ${
                headlineFull ? 'is-full' : ''
              }`}
            >
              <span className="hl-line">Less chaos on the</span>
              <span className="hl-line">screens you already use.</span>
            </h2>

            <p className="scroll-highlight-prose m-0">
              {introWords.map((word, i) => (
                <span key={`${word}-${i}`}>
                  <span className={`hl-token ${introLit ? 'is-lit' : ''}`}>{word}</span>{' '}
                </span>
              ))}
              {surfaces.map((surface, i) => (
                <span key={surface.id}>
                  <span
                    className={`hl-chip-token ${
                      step >= CHIP_OFFSET + i ? 'is-lit' : ''
                    } ${step === CHIP_OFFSET + i ? 'is-active' : ''}`}
                  >
                    {surface.label}
                  </span>
                  {i < surfaces.length - 1 ? ', ' : ' '}
                </span>
              ))}
              {outroWords.map((word, i) => (
                <span key={`outro-${word}-${i}`}>
                  <span className={`hl-token ${outroLit ? 'is-lit' : ''}`}>{word}</span>
                  {i < outroWords.length - 1 ? ' ' : ''}
                </span>
              ))}
            </p>

            <div className="scroll-highlight-progress" aria-hidden>
              {surfaces.map((surface, i) => (
                <div
                  key={surface.id}
                  className={`scroll-highlight-progress__dot ${
                    i === activeChip ? 'is-active' : i < activeChip ? 'is-done' : ''
                  }`}
                />
              ))}
            </div>

            {step < CHIP_OFFSET + surfaces.length - 1 && (
              <p className="scroll-highlight-hint m-0" aria-hidden>
                Keep scrolling
              </p>
            )}
          </div>

          <div className="scroll-highlight-visual">
            <AnimatePresence mode="wait">
              <SurfaceCard key={current.id} surface={current} />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
