'use client'

import { ItalicHeadline } from '../ui'
import { RevealGroup, RevealItem } from '../Reveal'
import { howItWorksIntro, howItWorksSteps } from './data'

export function BarbershopSetup() {
  return (
    <section id="how-it-works" className="barbershop-how">
      <div className="container-page max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <ItalicHeadline
            before={howItWorksIntro.titleBefore}
            italic={howItWorksIntro.titleItalic}
          />
        </div>

        <RevealGroup className="barbershop-how__bento" stagger={0.08} delay={0.1}>
          {howItWorksSteps.map((step) => (
            <RevealItem
              key={step.id}
              className={[
                'barbershop-how__cell',
                `barbershop-how__cell--${step.span}`,
                `barbershop-how__cell--${step.tone}`,
              ].join(' ')}
            >
              <article className="barbershop-how__card">
                <span className="barbershop-how__step">{step.step}</span>
                <div className="barbershop-how__copy">
                  <h3 className="barbershop-how__title">{step.title}</h3>
                  <p className="barbershop-how__body">{step.body}</p>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
