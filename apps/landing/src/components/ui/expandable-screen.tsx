'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotionSafe } from '../../hooks/use-reduced-motion-safe'

type ExpandOptions = {
  morph?: boolean
}

interface ExpandableScreenContextValue {
  isExpanded: boolean
  canMorph: boolean
  morphEnabled: boolean
  expand: (options?: ExpandOptions) => void
  collapse: () => void
  layoutId: string
  triggerRadius: string
  contentRadius: string
  animationDuration: number
}

const ExpandableScreenContext = createContext<ExpandableScreenContextValue | null>(
  null,
)

export function useExpandableScreen() {
  const context = useContext(ExpandableScreenContext)
  if (!context) {
    throw new Error('useExpandableScreen must be used within an ExpandableScreen')
  }
  return context
}

export function useSignupScreen() {
  const { expand, collapse, isExpanded } = useExpandableScreen()
  return {
    openSignup: (options?: ExpandOptions) => expand(options),
    closeSignup: collapse,
    isOpen: isExpanded,
  }
}

interface ExpandableScreenProps {
  children: ReactNode
  defaultExpanded?: boolean
  onExpandChange?: (expanded: boolean) => void
  layoutId?: string
  triggerRadius?: string
  contentRadius?: string
  animationDuration?: number
  lockScroll?: boolean
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return isMobile
}

export function ExpandableScreen({
  children,
  defaultExpanded = false,
  onExpandChange,
  layoutId = 'expandable-card',
  triggerRadius = '32px',
  contentRadius = '24px',
  animationDuration = 0.35,
  lockScroll = true,
}: ExpandableScreenProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [morphRequested, setMorphRequested] = useState(true)
  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotionSafe()
  const canMorph = !isMobile && !reducedMotion
  const morphEnabled = canMorph && morphRequested

  const expand = useCallback(
    (options?: ExpandOptions) => {
      setMorphRequested(options?.morph ?? false)
      setIsExpanded(true)
      onExpandChange?.(true)
    },
    [onExpandChange],
  )

  const collapse = useCallback(() => {
    setIsExpanded(false)
    onExpandChange?.(false)
  }, [onExpandChange])

  useEffect(() => {
    if (!lockScroll) return
    document.body.style.overflow = isExpanded ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isExpanded, lockScroll])

  return (
    <ExpandableScreenContext.Provider
      value={{
        isExpanded,
        canMorph,
        morphEnabled,
        expand,
        collapse,
        layoutId,
        triggerRadius,
        contentRadius,
        animationDuration,
      }}
    >
      {children}
    </ExpandableScreenContext.Provider>
  )
}

interface ExpandableScreenTriggerProps {
  children: ReactNode
  className?: string
}

export function ExpandableScreenTrigger({
  children,
  className = '',
}: ExpandableScreenTriggerProps) {
  const { isExpanded, expand, layoutId, triggerRadius, canMorph } =
    useExpandableScreen()

  return (
    <AnimatePresence>
      {!isExpanded && (
        <motion.div className={`inline-block relative ${className}`.trim()}>
          {canMorph && (
            <motion.div
              style={{ borderRadius: triggerRadius }}
              layout
              layoutId={layoutId}
              className="absolute inset-0 transform-gpu will-change-transform bg-signal"
            />
          )}
          <motion.div
            initial={false}
            layout={false}
            onClick={() => expand({ morph: true })}
            className="relative cursor-pointer"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface ExpandableScreenContentProps {
  children: ReactNode
  className?: string
  showCloseButton?: boolean
  closeButtonClassName?: string
}

export function ExpandableScreenContent({
  children,
  className = '',
  showCloseButton = true,
  closeButtonClassName = '',
}: ExpandableScreenContentProps) {
  const {
    isExpanded,
    collapse,
    layoutId,
    contentRadius,
    animationDuration,
    morphEnabled,
  } = useExpandableScreen()

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          className="fixed inset-0 z-[200]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {!morphEnabled && (
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 z-0 bg-carbon/60 backdrop-blur-sm border-0 cursor-default"
              onClick={collapse}
            />
          )}

          <motion.div
            layoutId={morphEnabled ? layoutId : undefined}
            transition={{ duration: animationDuration, ease: [0.22, 1, 0.36, 1] }}
            initial={morphEnabled ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={morphEnabled ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={morphEnabled ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            style={{ borderRadius: morphEnabled ? contentRadius : 0 }}
            layout
            className={`absolute inset-0 z-10 flex h-full w-full overflow-y-auto transform-gpu will-change-transform ${className}`.trim()}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: morphEnabled ? 0.12 : 0.05, duration: 0.3 }}
              className="relative z-20 w-full min-h-full"
            >
              {children}
            </motion.div>

            {showCloseButton && (
              <motion.button
                type="button"
                onClick={collapse}
                className={
                  closeButtonClassName ||
                  'absolute right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-paper/10 text-paper text-xl leading-none cursor-pointer transition-colors hover:bg-paper/20'
                }
                aria-label="Close"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                ×
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
