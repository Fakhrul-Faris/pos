import { useEffect, useRef, useState } from 'react'
import {
  motion,
  AnimatePresence,
  animate,
  useMotionValue,
  useTransform,
} from 'motion/react'
import { spring } from '@/motion/springs'

type MorphState = 'idle' | 'loading' | 'success'

type MorphButtonProps = {
  idleLabel: string
  loadingLabel?: string
  successLabel?: string
  onAction?: () => Promise<void>
  onSuccess?: () => void
  className?: string
}

export function MorphButton({
  idleLabel,
  loadingLabel = 'Processing…',
  successLabel = 'Done',
  onAction,
  onSuccess,
  className = '',
}: MorphButtonProps) {
  const [state, setState] = useState<MorphState>('idle')
  const [pressed, setPressed] = useState(false)
  const [hovered, setHovered] = useState(false)
  const widthRef = useRef<HTMLSpanElement>(null)
  const [minWidth, setMinWidth] = useState<number | undefined>(undefined)
  const scale = useMotionValue(1)
  const y = useMotionValue(0)
  const shadowBlur = useTransform(scale, [0.96, 1, 1.05], [4, 8, 14])
  const shadowY = useTransform(scale, [0.96, 1, 1.05], [1, 2, 4])
  const boxShadow = useTransform(
    [shadowBlur, shadowY],
    ([blur, offsetY]) => `0 ${offsetY}px ${blur}px rgba(0, 0, 0, 0.1)`,
  )

  const labels = { idle: idleLabel, loading: loadingLabel, success: successLabel }

  useEffect(() => {
    const el = widthRef.current
    if (!el) return
    setMinWidth(el.offsetWidth + 72)
  }, [idleLabel, loadingLabel, successLabel])

  // Idle micro-interactions: hover lift + press squash
  useEffect(() => {
    if (state !== 'idle') return
    if (pressed) {
      animate(scale, 0.965, { type: 'spring', stiffness: 520, damping: 28 })
      animate(y, 1.5, { type: 'spring', stiffness: 520, damping: 28 })
      return
    }
    if (hovered) {
      animate(scale, 1.015, spring.gentle)
      animate(y, -1, spring.gentle)
      return
    }
    animate(scale, 1, spring.snappy)
    animate(y, 0, spring.snappy)
  }, [pressed, hovered, state, scale, y])

  const bg =
    state === 'success' ? '#14832B' : state === 'loading' ? '#1C1C1C' : '#38CE87'
  const fg = state === 'success' ? '#FFFFFF' : '#1C1C1C'

  async function handleClick() {
    if (state !== 'idle') return
    setPressed(false)
    setHovered(false)

    // Release anticipation: stretch up → squash into action
    await Promise.all([
      animate(
        scale,
        [1, 1.06, 0.955],
        { duration: 0.32, ease: [0.22, 1.2, 0.36, 1], times: [0, 0.45, 1] },
      ),
      animate(
        y,
        [0, -4, 2],
        { duration: 0.32, ease: [0.22, 1.2, 0.36, 1], times: [0, 0.45, 1] },
      ),
    ])

    setState('loading')
    animate(scale, 0.98, spring.gentle)
    animate(y, 0, spring.gentle)

    try {
      await onAction?.()

      await animate(scale, 1.05, { type: 'spring', stiffness: 420, damping: 16 })
      setState('success')
      onSuccess?.()
      await Promise.all([animate(scale, 1, spring.natural), animate(y, 0, spring.natural)])

      window.setTimeout(() => setState('idle'), 1500)
    } catch {
      setState('idle')
      animate(scale, 1, spring.natural)
      animate(y, 0, spring.natural)
    }
  }

  return (
    <div className="relative inline-block">
      <span
        ref={widthRef}
        aria-hidden
        className="pointer-events-none invisible absolute whitespace-nowrap text-base font-semibold"
      >
        {[idleLabel, loadingLabel, successLabel].reduce((a, b) =>
          a.length >= b.length ? a : b,
        )}
      </span>

      <motion.button
        type="button"
        onClick={handleClick}
        disabled={state === 'loading'}
        onPointerDown={() => state === 'idle' && setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => {
          setPressed(false)
          setHovered(false)
        }}
        onPointerCancel={() => setPressed(false)}
        onPointerEnter={() => state === 'idle' && setHovered(true)}
        style={{ minWidth, scale, y, boxShadow }}
        className={`relative h-[52px] overflow-hidden rounded-xl px-8 text-base font-semibold disabled:cursor-wait ${className}`}
      >
        <motion.span
          className="absolute inset-0 rounded-xl"
          animate={{ backgroundColor: bg }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        />

        <span
          className="relative flex h-full items-center justify-center"
          style={{ color: fg }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={state}
              initial={{ opacity: 0, filter: 'blur(4px)', y: 6 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              exit={{ opacity: 0, filter: 'blur(4px)', y: -6 }}
              transition={{
                opacity: { duration: 0.14 },
                filter: { duration: 0.14 },
                y: spring.snappy,
              }}
              className="flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {state === 'loading' && (
                <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {state === 'success' && (
                <motion.span
                  initial={{ scale: 0.4, rotate: -30, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 480, damping: 18, delay: 0.04 }}
                >
                  ✓
                </motion.span>
              )}
              {labels[state]}
            </motion.span>
          </AnimatePresence>
        </span>
      </motion.button>
    </div>
  )
}
