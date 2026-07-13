'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { cn } from '../../lib/utils'
import { useReducedMotionSafe } from '../../hooks/use-reduced-motion-safe'

export type InfiniteMovingCardItem = {
  quote: string
  name: string
  title: string
}

type InfiniteMovingCardsProps = {
  items: InfiniteMovingCardItem[]
  direction?: 'left' | 'right'
  speed?: 'fast' | 'normal' | 'slow'
  pauseOnHover?: boolean
  className?: string
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function TestimonialCard({ item }: { item: InfiniteMovingCardItem }) {
  return (
    <li className="barbershop-testimonial-card">
      <blockquote className="barbershop-testimonial-card__quote">
        <p>{item.quote}</p>
      </blockquote>
      <div className="barbershop-testimonial-card__author">
        <span className="barbershop-testimonial-card__avatar" aria-hidden>
          {initials(item.name)}
        </span>
        <span className="barbershop-testimonial-card__meta">
          <span className="barbershop-testimonial-card__name">{item.name}</span>
          <span className="barbershop-testimonial-card__title">{item.title}</span>
        </span>
      </div>
    </li>
  )
}

export function InfiniteMovingCards({
  items,
  direction = 'left',
  speed = 'slow',
  pauseOnHover = true,
  className,
}: InfiniteMovingCardsProps) {
  const prefersReducedMotion = useReducedMotionSafe()
  const [started, setStarted] = useState(false)

  useEffect(() => {
    setStarted(true)
  }, [])

  const duration =
    speed === 'fast' ? '20s' : speed === 'normal' ? '40s' : '70s'

  // Pad short lists so one row still fills the viewport before looping.
  const padded = items.length < 5 ? [...items, ...items] : [...items]
  const loopItems = [...padded, ...padded]

  if (prefersReducedMotion) {
    return (
      <div className={cn('barbershop-testimonial-scroller', className)}>
        <ul className="barbershop-testimonial-scroller__track is-static">
          {items.map((item) => (
            <TestimonialCard key={`${item.name}-static`} item={item} />
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div
      className={cn('barbershop-testimonial-scroller', className)}
      style={
        {
          '--animation-direction': direction === 'left' ? 'forwards' : 'reverse',
          '--animation-duration': duration,
        } as CSSProperties
      }
    >
      <ul
        className={cn(
          'barbershop-testimonial-scroller__track',
          started && 'is-animated',
          pauseOnHover && 'is-pause-on-hover',
        )}
      >
        {loopItems.map((item, index) => (
          <TestimonialCard key={`${item.name}-${index}`} item={item} />
        ))}
      </ul>
    </div>
  )
}
