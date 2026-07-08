import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { verticalHref, verticals } from '../data/verticals'

type HeroBusinessPickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HeroBusinessPicker({ open, onOpenChange }: HeroBusinessPickerProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onOpenChange])

  function goToVertical(slug: string) {
    onOpenChange(false)
    window.location.href = verticalHref(slug)
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="hero-business-modal" aria-hidden={!open}>
          <motion.button
            type="button"
            aria-label="Close business picker"
            className="hero-business-modal__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
          />

          <div className="hero-business-modal__stage">
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="hero-business-modal__panel"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="hero-business-modal__header">
                <h2 id={titleId} className="hero-business-modal__title">
                  What kind of shop are you running?
                </h2>
                <button
                  type="button"
                  className="hero-business-modal__close"
                  aria-label="Close"
                  onClick={() => onOpenChange(false)}
                >
                  ×
                </button>
              </div>

              <p className="hero-business-modal__sub">
                Not sure? Pick the closest match. You can change it later.
              </p>

              <ul className="hero-business-modal__list">
                {verticals.map((v) => (
                  <li key={v.slug}>
                    <button
                      type="button"
                      className="hero-business-modal__option"
                      onClick={() => goToVertical(v.slug)}
                    >
                      <span className="hero-business-modal__option-copy">
                        <span className="hero-business-modal__option-title">
                          {v.title}
                        </span>
                        <span className="hero-business-modal__option-desc">
                          {v.oneLiner}
                        </span>
                      </span>
                      <span
                        className={`hero-business-modal__badge ${
                          v.live
                            ? 'hero-business-modal__badge--live'
                            : 'hero-business-modal__badge--soon'
                        }`}
                      >
                        {v.badge}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
