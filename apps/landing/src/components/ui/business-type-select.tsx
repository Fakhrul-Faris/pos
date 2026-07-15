'use client'

import * as React from 'react'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { ChevronDown, Scissors, Sparkles, Stethoscope } from 'lucide-react'
import { cn } from '../../lib/utils'
import { verticals, type Vertical } from '../../data/verticals'

type BusinessOption = {
  id: string
  label: string
  live: boolean
  icon: React.ElementType
  color: string
}

const options: BusinessOption[] = verticals.map((v: Vertical) => {
  if (v.slug === 'barbershop') {
    return {
      id: v.slug,
      label: v.title,
      live: v.live,
      icon: Scissors,
      color: '#beff50',
    }
  }
  if (v.slug === 'salon') {
    return {
      id: v.slug,
      label: v.title,
      live: v.live,
      icon: Sparkles,
      color: '#9ad8ff',
    }
  }
  return {
    id: v.slug,
    label: v.title,
    live: v.live,
    icon: Stethoscope,
    color: '#f5c16c',
  }
})

function useClickAway(
  ref: React.RefObject<HTMLElement | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
) {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return
      handler(event)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

function IconWrapper({
  icon: Icon,
  isHovered,
  color,
}: {
  icon: React.ElementType
  isHovered: boolean
  color: string
}) {
  return (
    <motion.div
      className="signup-type-select__icon"
      initial={false}
      animate={isHovered ? { scale: 1.15 } : { scale: 1 }}
    >
      <Icon className="signup-type-select__icon-svg" aria-hidden />
      {isHovered ? (
        <motion.div
          className="signup-type-select__icon-overlay"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          <Icon className="signup-type-select__icon-svg" strokeWidth={2} aria-hidden />
        </motion.div>
      ) : null}
    </motion.div>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren' as const,
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
}

type BusinessTypeSelectProps = {
  id?: string
  name?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export function BusinessTypeSelect({
  id,
  name = 'business-type',
  value,
  onChange,
  required,
}: BusinessTypeSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const selected =
    options.find((option) => option.id === value) ?? options[0]

  useClickAway(dropdownRef, () => setIsOpen(false))

  const activeId = hoveredId ?? selected.id
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.id === activeId),
  )

  return (
    <MotionConfig reducedMotion="user">
      <div className="signup-type-select" ref={dropdownRef}>
        <input type="hidden" name={name} value={selected.id} required={required} />

        <button
          type="button"
          id={id}
          className={cn(
            'signup-type-select__trigger',
            isOpen && 'signup-type-select__trigger--open',
          )}
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={id ? `${id}-listbox` : undefined}
        >
          <span className="signup-type-select__value">
            <IconWrapper
              icon={selected.icon}
              isHovered={false}
              color={selected.color}
            />
            <span>
              {selected.label}
              {!selected.live ? (
                <span className="signup-type-select__soon"> (coming soon)</span>
              ) : null}
            </span>
          </span>
          <motion.span
            className="signup-type-select__chevron"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden
          >
            <ChevronDown className="signup-type-select__chevron-svg" />
          </motion.span>
        </button>

        <AnimatePresence>
          {isOpen ? (
            <motion.div
              className="signup-type-select__menu-wrap"
              initial={{ opacity: 1, y: 0, height: 0 }}
              animate={{
                opacity: 1,
                y: 0,
                height: 'auto',
                transition: {
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                  mass: 1,
                },
              }}
              exit={{
                opacity: 0,
                y: 0,
                height: 0,
                transition: {
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                  mass: 1,
                },
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsOpen(false)
              }}
            >
              <motion.div
                className="signup-type-select__menu"
                initial={{ borderRadius: 10 }}
                animate={{
                  borderRadius: 14,
                  transition: { duration: 0.2 },
                }}
                style={{ transformOrigin: 'top' }}
                role="listbox"
                id={id ? `${id}-listbox` : undefined}
                aria-labelledby={id}
              >
                <motion.div
                  className="signup-type-select__list"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div
                    layoutId="signup-type-hover"
                    className="signup-type-select__highlight"
                    animate={{
                      y: activeIndex * 44,
                      height: 40,
                    }}
                    transition={{
                      type: 'spring',
                      bounce: 0.15,
                      duration: 0.45,
                    }}
                  />
                  {options.map((option) => {
                    const isActive =
                      selected.id === option.id || hoveredId === option.id
                    return (
                      <motion.button
                        key={option.id}
                        type="button"
                        role="option"
                        aria-selected={selected.id === option.id}
                        onClick={() => {
                          onChange(option.id)
                          setIsOpen(false)
                        }}
                        onHoverStart={() => setHoveredId(option.id)}
                        onHoverEnd={() => setHoveredId(null)}
                        className={cn(
                          'signup-type-select__option',
                          isActive && 'signup-type-select__option--active',
                        )}
                        whileTap={{ scale: 0.98 }}
                        variants={itemVariants}
                      >
                        <IconWrapper
                          icon={option.icon}
                          isHovered={hoveredId === option.id}
                          color={option.color}
                        />
                        <span>
                          {option.label}
                          {!option.live ? (
                            <span className="signup-type-select__soon">
                              {' '}
                              (coming soon)
                            </span>
                          ) : null}
                        </span>
                      </motion.button>
                    )
                  })}
                </motion.div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
