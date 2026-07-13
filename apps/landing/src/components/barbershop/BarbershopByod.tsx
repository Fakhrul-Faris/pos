'use client'

import { ItalicHeadline } from '../ui'
import { Reveal } from '../Reveal'
import { LoadingCarousel } from '../ui/loading-carousel'
import { featureTips } from './data'

export function BarbershopByod() {
  return (
    <section id="features" className="py-[var(--section-gap)]">
      <div className="container-page max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <ItalicHeadline before="Built around your" italic="busiest days." />
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
