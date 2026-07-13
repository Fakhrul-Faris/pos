import { ItalicHeadline } from '../ui'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'
import {
  features,
  featuresAlsoIncluded,
  groupBookingsNote,
} from './data'

export function BarbershopFeatures() {
  return (
    <section id="features" className="py-[var(--section-gap)] bg-linen/50 border-y border-ash">
      <div className="container-page max-w-5xl mx-auto">
        <div className="max-w-2xl mb-12">
          <ItalicHeadline before="Built around the" italic="chair." />
          <Reveal delay={0.2} y={20}>
            <p className="text-body-lg text-muted m-0 mt-4">
              Every feature here answers a question you already ask on a busy
              Saturday.
            </p>
          </Reveal>
        </div>

        <RevealGroup className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.08} delay={0.1}>
          {features.map((feature) => (
            <RevealItem key={feature.title}>
              <article className="h-full rounded-[28px] bg-paper border border-ash p-6">
                <h3 className="text-subheading text-ink m-0 mb-3">{feature.title}</h3>
                <p className="text-body text-muted m-0 leading-[1.5]">{feature.body}</p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal delay={0.3} y={16} className="mt-8">
          <p className="text-body text-muted m-0">{featuresAlsoIncluded}</p>
        </Reveal>

        <Reveal delay={0.35} y={16} className="mt-6">
          <blockquote className="m-0 rounded-[28px] border-l-4 border-signal bg-linen px-5 py-4 text-body text-ink">
            <strong>Group bookings</strong> — {groupBookingsNote.replace(/^Group bookings — /, '')}
          </blockquote>
        </Reveal>
      </div>
    </section>
  )
}
