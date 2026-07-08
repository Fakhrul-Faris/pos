import { ItalicHeadline } from './ui'

export function ProblemSection() {
  return (
    <section className="py-16 border-b border-black/5">
      <div className="container-page text-center max-w-2xl mx-auto">
        <ItalicHeadline
          before="Three apps. Two phones."
          italic="One tired owner."
        />
        <p className="text-subheading text-muted m-0 mt-4">
          Miki puts the counter back on one screen.
        </p>
      </div>
    </section>
  )
}
