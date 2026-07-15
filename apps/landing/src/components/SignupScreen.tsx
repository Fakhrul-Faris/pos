'use client'

import { type FormEvent, useId, useState } from 'react'
import { motion } from 'motion/react'
import { verticalHref, verticals } from '../data/verticals'
import { BusinessTypeSelect } from './ui/business-type-select'
import {
  ExpandableScreenContent,
  ExpandableScreenMorphSurface,
  useExpandableScreen,
} from './ui/expandable-screen'
import { SignupAnimatedField } from './ui/signup-animated-field'
import { useReducedMotionSafe } from '../hooks/use-reduced-motion-safe'

const CONTENT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

function SignupForm() {
  const nameId = useId()
  const emailId = useId()
  const passwordId = useId()
  const businessId = useId()
  const [businessType, setBusinessType] = useState<string>(verticals[0].slug)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const selected = verticals.find((v) => v.slug === businessType)
    if (selected?.live) {
      window.location.href = `${verticalHref(businessType)}?signup=1`
      return
    }
    window.location.hash = 'cta'
  }

  return (
    <form id="signup-form" className="signup-form" onSubmit={handleSubmit}>
      <div className="signup-form__field">
        <label htmlFor={businessId} className="signup-form__label">
          Business type *
        </label>
        <BusinessTypeSelect
          id={businessId}
          name="business-type"
          required
          value={businessType}
          onChange={setBusinessType}
        />
      </div>

      <div className="signup-form__row">
        <SignupAnimatedField
          id={nameId}
          name="name"
          label="Full name"
          required
          autoComplete="name"
          minLength={2}
        />

        <SignupAnimatedField
          id={emailId}
          name="email"
          type="email"
          label="Email"
          required
          autoComplete="email"
        />
      </div>

      <SignupAnimatedField
        id={passwordId}
        name="password"
        type="password"
        label="Password"
        required
        minLength={8}
        autoComplete="new-password"
      />

      <div className="signup-form__footer">
        <p className="signup-form__secured">
          <span className="signup-form__secured-icon" aria-hidden>
            ✓
          </span>
          No card required
        </p>
        <button type="submit" className="signup-form__submit">
          Start free <span aria-hidden>→</span>
        </button>
      </div>
    </form>
  )
}

function SignupCardSections() {
  const { morphEnabled, animationDuration } = useExpandableScreen()
  const reducedMotion = useReducedMotionSafe()

  const baseDelay = reducedMotion
    ? 0
    : morphEnabled
      ? animationDuration * 0.48
      : 0.08

  return (
    <>
      <motion.div
        className="signup-screen__copy"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: baseDelay,
          duration: reducedMotion ? 0 : 0.3,
          ease: CONTENT_EASE,
        }}
      >
        <h2 className="signup-screen__title">You&apos;re almost running.</h2>
        <p className="signup-screen__sub">
          Add your services, share your QR, and you&apos;re ready for walk-ins
          and bookings.
        </p>
      </motion.div>

      <motion.div
        className="signup-screen__panel"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: baseDelay + (reducedMotion ? 0 : 0.07),
          duration: reducedMotion ? 0 : 0.32,
          ease: CONTENT_EASE,
        }}
      >
        <SignupForm />
      </motion.div>
    </>
  )
}

export function SignupScreenContent() {
  const { collapse } = useExpandableScreen()

  return (
    <ExpandableScreenContent className="signup-screen-shell">
      <div
        className="signup-screen"
        onClick={(event) => {
          if (event.target === event.currentTarget) collapse()
        }}
      >
        <ExpandableScreenMorphSurface className="signup-screen__card">
          <SignupCardSections />
        </ExpandableScreenMorphSurface>
      </div>
    </ExpandableScreenContent>
  )
}
