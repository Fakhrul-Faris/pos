import { motion } from 'motion/react'
import { ItalicHeadline } from './ui'

const points = [
  {
    title: 'Not retail floors',
    copy: 'Built for queues and bookings, not inventory aisles.',
  },
  {
    title: 'No hardware bundle',
    copy: 'Your tablet. We sell software.',
  },
  {
    title: 'Your payments, your rules',
    copy: 'Cash and your own DuitNow always work. We never block checkout.',
  },
]

export function WhyNotPos() {
  return (
    <section id="compare" className="py-[var(--section-gap)]">
      <div className="container-page">
        <ItalicHeadline
          before="Built for service shops."
          italic="Not retail floors."
        />
        <p className="text-subheading text-muted mt-4 mb-12 max-w-xl">
          Narrow on purpose. Queue-first. BYOD. No sales call.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {points.map((point, i) => (
            <motion.article
              key={point.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-lift p-6"
            >
              <h3 className="text-heading-sm text-ink m-0 mb-3">{point.title}</h3>
              <p className="text-body text-muted m-0">{point.copy}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
