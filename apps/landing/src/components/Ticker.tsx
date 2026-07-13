'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/utils'

type TickerProps = {
  items: string[]
  'aria-label'?: string
}

function TickerGroup({
  items,
  duplicate,
}: {
  items: string[]
  duplicate?: boolean
}) {
  return (
    <div className="c-ticker__group" aria-hidden={duplicate}>
      {items.map((item, index) => (
        <span key={`${duplicate ? 'dup' : 'orig'}-${index}`} className="c-ticker__item">
          {item}
          <span className="c-ticker__sep" aria-hidden>
            ·
          </span>
        </span>
      ))}
    </div>
  )
}

export function Ticker({ items, 'aria-label': ariaLabel }: TickerProps) {
  const rootRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(Boolean(entry?.isIntersecting))
      },
      { threshold: 0, rootMargin: '0px' },
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={rootRef}
      className={cn('c-ticker', !inView && 'is-offscreen')}
      aria-label={ariaLabel}
    >
      <div className="c-ticker__viewport">
        <div className="c-ticker__track">
          <TickerGroup items={items} />
          <TickerGroup items={items} duplicate />
        </div>
      </div>
    </section>
  )
}
