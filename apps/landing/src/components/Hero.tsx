import { useRef } from 'react'
import type { CSSProperties } from 'react'
import type { MotionValue } from 'motion/react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { useReducedMotionSafe } from '../hooks/use-reduced-motion-safe'
import { RevealGroup, RevealHeadline, RevealItem } from './Reveal'
import { Btn } from './Btn'
import { Nav } from './Nav'
import { MobileNav } from './MobileNav'
import { ExpandableScreenTrigger } from './ui/expandable-screen'

/**
 * Placeholder tiles revealed around the shrinking media card.
 * Positions are viewport percentages (tile is centered on the point).
 * `depth` splits tiles into two parallax groups so the reveal feels staggered.
 */
type Tile = {
  top: string
  left: string
  size: number
  variant: string
  depth: 1 | 2
  label?: string
  desktopOnly?: boolean
}

const TILES: Tile[] = [
  // Top row
  { top: '8%', left: '16%', size: 88, variant: 'beauty', depth: 1 },
  { top: '7%', left: '38%', size: 80, variant: 'dark', depth: 2, label: 'OPEN', desktopOnly: true },
  { top: '8%', left: '61%', size: 88, variant: 'fnb', depth: 1, desktopOnly: true },
  { top: '7%', left: '84%', size: 80, variant: 'retail', depth: 2 },
  // Upper-middle row
  { top: '30%', left: '6%', size: 84, variant: 'mint', depth: 2 },
  { top: '28%', left: '27%', size: 92, variant: 'retail', depth: 1, desktopOnly: true },
  { top: '28%', left: '73%', size: 92, variant: 'citrus', depth: 1, desktopOnly: true },
  { top: '30%', left: '94%', size: 84, variant: 'fnb', depth: 2 },
  // Mid sides, flanking the tagline
  { top: '52%', left: '7%', size: 96, variant: 'paper', depth: 1, label: 'PAID' },
  { top: '52%', left: '93%', size: 96, variant: 'beauty', depth: 2 },
  // Lower-middle row
  { top: '74%', left: '8%', size: 84, variant: 'fnb', depth: 2, desktopOnly: true },
  { top: '76%', left: '28%', size: 92, variant: 'sand', depth: 1 },
  { top: '76%', left: '72%', size: 92, variant: 'dark', depth: 1, label: 'THANK YOU', desktopOnly: true },
  { top: '74%', left: '92%', size: 84, variant: 'mint', depth: 2 },
  // Bottom row
  { top: '93%', left: '20%', size: 80, variant: 'citrus', depth: 2, desktopOnly: true },
  { top: '94%', left: '44%', size: 88, variant: 'retail', depth: 1 },
  { top: '94%', left: '66%', size: 88, variant: 'beauty', depth: 2, desktopOnly: true },
  { top: '93%', left: '86%', size: 80, variant: 'paper', depth: 1, label: '4.9', desktopOnly: true },
]

function TileField({
  opacityNear,
  yNear,
  opacityFar,
  yFar,
}: {
  opacityNear: MotionValue<number>
  yNear: MotionValue<number>
  opacityFar: MotionValue<number>
  yFar: MotionValue<number>
}) {
  return (
    <>
      {TILES.map((tile, i) => (
        <motion.div
          key={i}
          aria-hidden
          className={`hero-tile-anchor ${tile.desktopOnly ? 'max-md:hidden' : ''}`}
          style={{
            top: tile.top,
            left: tile.left,
            width: tile.size,
            height: tile.size,
            marginLeft: -tile.size / 2,
            marginTop: -tile.size / 2,
            opacity: tile.depth === 1 ? opacityNear : opacityFar,
            y: tile.depth === 1 ? yNear : yFar,
          }}
        >
          <div
            className={`hero-tile hero-tile--${tile.variant}`}
            style={
              {
                '--float-dur': `${6 + (i % 5) * 1.3}s`,
                '--float-delay': `${-(i * 0.9)}s`,
                '--float-x': `${i % 2 === 0 ? 6 : -7}px`,
                '--float-y': `${tile.depth === 1 ? -12 : -9}px`,
                '--float-rot': `${i % 3 === 0 ? 2 : -1.6}deg`,
              } as CSSProperties
            }
          >
            {tile.label && <span className="hero-tile__label">{tile.label}</span>}
          </div>
        </motion.div>
      ))}
    </>
  )
}

function HeroCopy() {
  return (
    <RevealGroup className="flex max-w-[640px] flex-col items-center" stagger={0.14} delay={0.35}>
      <RevealItem>
        <h1 className="hero-display text-pure-white m-0 mb-6 flex flex-col items-center">
          <RevealHeadline as="span" segments={[{ text: 'Run your shop.' }]} />
          <RevealHeadline
            as="span"
            segments={[{ text: 'Not the chaos.', className: 'italic-beat' }]}
            delay={0.2}
          />
        </h1>
      </RevealItem>
      <RevealItem>
        <p className="text-body-lg text-ivory m-0 mb-10 max-w-[520px] leading-[1.35] font-normal">
          Walk-ins, bookings, and checkout on one screen.
        </p>
      </RevealItem>
      <RevealItem>
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ExpandableScreenTrigger>
              <Btn variant="hero">Start free</Btn>
            </ExpandableScreenTrigger>
            <a
              href="#how-it-works"
              className="text-body-sm text-ivory/80 no-underline hover:text-pure-white transition-colors"
            >
              See how it works
            </a>
          </div>
          <p className="text-caption text-ash-text m-0 tracking-[0.01em]">
            14 days free · No card required · Cancel anytime
          </p>
        </div>
      </RevealItem>
    </RevealGroup>
  )
}

