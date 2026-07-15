'use client'

import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { flushSync } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotionSafe } from '../../hooks/use-reduced-motion-safe'

type ExpandOptions = {
  morph?: boolean
}

interface ExpandableScreenContextValue {
  isExpanded: boolean
  canMorph: boolean
  morphEnabled: boolean
  morphSourceId: string | null
  expand: (options?: ExpandOptions) => void
  collapse: () => void
  prepareMorphSource: (id: string) => void
  layoutId: string
  triggerRadius: string
  contentRadius: string
  animationDuration: number
}

const ExpandableScreenContext = createContext<ExpandableScreenContextValue | null>(
  null,
)

const MORPH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

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

function useMounted() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
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
  contentRadius = '28px',
  animationDuration = 0.42,
  lockScroll = true,
}: ExpandableScreenProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [morphRequested, setMorphRequested] = useState(false)
  const [morphSourceId, setMorphSourceId] = useState<string | null>(null)
  const mounted = useMounted()
  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotionSafe()
  const canMorph = mounted && !isMobile && !reducedMotion
  const morphEnabled = canMorph && morphRequested

  const prepareMorphSource = useCallback((id: string) => {
    setMorphSourceId(id)
  }, [])

  const expand = useCallback(
    (options?: ExpandOptions) => {
      const wantsMorph = options?.morph === true
      setMorphRequested(wantsMorph)
      if (!wantsMorph) setMorphSourceId(null)
      setIsExpanded(true)
      onExpandChange?.(true)
    },
    [onExpandChange],
  )

  const collapse = useCallback(() => {
    setIsExpanded(false)
    onExpandChange?.(false)
    // Keep morph source until the shared-layout exit finishes, then clear.
    window.setTimeout(() => {
      setMorphRequested(false)
      setMorphSourceId(null)
    }, animationDuration * 1000 + 100)
  }, [onExpandChange, animationDuration])

  useEffect(() => {
    if (!lockScroll) return
    document.body.style.overflow = isExpanded ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isExpanded, lockScroll])

  useEffect(() => {
    if (!isExpanded) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') collapse()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isExpanded, collapse])

  return (
    <ExpandableScreenContext.Provider
      value={{
        isExpanded,
        canMorph,
        morphEnabled,
        morphSourceId,
        expand,
        collapse,
        prepareMorphSource,
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
  const id = useId()
  const {
    isExpanded,
    expand,
    prepareMorphSource,
    layoutId,
    triggerRadius,
    canMorph,
    morphSourceId,
  } = useExpandableScreen()

  const handleOpen = () => {
    if (canMorph) {
      // Commit layoutId onto THIS trigger only, then expand — avoids
      // multi-trigger shared-layout ghosts on load and mid-page.
      flushSync(() => {
        prepareMorphSource(id)
      })
      expand({ morph: true })
      return
    }
    expand({ morph: false })
  }

  let trigger = children
  if (isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (event: MouseEvent) => void }>
    trigger = cloneElement(child, {
      onClick: (event: MouseEvent) => {
        child.props.onClick?.(event)
        if (!event.defaultPrevented) handleOpen()
      },
    })
  }

  // Keep layout space while open so the page doesn’t jump under the morph.
  if (isExpanded) {
    return (
      <span
        className={`inline-flex relative invisible pointer-events-none ${className}`.trim()}
        aria-hidden
      >
        <span className="relative inline-flex w-full">{children}</span>
      </span>
    )
  }

  // Only the clicked CTA owns layoutId. Idle triggers render none → no ghost drop.
  const showMorphLayer = canMorph && morphSourceId === id

  return (
    <span className={`inline-flex relative ${className}`.trim()}>
      {showMorphLayer && (
        <motion.span
          layoutId={layoutId}
          initial={false}
          style={{ borderRadius: triggerRadius }}
          className="absolute inset-0 block transform-gpu will-change-transform bg-signal"
        />
      )}
      <span className="relative inline-flex w-full">{trigger}</span>
    </span>
  )
}

interface ExpandableScreenContentProps {
  children: ReactNode
  className?: string
  showCloseButton?: boolean
  closeButtonClassName?: string
}

/** Fullscreen scrollport + dimmed backdrop. Morph target lives on the card. */
export function ExpandableScreenContent({
  children,
  className = '',
  showCloseButton = true,
  closeButtonClassName = '',
}: ExpandableScreenContentProps) {
  const { isExpanded, collapse, animationDuration, morphEnabled } =
    useExpandableScreen()
  const [portalReady, setPortalReady] = useState(false)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  if (!portalReady) return null

  return createPortal(
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          key="signup-overlay"
          className="fixed inset-0 z-[200]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: morphEnabled ? 1 : 0 }}
          transition={{
            duration: morphEnabled ? animationDuration : 0.2,
            ease: MORPH_EASE,
          }}
        >
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 z-0 border-0 cursor-default bg-carbon/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: morphEnabled ? animationDuration * 0.55 : 0.22,
              ease: MORPH_EASE,
            }}
            onClick={() => collapse()}
          />

          <div
            className={`absolute inset-0 z-10 overflow-y-auto overscroll-contain ${className}`.trim()}
          >
            {children}
          </div>

          {showCloseButton && (
            <motion.button
              type="button"
              onClick={() => collapse()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: morphEnabled ? animationDuration * 0.55 : 0.12,
                duration: 0.22,
                ease: MORPH_EASE,
              }}
              className={
                closeButtonClassName ||
                'absolute right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-ink/10 text-ink text-xl leading-none cursor-pointer transition-colors hover:bg-ink/16'
              }
              aria-label="Close"
            >
              ×
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

interface ExpandableScreenMorphSurfaceProps {
  children: ReactNode
  className?: string
}

/**
 * Shared-element morph target — CTA expands into this surface (the signup card).
 * Lime flash crossfades away as card content fades in on one timeline.
 */
export function ExpandableScreenMorphSurface({
  children,
  className = '',
}: ExpandableScreenMorphSurfaceProps) {
  const { morphEnabled, layoutId, contentRadius, animationDuration } =
    useExpandableScreen()
  const reducedMotion = useReducedMotionSafe()

  const limeDelay = morphEnabled ? animationDuration * 0.28 : 0
  const limeDuration = morphEnabled ? animationDuration * 0.55 : 0.01

  return (
    <motion.div
      layoutId={morphEnabled ? layoutId : undefined}
      transition={{
        layout: {
          duration: reducedMotion ? 0 : animationDuration,
          ease: MORPH_EASE,
        },
        duration: reducedMotion ? 0 : 0.32,
        ease: MORPH_EASE,
      }}
      {...(morphEnabled
        ? { initial: false }
        : {
            initial: { opacity: 0, y: 18, scale: 0.97 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, y: 12, scale: 0.98 },
          })}
      style={{ borderRadius: contentRadius }}
      className={`relative transform-gpu will-change-transform ${className}`.trim()}
    >
      {morphEnabled && !reducedMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5] bg-signal"
          style={{ borderRadius: 'inherit' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: limeDelay, duration: limeDuration, ease: MORPH_EASE }}
        />
      ) : null}

      {children}
    </motion.div>
  )
}
