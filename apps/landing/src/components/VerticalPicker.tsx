import { SectionLabel, ItalicHeadline } from './ui'
import { Reveal } from './Reveal'
import { VerticalAccordion } from './VerticalAccordion'

export function VerticalPicker() {
  return (
    <section id="verticals" className="py-[var(--section-gap)]">
      <div className="container-page">
        <SectionLabel>Your business</SectionLabel>
        <ItalicHeadline before="Built for" italic="your" after=" workflow." />
        <Reveal delay={0.25} y={20}>
          <p className="text-subheading text-muted mt-4 mb-12 max-w-2xl">
            One platform, tailored to how your specific shop runs.
          </p>
        </Reveal>

        <VerticalAccordion />
      </div>
    </section>
  )
}
