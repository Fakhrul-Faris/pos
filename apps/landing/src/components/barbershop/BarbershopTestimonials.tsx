'use client'

import { InfiniteMovingCards } from '../ui/infinite-moving-cards'
import { testimonials } from './data'
import { SectionHeadline } from './SectionHeadline'

export function BarbershopTestimonials() {
  return (
    <section id="testimonials" className="barbershop-testimonials barbershop-band barbershop-band--paper">
      <div className="container-page">
        <div className="barbershop-section-head mb-10 md:mb-12">
          <SectionHeadline
            segments={[
              { text: 'Trusted by shops' },
              { text: 'that switched.', italic: true },
            ]}
          />
          <p className="text-body-lg text-muted m-0 mt-4">
            Real owners. Real Saturdays. One app instead of three.
          </p>
        </div>
      </div>

      <InfiniteMovingCards
        items={[...testimonials]}
        direction="left"
        speed="slow"
        pauseOnHover
        className="barbershop-testimonials__scroller"
      />
    </section>
  )
}
