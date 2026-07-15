'use client'

import { Reveal } from '../Reveal'
import { LoadingCarousel } from '../ui/loading-carousel'
import { featureTips } from './data'
import { SectionHeadline } from './SectionHeadline'

export function BarbershopByod() {
  return (
    <section id="features" className="barbershop-band barbershop-band--paper">
      <div className="container-page barbershop-contain--medium">
        <div className="barbershop-section-head mb-10">
          <SectionHeadline before="Built around your" italic="busiest days." />
          <Reveal delay={0.2} y={20}>
            <p className="text-body-lg text-muted m-0 mt-4">
              Because Saturdays shouldn&apos;t feel like survival mode.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15} y={24}>
          <LoadingCarousel
            tips={[...featureTips]}
            backgroundTips
            aspectRatio="video"
            showProgress
            autoplayInterval={5000}
          />
        </Reveal>
      </div>
    </section>
  )
}
