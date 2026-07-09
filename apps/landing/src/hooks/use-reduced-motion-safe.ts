'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'

/**
 * Defer prefers-reduced-motion until after hydration so SSR and the first
 * client render always produce the same tree.
 */
export function useReducedMotionSafe() {
  const reducedMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted && Boolean(reducedMotion)
}
