import { RevealGroup, RevealItem } from './Reveal'
import { SectionHeadline } from './barbershop/SectionHeadline'
import { HeroBusinessSelect } from './HeroBusinessSelect'

export function ClosingCta() {
  return (
    <section
      id="cta"
      className="barbershop-band barbershop-band--ink"
      data-nav-bg="dark"
    >
      <div className="container-page barbershop-contain--prose text-center">
        <RevealGroup stagger={0.12} delay={0.1}>
          <RevealItem>
            <SectionHeadline
              tone="inverse"
              className="mb-5"
              segments={[
                { text: "Your counter's" },
                { text: 'waiting.', italic: true },
              ]}
            />
          </RevealItem>
          <RevealItem>
            <p className="text-body-lg text-ivory m-0 mb-8">
              Set up takes minutes. No card, no contract, no hardware to buy.
            </p>
          </RevealItem>
          <RevealItem>
            <div className="flex justify-center">
              <HeroBusinessSelect />
            </div>
            <p className="text-caption text-ash-text m-0 mt-4 tracking-[0.01em]">
              14 days free · No card required · Cancel anytime
            </p>
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  )
}
