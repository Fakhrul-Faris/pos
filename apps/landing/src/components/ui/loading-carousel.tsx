'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../../lib/utils'
import { useReducedMotionSafe } from '../../hooks/use-reduced-motion-safe'

export type LoadingCarouselTip = {
  text: string
  image: string
  body?: string
}

type LoadingCarouselProps = {
  tips: LoadingCarouselTip[]
  className?: string
  autoplayInterval?: number
  showProgress?: boolean
  aspectRatio?: 'video' | 'square' | 'wide'
  backgroundTips?: boolean
  textPosition?: 'top' | 'bottom'
}

const aspectRatioClasses = {
  video: 'loading-carousel__stage--video',
  square: 'loading-carousel__stage--square',
  wide: 'loading-carousel__stage--wide',
} as const

export function LoadingCarousel({
  tips,
  className,
  autoplayInterval = 4500,
  showProgress = true,
  aspectRatio = 'video',
  backgroundTips = false,
  textPosition = 'bottom',
}: LoadingCarouselProps) {
  const prefersReducedMotion = useReducedMotionSafe()
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)
  const [epoch, setEpoch] = useState(0)

  const tipCount = tips.length
  const activeTip = tips[current]

  useEffect(() => {
    if (prefersReducedMotion || paused || tipCount <= 1) return

    const timer = window.setInterval(() => {
      setDirection(1)
      setCurrent((index) => (index + 1) % tipCount)
    }, autoplayInterval)

    return () => window.clearInterval(timer)
  }, [autoplayInterval, epoch, paused, prefersReducedMotion, tipCount])

  const handleSelect = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1)
    setCurrent(index)
    setEpoch((value) => value + 1)
  }, [current])

  if (!activeTip || tipCount === 0) return null

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.8, ease: 'easeOut' }
      }
      className={cn('loading-carousel', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false)
        }
      }}
    >
      <div className={cn('loading-carousel__stage', aspectRatioClasses[aspectRatio])}>
        <AnimatePresence initial={false} custom={direction} mode="sync">
          <motion.div
            key={current}
            custom={direction}
            variants={{
              enter: (dir: number) => ({
                x: prefersReducedMotion ? 0 : dir > 0 ? '100%' : '-100%',
                opacity: prefersReducedMotion ? 1 : 0,
              }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({
                x: prefersReducedMotion ? 0 : dir < 0 ? '100%' : '-100%',
                opacity: prefersReducedMotion ? 1 : 0,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.8, ease: 'easeInOut' }
            }
            className="loading-carousel__slide"
          >
            <Image
              src={activeTip.image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 960px"
              className="loading-carousel__image"
              priority={current === 0}
            />
            <div className="loading-carousel__veil" aria-hidden />

            {backgroundTips ? (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { delay: 0.3, duration: 0.5 }
                }
                className={cn(
                  'loading-carousel__overlay',
                  textPosition === 'top'
                    ? 'loading-carousel__overlay--top'
                    : 'loading-carousel__overlay--bottom',
                )}
              >
                <p className="loading-carousel__overlay-text">{activeTip.text}</p>
                {activeTip.body ? (
                  <p className="loading-carousel__overlay-body">{activeTip.body}</p>
                ) : null}
              </motion.div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="loading-carousel__footer">
        <div className="loading-carousel__indicators" role="tablist" aria-label="Features">
          {tips.map((tip, index) => {
            const isActive = index === current
            const isComplete = index < current

            return (
              <button
                key={`${tip.text}-${index}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to tip ${index + 1}`}
                className="loading-carousel__indicator"
                onClick={() => handleSelect(index)}
              >
                <span className="loading-carousel__indicator-track">
                  {showProgress ? (
                    isComplete ? (
                      <span className="loading-carousel__indicator-fill is-complete" />
                    ) : isActive ? (
                      <motion.span
                        key={`${current}-${epoch}`}
                        initial={{ scaleX: prefersReducedMotion ? 1 : 0 }}
                        animate={{ scaleX: 1 }}
                        transition={
                          prefersReducedMotion
                            ? { duration: 0 }
                            : {
                                duration: autoplayInterval / 1000,
                                ease: 'linear',
                              }
                        }
                        className="loading-carousel__indicator-fill is-active"
                      />
                    ) : null
                  ) : isActive ? (
                    <span className="loading-carousel__indicator-fill is-complete" />
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>

        {!backgroundTips ? (
          <div className="loading-carousel__copy">
            <p className="loading-carousel__title">{activeTip.text}</p>
            {activeTip.body ? (
              <p className="loading-carousel__body">{activeTip.body}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
