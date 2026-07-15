'use client'

import { Btn } from '../Btn'
import { ExpandableScreenTrigger } from '../ui/expandable-screen'
import { ctaLabel, pricingIntro, pricingTiers } from './data'
import { SectionHeadline } from './SectionHeadline'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'

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
  return (
    <ExpandableScreenTrigger className="w-full">
      <Btn variant={featured ? 'block' : 'inverse'}>{ctaLabel}</Btn>
    </ExpandableScreenTrigger>
  )
}

export function BarbershopPricing() {
  return (
    <section id="pricing" className="barbershop-band barbershop-band--linen">
      <div className="container-page barbershop-contain--wide">
        <div className="barbershop-section-head mb-12">
          <SectionHeadline
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
