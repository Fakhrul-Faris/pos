'use client'

import { Btn } from '../Btn'
import { RevealGroup, RevealItem } from '../Reveal'
import { Ticker } from '../Ticker'
import { ExpandableScreenTrigger } from '../ui/expandable-screen'
import { trustBarItems, ctaLabel } from './data'
import { SectionHeadline } from './SectionHeadline'

export function BarbershopHero() {
  return (
    <section className="barbershop-hero" aria-label="Barbershop hero" data-nav-bg="dark">
      <div className="barbershop-hero__bg" aria-hidden />
      <div className="barbershop-hero__content">
        <div className="container-page barbershop-contain--hero text-center">
          <RevealGroup className="flex flex-col items-center" stagger={0.12} delay={0.15}>
            <RevealItem y={18}>
              <span className="barbershop-hero__pill">Barbershop</span>
            </RevealItem>
            <RevealItem>
              <h1 className="m-0 mb-4">
                <SectionHeadline
                  as="span"
                  tone="inverse"
                  segments={[{ text: 'No more empty chairs.' }]}
                />
              </h1>
            </RevealItem>
            <RevealItem>
              <p className="text-body-lg text-ivory/90 m-0 mb-10 leading-[1.45]">
                Manage your shop from one app with no extra hardware
              </p>
            </RevealItem>
            <RevealItem y={20}>
              <div className="flex flex-col items-center gap-4">
                <ExpandableScreenTrigger>
                  <Btn variant="hero">{ctaLabel}</Btn>
                </ExpandableScreenTrigger>
                <p className="text-caption text-ash-text m-0 tracking-[0.01em]">
                  14-day free trial • No card required • No contract
                </p>
              </div>
            </RevealItem>
            <RevealItem y={12} className="w-full">
              <div className="barbershop-hero__trust">
                <Ticker
                  items={[...trustBarItems, ...trustBarItems]}
                  aria-label="Trust indicators"
                />
              </div>
            </RevealItem>
          </RevealGroup>
        </div>
      </div>
    </section>
  )
}
