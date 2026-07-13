'use client'

import { ItalicHeadline } from '../ui'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'
import { useSignupScreen } from '../ui/expandable-screen'
import { pricingIntro, pricingTiers } from './data'

function CheckIcon() {
  return (
    <svg
      className="barbershop-pricing-check"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M3.5 8.25 6.4 11.2 12.5 4.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PricingCta({ featured }: { featured?: boolean }) {
  const { openSignup } = useSignupScreen()

  return (
    <button
      type="button"
      className={[
        'barbershop-pricing-cta',
        featured ? 'barbershop-pricing-cta--featured' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => openSignup({ morph: false })}
    >
      Start Free
    </button>
  )
}

export function BarbershopPricing() {
  return (
    <section id="pricing" className="py-[var(--section-gap)]">
      <div className="container-page max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <ItalicHeadline
            before={pricingIntro.titleBefore}
            italic={pricingIntro.titleItalic}
          />
          <Reveal delay={0.2} y={20}>
            <p className="text-body-lg text-muted m-0 mt-4">{pricingIntro.sub}</p>
          </Reveal>
        </div>

        <RevealGroup
          className="barbershop-pricing-grid"
          stagger={0.1}
          delay={0.1}
        >
          {pricingTiers.map((tier) => (
            <RevealItem key={tier.id}>
              <article className="barbershop-pricing-card">
                <div
                  className={[
                    'barbershop-pricing-panel',
                    tier.badge ? 'barbershop-pricing-panel--featured' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {tier.badge && (
                    <span className="barbershop-pricing-badge">{tier.badge}</span>
                  )}
                  <p className="barbershop-pricing-name">{tier.name}</p>
                  <p className="barbershop-pricing-tagline">{tier.tagline}</p>
                  <div className="barbershop-pricing-price-row">
                    <span className="barbershop-pricing-price">{tier.price}</span>
                    <span className="barbershop-pricing-period">{tier.period}</span>
                  </div>
                </div>

                <PricingCta featured={Boolean(tier.badge)} />

                <ul className="barbershop-pricing-features">
                  {tier.highlights.map((line) => (
                    <li key={line}>
                      <CheckIcon />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