function MediaPlaceholder() {
  return (
    <>
      <div className="hero-mercury-bg" aria-hidden />
      <div className="hero-media-placeholder-chip" aria-hidden>
        <span className="hero-media-placeholder-chip__dot" />
        Hero video placeholder
      </div>
    </>
  )
}

export function Hero() {
  const reducedMotion = useReducedMotionSafe()
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  // Spring-smoothed progress. Also forces Motion's JS scroll tracking:
  // native ScrollTimeline acceleration mis-resolves opacity for sticky
  // children of tall sections (motiondivision/motion#3658).
  const progress = useSpring(scrollYProgress, {
    stiffness: 400,
    damping: 50,
    restDelta: 0.0005,
  })

  // Media panel: full-bleed → centered card → gone
  const mediaScale = useTransform(progress, [0, 0.38, 0.72], [1, 0.6, 0.34])
  const mediaRadius = useTransform(progress, [0.02, 0.3], [0, 40])
  const mediaOpacity = useTransform(progress, [0.52, 0.72], [1, 0])
  const mediaEvents = useTransform(progress, (p) =>
    p > 0.35 ? ('none' as const) : ('auto' as const),
  )

  // Hero copy fades out first
  const copyOpacity = useTransform(progress, [0.04, 0.26], [1, 0])
  const copyY = useTransform(progress, [0.04, 0.26], [0, -40])
  const copyEvents = useTransform(progress, (p) =>
    p > 0.15 ? ('none' as const) : ('auto' as const),
  )

  // Tiles fade in around the shrinking card, in two staggered groups
  const tilesNearOpacity = useTransform(progress, [0.12, 0.4], [0, 1])
  const tilesNearY = useTransform(progress, [0.12, 0.4], [32, 0])
  const tilesFarOpacity = useTransform(progress, [0.2, 0.52], [0, 1])
  const tilesFarY = useTransform(progress, [0.2, 0.52], [48, 0])

  // Center tagline appears once the card is nearly gone
  const taglineOpacity = useTransform(progress, [0.58, 0.8], [0, 1])
  const taglineY = useTransform(progress, [0.58, 0.8], [28, 0])

  if (reducedMotion) {
    return (
      <>
        <Nav variant="overlay" />
        <MobileNav />
        <section
          className="hero-mercury relative min-h-dvh flex flex-col"
          data-id="theme-switcher"
          data-theme="darkNeutral"
          data-apply-globally="false"
        >
          <MediaPlaceholder />
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-24 text-center">
            <HeroCopy />
          </div>
        </section>
        <section className="bg-paper px-6 py-24 text-center">
          <p className="hero-reveal-tagline m-0 mx-auto">
            Whatever you sell, cuts, coffee, or candles, run it all from one
            screen.
          </p>
        </section>
      </>
    )
  }

  return (
    <>
      <Nav variant="overlay" />
      <MobileNav />
      <section
        ref={sectionRef}
        className="hero-mercury relative h-[280vh]"
        data-id="theme-switcher"
        data-theme="darkNeutral"
        data-apply-globally="false"
      >
        <div className="sticky top-0 h-dvh overflow-hidden">
          {/* Reveal stage: tiles + tagline, uncovered as the media card shrinks */}
          <div className="absolute inset-0 z-0 bg-paper">
            <TileField
              opacityNear={tilesNearOpacity}
              yNear={tilesNearY}
              opacityFar={tilesFarOpacity}
              yFar={tilesFarY}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center px-6"
              style={{ opacity: taglineOpacity, y: taglineY }}
            >
              <RevealHeadline
                as="p"
                className="hero-reveal-tagline m-0 text-center"
                segments={[
                  {
                    text: 'Whatever you sell, cuts, coffee, or candles, run it all from one screen.',
                  },
                ]}
                delay={0.1}
              />
            </motion.div>
          </div>

          {/* Media panel: shrinks from full-bleed into a rounded card */}
          <motion.div
            className="absolute inset-0 z-10 overflow-hidden"
            style={{
              scale: mediaScale,
              borderRadius: mediaRadius,
              opacity: mediaOpacity,
              pointerEvents: mediaEvents,
            }}
          >
            <MediaPlaceholder />
          </motion.div>

          {/* Hero copy: separate layer so it doesn't shrink with the card */}
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 pb-16 pt-24 text-center"
            style={{ opacity: copyOpacity, y: copyY, pointerEvents: copyEvents }}
          >
            <HeroCopy />
          </motion.div>
        </div>
      </section>
    </>
  )
}
