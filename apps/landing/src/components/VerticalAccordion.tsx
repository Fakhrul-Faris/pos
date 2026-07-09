import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotionSafe } from '../hooks/use-reduced-motion-safe'
import { REVEAL_EASE, VIEWPORT } from './Reveal'
import {
  verticalBySlug,
  verticalCategories,
  verticalHref,
  type VerticalCategory,
} from '../data/verticals'

const spring = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 28,
  mass: 0.85,
}

type VerticalAccordionCardProps = {
  category: VerticalCategory
  isActive: boolean
  onHover: () => void
  onSelect: () => void
  index: number
}

function VerticalAccordionCard({
  category,
  isActive,
  onHover,
  onSelect,
  index,
}: VerticalAccordionCardProps) {
  const reduceMotion = useReducedMotionSafe()

  return (
    <motion.article
      layout
      role="group"
      aria-label={category.title}
      className={`vertical-accordion-card vertical-accordion-card--${category.theme}${
        isActive ? ' is-active' : ''
      }`}
      initial={reduceMotion ? false : { opacity: 0, y: 44, filter: 'blur(8px)' }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={VIEWPORT}
      animate={{ flex: isActive ? 4.2 : 1 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              flex: spring,
              opacity: { duration: 0.75, delay: index * 0.08, ease: REVEAL_EASE },
              y: { duration: 0.75, delay: index * 0.08, ease: REVEAL_EASE },
              filter: { duration: 0.75, delay: index * 0.08, ease: REVEAL_EASE },
            }
      }
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      tabIndex={0}
    >
      <div className="vertical-accordion-card__art" aria-hidden />
      <div className="vertical-accordion-card__scrim" aria-hidden />

      <div className="vertical-accordion-card__content">
        <AnimatePresence mode="wait" initial={false}>
          {isActive ? (
            <motion.div
              key="expanded"
              className="vertical-accordion-card__expanded"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="vertical-accordion-card__header">
                <h3 className="vertical-accordion-card__title">{category.title}</h3>
                <p className="vertical-accordion-card__tagline">{category.tagline}</p>
              </div>

              {category.slugs.length > 0 ? (
                <ul className="vertical-accordion-card__links">
                  {category.slugs.map((slug) => {
                    const vertical = verticalBySlug(slug)
                    if (!vertical) return null

                    if (vertical.live) {
                      return (
                        <li key={slug}>
                          <a
                            href={verticalHref(slug)}
                            className="vertical-accordion-card__link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {vertical.title}
                          </a>
                        </li>
                      )
                    }

                    return (
                      <li key={slug}>
                        <span className="vertical-accordion-card__link vertical-accordion-card__link--soon">
                          {vertical.title}
                          <span className="vertical-accordion-card__soon">Coming Soon</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="vertical-accordion-card__soon-block">Coming soon</p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              className="vertical-accordion-card__collapsed"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3 className="vertical-accordion-card__title">{category.title}</h3>
              <p className="vertical-accordion-card__tagline">{category.tagline}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  )
}

export function VerticalAccordion() {
  const [activeId, setActiveId] = useState<string | null>(null)

  return (
    <div
      className="vertical-accordion"
      onMouseLeave={() => setActiveId(null)}
    >
      {verticalCategories.map((category, index) => (
        <VerticalAccordionCard
          key={category.id}
          index={index}
          category={category}
          isActive={activeId === category.id}
          onHover={() => setActiveId(category.id)}
          onSelect={() => setActiveId(category.id)}
        />
      ))}
    </div>
  )
}
