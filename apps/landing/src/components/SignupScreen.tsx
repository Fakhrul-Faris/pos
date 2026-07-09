'use client'

import { type FormEvent, useId, useState } from 'react'
import { verticalHref, verticals } from '../data/verticals'
import {
  ExpandableScreenContent,
} from './ui/expandable-screen'

const benefits = [
  {
    icon: '✓',
    text: 'Walk-ins, bookings, and checkout on one counter tablet — no app for customers.',
  },
  {
    icon: '⚡',
    text: '14 days free with full features. No card required. Your tablet, not ours.',
  },
]

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
    window.location.hash = 'waitlist'
  }

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
      <div className="signup-form__field">
        <label htmlFor={businessId} className="signup-form__label">
          Business type *
        </label>
        <select
          id={businessId}
          name="business-type"
          required
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          className="signup-form__input signup-form__select"
        >
          {verticals.map((v) => (
            <option key={v.slug} value={v.slug}>
              {v.title} {v.live ? '' : '(coming soon)'}
            </option>
          ))}
        </select>
        <p className="signup-form__helper">
          Not sure? Pick the closest match. You can change it later.
        </p>
      </div>

      <div className="signup-form__field">
        <label htmlFor={nameId} className="signup-form__label">
          Full name *
        </label>
        <input
          type="text"
          id={nameId}
          name="name"
          required
          autoComplete="name"
          className="signup-form__input"
        />
      </div>

      <div className="signup-form__field">
        <label htmlFor={emailId} className="signup-form__label">
          Email *
        </label>
        <input
          type="email"
          id={emailId}
          name="email"
          required
          autoComplete="email"
          className="signup-form__input"
        />
      </div>

      <div className="signup-form__field">
        <label htmlFor={passwordId} className="signup-form__label">
          Password *
        </label>
        <input
          type="password"
          id={passwordId}
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="signup-form__input"
        />
      </div>

      <button type="submit" className="signup-form__submit">
        Create account
      </button>

      <p className="signup-form__trust">
        14 days free · No card required · Cancel anytime
      </p>
    </form>
  )
}

export function SignupScreenContent() {
  return (
    <ExpandableScreenContent className="bg-signal">
      <div className="signup-screen">
        <div className="signup-screen__layout">
          <div className="signup-screen__copy">
            <p className="signup-screen__eyebrow">Start free trial</p>
            <h2 className="signup-screen__title">
              Run your shop from one screen.
            </h2>
            <p className="signup-screen__sub">
              Customers book from your QR. Staff run the counter from a shared
              tablet. You manage from the web.
            </p>

            <ul className="signup-screen__benefits">
              {benefits.map((item) => (
                <li key={item.text} className="signup-screen__benefit">
                  <span className="signup-screen__benefit-icon" aria-hidden>
                    {item.icon}
                  </span>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>

            <div className="signup-screen__quote">
              <p>
                &ldquo;Finally — walk-ins and bookings in one place. We were live
                the same afternoon.&rdquo;
              </p>
              <div className="signup-screen__quote-meta">
                <span className="signup-screen__quote-avatar" aria-hidden>
                  AK
                </span>
                <div>
                  <p className="signup-screen__quote-name">Ahmad K.</p>
                  <p className="signup-screen__quote-role">Barbershop owner, KL</p>
                </div>
              </div>
            </div>
          </div>

          <div className="signup-screen__form-panel">
            <h3 className="signup-screen__form-title">Create your account</h3>
            <p className="signup-screen__form-sub">
              Barbershops are live today. Other verticals are on the way — same
              platform, different workflows.
            </p>
            <SignupForm />
          </div>
        </div>
      </div>
    </ExpandableScreenContent>
  )
}
