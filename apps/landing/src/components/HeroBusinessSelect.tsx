'use client'

import { useEffect, useId, useRef, useState, type ElementType } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import {
  ChevronDown,
  ChevronRight,
  Scissors,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  UtensilsCrossed,
} from 'lucide-react'
import { cn } from '../lib/utils'
import {
  verticalBySlug,
  verticalCategories,
  verticalHref,
  type VerticalCategory,
} from '../data/verticals'
import { useReducedMotionSafe } from '../hooks/use-reduced-motion-safe'

type VerticalOption = {
  id: string
  label: string
  live: boolean
  icon: ElementType
}

type CategoryOption = {
  id: VerticalCategory['id']
  label: string
  tagline: string
  comingSoon: boolean
  icon: ElementType
  verticals: VerticalOption[]
}

const verticalIconBySlug: Record<string, ElementType> = {
  barbershop: Scissors,
  salon: Sparkles,
  clinic: Stethoscope,
}

const categoryIconById: Record<VerticalCategory['id'], ElementType> = {
  beauty: Sparkles,
  fnb: UtensilsCrossed,
  retail: ShoppingBag,
}

const categories: CategoryOption[] = verticalCategories.map((cat) => ({
  id: cat.id,
  label: cat.title,
  tagline: cat.tagline,
  comingSoon: 'comingSoon' in cat && cat.comingSoon === true,
  icon: categoryIconById[cat.id],
  verticals: cat.slugs.map((slug) => {
    const v = verticalBySlug(slug)
    return {
      id: slug,
      label: v?.title ?? slug,
      live: v?.live ?? false,
      icon: verticalIconBySlug[slug] ?? Sparkles,
    }
  }),
}))

const defaultCategoryId =
  categories.find((c) => !c.comingSoon && c.verticals.length > 0)?.id ??
  categories[0]?.id ??
  null

const spring = { type: 'spring' as const, stiffness: 520, damping: 36, mass: 0.75 }
const menuSpring = { type: 'spring' as const, stiffness: 460, damping: 34, mass: 0.8 }
const fade = { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const }

function categoryHasChildren(category: CategoryOption) {
  return !category.comingSoon && category.verticals.length > 0
}

export function HeroBusinessSelect() {
  const listId = useId()
  const activePillId = `hero-biz-cat-active-${useId()}`
  const reducedMotion = useReducedMotionSafe()
  const [open, setOpen] = useState(false)
  const [activeCategoryId, setActiveCategoryId] = useState<CategoryOption['id'] | null>(
    defaultCategoryId,
  )
  const rootRef = useRef<HTMLDivElement>(null)

  const activeCategory =
    categories.find((c) => c.id === activeCategoryId) ?? categories[0] ?? null

  useEffect(() => {
    if (!open) return

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    function onPointer(e: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }

    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
    }
  }, [open])

  function closeMenu() {
    setOpen(false)
  }

  function toggleOpen() {
    setOpen((v) => {
      if (!v) setActiveCategoryId(defaultCategoryId)
      return !v
    })
  }

  function selectCategory(category: CategoryOption) {
    setActiveCategoryId(category.id)
    if (categoryHasChildren(category)) return
    closeMenu()
    document.getElementById('verticals')?.scrollIntoView({ behavior: 'smooth' })
  }

  function selectVertical(option: VerticalOption) {
    if (!option.live) {
      closeMenu()
      document.getElementById('verticals')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    closeMenu()
    window.location.href = verticalHref(option.id)
  }

  const none = reducedMotion ? { duration: 0 } : undefined

  return (
    <MotionConfig reducedMotion="user">
      <div ref={rootRef} className={cn('hero-biz-select', open && 'is-open')}>
        <button
          type="button"
          className="btn btn--hero hero-biz-select__trigger"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
          onClick={toggleOpen}
        >
          <span className="btn__bg" aria-hidden />
          <span className="btn__label hero-biz-select__label">
            Choose your business
            <motion.span
              className="hero-biz-select__chevron"
              animate={{ rotate: open ? 180 : 0 }}
              transition={none ?? spring}
              aria-hidden
            >
              <ChevronDown size={16} strokeWidth={2.25} />
            </motion.span>
          </span>
        </button>

        <AnimatePresence>
          {open && activeCategory ? (
            <motion.div
              className="hero-biz-select__menu"
              id={listId}
              aria-label="Choose your business"
              style={{ transformOrigin: '50% 0%' }}
              initial={
                reducedMotion ? false : { opacity: 0, y: 8, scale: 0.96 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: 5, scale: 0.98 }}
              transition={none ?? menuSpring}
            >
              <div
                className="hero-biz-select__col"
                role="listbox"
                aria-label="Choose an industry"
              >
                {categories.map((category) => {
                  const Icon = category.icon
                  const hasChildren = categoryHasChildren(category)
                  const isActive = activeCategoryId === category.id
                  return (
                    <button
                      key={category.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      className={cn(
                        'hero-biz-select__option',
                        category.comingSoon && 'is-soon',
                        isActive && 'is-active',
                      )}
                      onMouseEnter={() => setActiveCategoryId(category.id)}
                      onFocus={() => setActiveCategoryId(category.id)}
                      onClick={() => selectCategory(category)}
                    >
                      {isActive ? (
                        <motion.span
                          layoutId={activePillId}
                          className="hero-biz-select__option-active"
                          transition={none ?? spring}
                          aria-hidden
                        />
                      ) : null}
                      <span className="hero-biz-select__option-icon" aria-hidden>
                        <Icon size={16} strokeWidth={2} />
                      </span>
                      <span className="hero-biz-select__option-copy">
                        <span className="hero-biz-select__option-title">
                          {category.label}
                        </span>
                        <span className="hero-biz-select__option-badge">
                          {category.comingSoon ? 'Coming soon' : category.tagline}
                        </span>
                      </span>
                      {hasChildren ? (
                        <span className="hero-biz-select__option-chevron" aria-hidden>
                          <ChevronRight size={15} strokeWidth={2.25} />
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>

              <div
                className="hero-biz-select__col hero-biz-select__col--children"
                role="listbox"
                aria-label={activeCategory.label}
              >
                <div className="hero-biz-select__col-stage">
                  <AnimatePresence initial={false}>
                    {categoryHasChildren(activeCategory) ? (
                      <motion.div
                        key={activeCategory.id}
                        className="hero-biz-select__col-stack"
                        initial={reducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reducedMotion ? undefined : { opacity: 0 }}
                        transition={none ?? fade}
                      >
                        {activeCategory.verticals.map((option) => {
                          const Icon = option.icon
                          return (
                            <button
                              key={option.id}
                              type="button"
                              role="option"
                              className={cn(
                                'hero-biz-select__option',
                                !option.live && 'is-soon',
                              )}
                              onClick={() => selectVertical(option)}
                            >
                              <span
                                className="hero-biz-select__option-icon"
                                aria-hidden
                              >
                                <Icon size={16} strokeWidth={2} />
                              </span>
                              <span className="hero-biz-select__option-copy">
                                <span className="hero-biz-select__option-title">
                                  {option.label}
                                </span>
                                {!option.live ? (
                                  <span className="hero-biz-select__option-badge">
                                    Coming soon
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          )
                        })}
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`soon-${activeCategory.id}`}
                        className="hero-biz-select__soon"
                        initial={reducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reducedMotion ? undefined : { opacity: 0 }}
                        transition={none ?? fade}
                      >
                        <span className="hero-biz-select__soon-title">
                          {activeCategory.label}
                        </span>
                        <span className="hero-biz-select__soon-copy">
                          {activeCategory.tagline} Coming soon.
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
