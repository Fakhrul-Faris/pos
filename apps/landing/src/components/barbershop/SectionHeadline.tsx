'use client'

import { RevealHeadline } from '../Reveal'
import { cn } from '../../lib/utils'

type HeadlineSegment = {
  text: string
  italic?: boolean
}

type SectionHeadlineProps = {
  /** Flexible segment API — preferred for multi-beat headlines */
  segments?: HeadlineSegment[]
  /** Convenience API (same as ItalicHeadline) */
  before?: string
  italic?: string
  after?: string
  /** `ink` on light sections, `inverse` on dark islands */
  tone?: 'ink' | 'inverse'
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  className?: string
  id?: string
  delay?: number
}

/**
 * Canonical section headline for business vertical pages.
 * Always uses `text-heading-lg` + tone color + RevealHeadline motion.
 */
export function SectionHeadline({
  segments,
  before = '',
  italic,
  after,
  tone = 'ink',
  as = 'h2',
  className,
  id,
  delay,
}: SectionHeadlineProps) {
  const resolved: HeadlineSegment[] =
    segments ??
    [
      ...(before ? [{ text: before }] : []),
      ...(italic ? [{ text: italic, italic: true as const }] : []),
      ...(after ? [{ text: after }] : []),
    ]

  return (
    <RevealHeadline
      as={as}
      id={id}
      delay={delay}
      segments={resolved.map((segment) => ({
        text: segment.text,
        className: segment.italic ? 'italic-beat' : undefined,
      }))}
      className={cn(
        'text-heading-lg m-0',
        tone === 'inverse' ? 'text-pure-white' : 'text-ink',
        className,
      )}
    />
  )
}
