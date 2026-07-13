'use client'

import { RevealHeadline } from '../Reveal'
import { InfiniteMovingCards } from '../ui/infinite-moving-cards'
import { testimonials } from './data'

export function BarbershopTestimonials() {
  return (
    <section id="testimonials" className="barbershop-testimonials">
      <div className="container-page max-w-4xl mx-auto">
        <div className="max-w-2xl mb-10 md:mb-12">
          <RevealHeadline
            segments={[
              { text: 'Trusted by shops' },
              { text: 'that switched.', className: 'italic-beat' },
            ]}
            className="text-heading-lg text-ink m-0"
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
