'use client'

import { useRef, useState } from 'react'
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useReducedMotionSafe } from '../../hooks/use-reduced-motion-safe'
import { problemBeats } from './data'

const BEAT_COUNT = problemBeats.length
/** Share of each beat used to fill ash → ink. Remainder is a hold at full ink. */
const FILL_PORTION = 0.72

function RevealLine({
  text,
  punch,
  progress,
  index,
  active,
}: {
  text: string
  punch?: boolean
  progress: MotionValue<number>
  index: number
  active: boolean
}) {
  const beatStart = index / BEAT_COUNT
  const fillEnd = (index + FILL_PORTION) / BEAT_COUNT
  const beatEnd = (index + 1) / BEAT_COUNT

  // Full gray → ink within this sentence's fill window, then hold until the next beat.
  const colorProgress = useTransform(
    progress,
    [beatStart, fillEnd, beatEnd],
    [0, 1, 1],
    { clamp: true },
  )

  const color = useTransform(colorProgress, (v) => {
    if (punch) return 'var(--color-off-black-ink)'
    const ash = [210, 210, 200]
    const ink = [20, 20, 15]
    const r = Math.round(ash[0] + (ink[0] - ash[0]) * v)
    const g = Math.round(ash[1] + (ink[1] - ash[1]) * v)
    const b = Math.round(ash[2] + (ink[2] - ash[2]) * v)
    return `rgb(${r}, ${g}, ${b})`
  })

  const markOpacity = useTransform(colorProgress, (v) => (punch ? v : 0))
  const markScaleX = useTransform(colorProgress, [0, 1], [0.12, 1])

  return (
    <p
      className={`barbershop-problem-line${punch ? ' barbershop-problem-line--punch' : ''}${
        active ? ' is-active' : ''
      }`}
      aria-hidden={!active}
    >
      <motion.span className="barbershop-problem-line__text" style={{ color }}>
        {text}
      </motion.span>
      {punch ? (
        <motion.span
          className="barbershop-problem-line__mark"
          aria-hidden
          style={{ opacity: markOpacity, scaleX: markScaleX }}
        />
      ) : null}
    </p>
  )
}

function ProblemScroll() {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  // Light spring so fill still tracks scroll closely sentence-by-sentence.
  const progress = useSpring(scrollYProgress, {
    stiffness: 420,
    damping: 48,
    restDelta: 0.0004,
  })

  useMotionValueEvent(progress, 'change', (v) => {
    const next = Math.min(BEAT_COUNT - 1, Math.max(0, Math.floor(v * BEAT_COUNT)))
    setActiveIndex(next)
  })

  return (
    <section
      ref={sectionRef}
      id="problem"
      className="barbershop-problem"
      aria-label="How barbershops actually run"
      data-active-beat={activeIndex}
    >
      <div className="barbershop-problem__sticky">
        <div className="barbershop-problem__grid container-page max-w-5xl mx-auto">
          <div className="barbershop-problem__copy">
            {problemBeats.map((beat, i) => (
              <RevealLine
                key={beat.id}
                text={beat.text}
                punch={beat.punch}
                progress={progress}
                index={i}
                active={activeIndex === i}
              />
            ))}
          </div>
          <div className="barbershop-problem-media" aria-hidden>
            {problemBeats.map((beat, i) => (
              <div
                key={beat.id}
                className={`barbershop-problem-media__panel barbershop-problem-media__panel--${beat.media}${
                  activeIndex === i ? ' is-active' : ''
                }`}
              >
                <span className="barbershop-problem-media__label">{beat.mediaLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ProblemStatic() {
  return (
    <section
      id="problem"
      className="barbershop-problem barbershop-problem--static"
      aria-label="How barbershops actually run"
    >
      <div className="container-page max-w-5xl mx-auto barbershop-problem__grid">
        <div className="barbershop-problem__copy barbershop-problem__copy--static">
          {problemBeats.map((beat) => (
            <p
              key={beat.id}
              className={`barbershop-problem-line barbershop-problem-line--static${
                beat.punch ? ' barbershop-problem-line--punch' : ''
              }`}
            >
              {beat.text}
            </p>
          ))}
        </div>
        <div className="barbershop-problem-media" aria-hidden>
          <div
            className={`barbershop-problem-media__panel barbershop-problem-media__panel--${
              problemBeats[problemBeats.length - 1].media
            } is-active is-static`}
          >
            <span className="barbershop-problem-media__label">
              {problemBeats[problemBeats.length - 1].mediaLabel}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export function BarbershopProblem() {
  const reduced = useReducedMotionSafe()
  if (reduced) return <ProblemStatic />
  return <ProblemScroll />
}
