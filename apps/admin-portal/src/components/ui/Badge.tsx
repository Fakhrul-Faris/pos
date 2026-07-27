'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Tone = 'gray' | 'blue' | 'green' | 'amber' | 'red'

/** Badge uses gray-200/300 or color-100 + color-900 per Geist small-element guidance */
const toneClass: Record<Tone, string> = {
  gray: 'bg-gray-200 text-gray-900',
  blue: 'bg-blue-100 text-blue-900',
  green: 'bg-green-100 text-green-900',
  amber: 'bg-amber-100 text-amber-900',
  red: 'bg-red-100 text-red-900',
}

export function Badge({
  children,
  tone = 'gray',
  className = '',
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-[6px] px-1.5 py-0.5 text-[11px] font-medium capitalize',
        toneClass[tone],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}

export function Chip({
  children,
  active,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      data-active={active ? 'true' : 'false'}
      className={['geist-chip', className].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
