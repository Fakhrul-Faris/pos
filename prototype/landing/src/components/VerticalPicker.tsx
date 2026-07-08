import { motion } from 'motion/react'
import { verticals, verticalHref } from '../data/verticals'
import { SectionLabel, ItalicHeadline } from './ui'

export function VerticalPicker() {
  return (
    <section id="verticals" className="py-[var(--section-gap)]">
      <div className="container-page">
        <SectionLabel>Your business</SectionLabel>
        <ItalicHeadline
          before="One platform."
          italic="Pick your shop."
        />
        <p className="text-subheading text-muted mt-4 mb-12 max-w-2xl">
          Same counter tablet. Different workflows. Choose yours to see what
          matters for how you operate.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {verticals.map((v, i) => (
            <motion.a
              key={v.slug}
              href={verticalHref(v.slug)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className={`${v.bg} rounded-[var(--radius-card)] p-6 no-underline text-ink group hover:scale-[1.01] transition-transform`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <span className={`text-heading-sm ${v.accent}`}>{v.title}</span>
                <span
                  className={`text-caption px-3 py-1 rounded-[var(--radius-pill)] shrink-0 ${
                    v.live
                      ? 'bg-signal text-paper'
                      : 'bg-paper/80 text-muted'
                  }`}
                >
                  {v.badge}
                </span>
              </div>
              <p className="text-body m-0 text-ink/90">{v.oneLiner}</p>
              <span className="inline-block mt-4 text-body-sm text-signal group-hover:translate-x-1 transition-transform">
                {v.live ? 'Explore →' : 'Join waitlist →'}
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
