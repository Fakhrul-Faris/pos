import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { useReducedMotionSafe } from '../hooks/use-reduced-motion-safe'

export const REVEAL_EASE = [0.22, 1, 0.36, 1] as const

export const VIEWPORT = { once: true, margin: '-10% 0px -10% 0px' } as const

/** Fade-up with a blur-to-sharp settle. The workhorse for copy and blocks. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  blur = true,
  duration = 0.8,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  blur?: boolean
  duration?: number
}) {
  const reduced = useReducedMotionSafe()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: blur ? 'blur(8px)' : 'blur(0px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={VIEWPORT}
      transition={{ duration, delay, ease: REVEAL_EASE }}
    >
      {children}
    </motion.div>
  )
}

/** Directional slide-in — pairs well for split layouts and cards. */
export function RevealSlide({
  children,
  className,
  from = 'up',
  delay = 0,
  distance = 44,
  blur = true,
  duration = 0.85,
}: {
  children: ReactNode
  className?: string
  from?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  distance?: number
  blur?: boolean
  duration?: number
}) {
  const reduced = useReducedMotionSafe()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  const offset =
    from === 'up'
      ? { y: distance }
      : from === 'down'
        ? { y: -distance }
        : from === 'left'
          ? { x: -distance }
          : { x: distance }

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        ...offset,
        filter: blur ? 'blur(8px)' : 'blur(0px)',
      }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
      viewport={VIEWPORT}
      transition={{ duration, delay, ease: REVEAL_EASE }}
    >
      {children}
    </motion.div>
  )
}

/** Subtle scale-up for media panels and bento tiles. */
export function RevealScale({
  children,
  className,
  delay = 0,
  scale = 0.96,
  y = 32,
}: {
  children: ReactNode
  className?: string
  delay?: number
  scale?: number
  y?: number
}) {
  const reduced = useReducedMotionSafe()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={VIEWPORT}
      transition={{ duration: 0.85, delay, ease: REVEAL_EASE }}
    >
      {children}
    </motion.div>
  )
}

/** Stagger container. Pair with RevealItem children. */
export function RevealGroup({
  children,
  className,
  stagger = 0.1,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  delay?: number
}) {
  const reduced = useReducedMotionSafe()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  className,
  y = 26,
  x = 0,
}: {
  children: ReactNode
  className?: string
  y?: number
  x?: number
}) {
  const reduced = useReducedMotionSafe()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y, x, filter: 'blur(6px)' },
        visible: {
          opacity: 1,
          y: 0,
          x: 0,
          filter: 'blur(0px)',
          transition: { duration: 0.7, ease: REVEAL_EASE },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

type HeadlineSegment = { text: string; className?: string }

/**
 * Word-by-word masked headline reveal: each word rises out of an
 * overflow-hidden slot with a slight tilt that settles as it lands.
 */
export function RevealHeadline({
  segments,
  as: Tag = 'h2',
  className,
  id,
  delay = 0,
}: {
  segments: HeadlineSegment[]
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  className?: string
  id?: string
  delay?: number
}) {
  const reduced = useReducedMotionSafe()

  const words = segments.flatMap((seg) =>
    seg.text
      .split(' ')
      .filter(Boolean)
      .map((word) => ({ word, className: seg.className })),
  )

  if (reduced) {
    return (
      <Tag id={id} className={className}>
        {words.map(({ word, className: cls }, i) => (
          <span key={i} className={cls}>
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </Tag>
    )
  }

  return (
    <Tag id={id} className={className}>
      <motion.span
        className="inline-block"
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.055, delayChildren: delay },
          },
        }}
      >
        {words.map(({ word, className: cls }, i) => (
          <span key={i} className="reveal-mask">
            <motion.span
              className={`inline-block ${cls ?? ''}`.trim()}
              style={{ transformOrigin: '0% 100%' }}
              variants={{
                hidden: { y: '115%', rotate: 4 },
                visible: {
                  y: '0%',
                  rotate: 0,
                  transition: { duration: 0.75, ease: REVEAL_EASE },
                },
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}
