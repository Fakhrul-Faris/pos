'use client'

import { motion } from 'motion/react'
import { spring } from '@/motion/springs'

type QueueNumberProps = {
  value: number | undefined
  tone?: 'default' | 'light'
  className?: string
}

/** Read-only queue # - tight #42, no NumberFlow input spacing quirks */
export function QueueNumber({ value, tone = 'default', className = '' }: QueueNumberProps) {
  const light = tone === 'light'

  return (
    <p
      className={`inline-flex items-baseline justify-center font-[family-name:var(--font-display)] font-bold tabular-nums tracking-tight ${
        light ? 'text-white' : 'text-[#1C1C1C]'
      } ${className}`}
      aria-label={value === undefined ? 'Queue number pending' : `Queue number ${value}`}
    >
      <span
        className={`text-[2.25rem] leading-none ${light ? 'text-white/70' : 'text-[#1C1C1C]'}`}
      >
        #
      </span>
      <motion.span
        key={value ?? 'pending'}
        initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={spring.snappy}
        className="text-[4.5rem] leading-none"
      >
        {value === undefined ? '-' : value}
      </motion.span>
    </p>
  )
}
