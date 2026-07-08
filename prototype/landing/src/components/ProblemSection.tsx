import { ItalicHeadline } from './ui'
import { ComparisonCards } from './ComparisonCards'

export function ProblemSection() {
  return (
    <section id="compare" className="py-[var(--section-gap)] border-b border-black/5">
      <div className="container-page max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <ItalicHeadline before="" italic="One screen" after=" for the whole counter." />
          <p className="text-subheading text-muted m-0 mt-4">
            Stop juggling booking apps, paper queues, and separate payment
            terminals. Miki brings them together so you can focus on the work,
            not the counter.
          </p>
        </div>

        <ComparisonCards />
      </div>
    </section>
  )
}
