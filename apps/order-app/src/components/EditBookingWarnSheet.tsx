'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { spring } from '@/motion/springs'

type EditBookingWarnSheetProps = {
  open: boolean
  queueNumber: number
  onCancel: () => void
  onConfirm: () => void
}

export function EditBookingWarnSheet({
  open,
  queueNumber,
  onCancel,
  onConfirm,
}: EditBookingWarnSheetProps) {
  const [mounted, setMounted] = useState(false)

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
            aria-label="Cancel"
            className="absolute inset-0 bg-black/40"
            onClick={onCancel}
          />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="edit-booking-warn-title"
            aria-describedby="edit-booking-warn-desc"
            initial={{ y: 48, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.98 }}
            transition={spring.snappy}
            className="relative z-10 mx-3 mb-3 w-[calc(100%-24px)] max-w-md rounded-3xl bg-white px-6 pb-8 pt-5 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] sm:mb-0 sm:pb-7"
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-black/10 sm:hidden" aria-hidden />

            <h2
              id="edit-booking-warn-title"
              className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[#1C1C1C]"
            >
              Edit this booking?
            </h2>
            <p id="edit-booking-warn-desc" className="mt-2 text-sm leading-relaxed text-black/55">
              You’re #{queueNumber}. If you add people or services, you’ll get a{' '}
              <span className="font-semibold text-[#1C1C1C]">new queue number</span>. More chair
              time moves you in line. Phone can’t be changed.
            </p>

            <div className="mt-6 space-y-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className="w-full rounded-xl bg-[#38CE87] py-3.5 text-sm font-semibold text-[#1C1C1C]"
              >
                Continue to edit
              </motion.button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2.5 text-center text-sm font-medium text-black/45"
              >
                Keep my booking
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
