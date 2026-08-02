'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import type { LoyaltyProfile } from '@/lib/loyaltyMock'
import { spring } from '@/motion/springs'

export type LoyaltySheetVariant = 'soft' | 'celebrate'

type LoyaltySheetProps = {
  open: boolean
  variant: LoyaltySheetVariant
  profile: LoyaltyProfile
  /** Celebrate shows this count (post-stamp); soft uses profile.stamps */
  stampsOverride?: number
  onDismiss: () => void
  onViewCard?: () => void
}

export function LoyaltySheet({
  open,
  variant,
  profile,
  stampsOverride,
  onDismiss,
  onViewCard,
}: LoyaltySheetProps) {
  const [mounted, setMounted] = useState(false)
  const stamps = stampsOverride ?? profile.stamps
  const { goal, campaignName, rewardLabel, isReturning } = profile
  const isCelebrate = variant === 'celebrate'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Dismiss"
            className="absolute inset-0 bg-black/40"
            onClick={onDismiss}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="loyalty-sheet-title"
            initial={{ y: 48, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.98 }}
            transition={spring.snappy}
            className="relative z-10 mx-3 mb-3 w-[calc(100%-24px)] max-w-md rounded-3xl bg-white px-6 pb-8 pt-5 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] sm:mb-0 sm:pb-7"
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-black/10 sm:hidden" aria-hidden />

            {isCelebrate ? (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={spring.playful}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#38CE87]/15 text-3xl"
              >
                ★
              </motion.div>
            ) : null}

            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1A7A4C]">
              {campaignName}
            </p>
            <h2
              id="loyalty-sheet-title"
              className="mt-2 text-center font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[#1C1C1C]"
            >
              {isCelebrate
                ? 'Stamp earned'
                : isReturning
                  ? "You're on the stamp card"
                  : 'Join the stamp card'}
            </h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-black/45">
              {isCelebrate
                ? `Visit paid · now ${stamps} of ${goal}`
                : isReturning
                  ? `${stamps} of ${goal} stamps · ${rewardLabel}`
                  : `${rewardLabel}. Stamps after you pay at the counter, not when you book.`}
            </p>

            <StampRow stamps={stamps} goal={goal} highlightLast={isCelebrate} />

            <div className="mt-7 flex flex-col gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={onDismiss}
                className="h-12 w-full rounded-full bg-[#111111] text-[15px] font-semibold text-white"
              >
                {isCelebrate ? 'Done' : 'Got it'}
              </motion.button>
              {!isCelebrate && onViewCard ? (
                <button
                  type="button"
                  onClick={onViewCard}
                  className="py-2.5 text-center text-sm font-semibold text-[#1A7A4C]"
                >
                  View card
                </button>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

function StampRow({
  stamps,
  goal,
  highlightLast,
}: {
  stamps: number
  goal: number
  highlightLast?: boolean
}) {
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-2">
      {Array.from({ length: goal }, (_, i) => {
        const filled = i < stamps
        const isNew = Boolean(highlightLast && i === stamps - 1)
        return (
          <motion.span
            key={i}
            initial={isNew ? { scale: 0.4, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={isNew ? { ...spring.playful, delay: 0.12 } : undefined}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              filled
                ? 'bg-[#38CE87] text-[#1C1C1C]'
                : 'bg-[#F3F3F3] text-black/20'
            } ${isNew ? 'ring-2 ring-[#1A7A4C] ring-offset-2' : ''}`}
          >
            {filled ? '★' : i + 1}
          </motion.span>
        )
      })}
    </div>
  )
}
