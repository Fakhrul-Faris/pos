'use client'

import { Reveal, RevealGroup, RevealHeadline, RevealItem } from '../Reveal'
import { whySwitchCompare, type WhySwitchValue } from './data'

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.25 9.15 7.7 11.55 12.75 6.45"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.4 6.4 11.6 11.6M11.6 6.4 6.4 11.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CompareCell({ value, tone }: { value: WhySwitchValue; tone: 'miki' | 'typical' }) {
  if (value.kind === 'yes') {
    return (
      <span className={`barbershop-compare__mark barbershop-compare__mark--yes-${tone}`}>
        <CheckIcon />
        <span className="sr-only">Yes</span>
      </span>
    )
  }

  if (value.kind === 'no') {
    return (
      <span className="barbershop-compare__mark barbershop-compare__mark--no">
        <CrossIcon />
        <span className="sr-only">No</span>
      </span>
    )
  }

  return <span className="barbershop-compare__text">{value.label}</span>
}

export function BarbershopWhyWorks() {
  return (
    <section id="why-works" className="barbershop-compare">
      <div className="container-page max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <RevealHeadline
            segments={[
              { text: 'Built for barbers.' },
              { text: 'Not adapted for them.', className: 'italic-beat' },
            ]}
            className="text-heading-lg text-pure-white m-0"
          />
        </div>

        <Reveal delay={0.12} y={28} blur={false}>
          <div className="barbershop-compare__card" role="table" aria-label="Miki versus typical booking apps">
            <div className="barbershop-compare__head" role="row">
              <div className="barbershop-compare__feature-label" role="columnheader">
                Feature
              </div>
              <div
                className="barbershop-compare__col-label barbershop-compare__col-label--miki"
                role="columnheader"
              >
                Miki
              </div>
              <div
                className="barbershop-compare__col-label barbershop-compare__col-label--typical"
                role="columnheader"
              >
                Typical Booking App
              </div>
            </div>

            <RevealGroup className="barbershop-compare__rows" stagger={0.05} delay={0.15}>
              {whySwitchCompare.map((row) => (
                <RevealItem key={row.feature} className="barbershop-compare__row-wrap">
                  <div className="barbershop-compare__row" role="row">
                    <div className="barbershop-compare__feature" role="cell">
                      {row.feature}
                    </div>
                    <div className="barbershop-compare__cell" role="cell">
                      <span className="barbershop-compare__mobile-label">Miki</span>
                      <CompareCell value={row.miki} tone="miki" />
                    </div>
                    <div className="barbershop-compare__cell" role="cell">
                      <span className="barbershop-compare__mobile-label">Typical</span>
                      <CompareCell value={row.typical} tone="typical" />
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
