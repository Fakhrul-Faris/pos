import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { REVEAL_EASE } from './Reveal'

const STORAGE_KEY = 'miki-promo-dismissed'

export function PromoBanner() {
  const [visible, setVisible] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    setVisible(localStorage.getItem(STORAGE_KEY) !== '1')
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <motion.div
      id="navbar-banner"
      className="bg-promo-bg text-paper text-body-sm tracking-[0.03em] overflow-hidden"
      initial={reduced ? false : { height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      transition={{ duration: 0.55, ease: REVEAL_EASE }}
    >
      <div className="container-page flex items-center justify-between gap-4 py-3">
        <p className="m-0 text-center flex-1">
          First 50 <span className="text-signal font-medium">barbershops</span>{' '}
          per city get{' '}
          <span className="text-signal font-medium">RM89/mo locked for life</span>
          . Start your 14-day trial: full features, no card required.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 bg-transparent border-0 text-ash cursor-pointer p-2 hover:text-paper transition-colors"
          aria-label="Dismiss promo banner"
        >
          ✕
        </button>
      </div>
    </motion.div>
  )
}
