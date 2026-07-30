'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { fade, spring } from '@/lib/motion'

export type OverlayVariant = 'drawer-right' | 'sheet-bottom' | 'modal' | 'fullscreen'

type MotionOverlayProps = {
  open: boolean
  onClose?: () => void
  variant: OverlayVariant
  zClass?: string
  shellClassName?: string
  panelClassName?: string
  backdropClassName?: string
  children: ReactNode
  closeOnBackdrop?: boolean
  role?: string
  'aria-labelledby'?: string
  'aria-label'?: string
}

function panelProps(variant: OverlayVariant, reduce: boolean | null) {
  if (reduce) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.01 },
    }
  }
  switch (variant) {
    case 'drawer-right':
      return {
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
        transition: spring.gentle,
      }
    case 'sheet-bottom':
      return {
        initial: { y: '110%' },
        animate: { y: 0 },
        exit: { y: '110%' },
        transition: spring.gentle,
      }
    case 'modal':
      return {
        initial: { opacity: 0, scale: 0.94, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: 8 },
        transition: spring.snappy,
      }
    case 'fullscreen':
      return {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 6 },
        transition: spring.natural,
      }
  }
}

function shellAlign(variant: OverlayVariant) {
  if (variant === 'drawer-right') return 'flex justify-end'
  if (variant === 'sheet-bottom') return 'flex items-end justify-center'
  if (variant === 'modal') return 'flex items-center justify-center p-4'
  return 'flex flex-col'
}

/** Self-contained overlay with enter/exit (open prop). */
export function MotionOverlay({
  open,
  onClose,
  variant,
  zClass = 'z-50',
  shellClassName,
  panelClassName,
  backdropClassName = 'bg-carbon/25',
  children,
  closeOnBackdrop = true,
  role = 'dialog',
  'aria-labelledby': ariaLabelledBy,
  'aria-label': ariaLabel,
}: MotionOverlayProps) {
  const reduce = useReducedMotion()

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={`fixed inset-0 ${zClass} ${shellClassName ?? shellAlign(variant)}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduce ? { duration: 0.01 } : fade.micro}
        >
          {variant !== 'fullscreen' && (
            <motion.button
              type="button"
              aria-label="Close"
              className={`absolute inset-0 ${backdropClassName}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduce ? { duration: 0.01 } : fade.soft}
              onClick={() => {
                if (closeOnBackdrop) onClose?.()
              }}
            />
          )}
          <motion.div
            role={role}
            aria-modal={role === 'dialog' ? true : undefined}
            aria-labelledby={ariaLabelledBy}
            aria-label={ariaLabel}
            className={`relative ${panelClassName ?? ''}`}
            {...panelProps(variant, reduce)}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

/**
 * Use as a direct child of parent `<AnimatePresence>` when the component
 * mounts/unmounts with the overlay (e.g. bookingId && <Drawer />).
 */
export function MotionPresenceShell({
  variant,
  onClose,
  zClass = 'z-50',
  shellClassName,
  panelClassName,
  backdropClassName = 'bg-carbon/25',
  children,
  closeOnBackdrop = true,
  'aria-label': ariaLabel,
}: Omit<MotionOverlayProps, 'open'> & { children: ReactNode }) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={`fixed inset-0 ${zClass} ${shellClassName ?? shellAlign(variant)}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={reduce ? { duration: 0.01 } : fade.micro}
    >
      {variant !== 'fullscreen' && (
        <motion.button
          type="button"
          aria-label="Close"
          className={`absolute inset-0 ${backdropClassName}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (closeOnBackdrop) onClose?.()
          }}
        />
      )}
      <motion.div
        role="dialog"
        aria-modal
        aria-label={ariaLabel}
        className={`relative ${panelClassName ?? ''}`}
        {...panelProps(variant, reduce)}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

export function MotionToastHost({
  open,
  children,
  className,
}: {
  open: boolean
  children: ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={className}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
          transition={reduce ? { duration: 0.01 } : spring.snappy}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
