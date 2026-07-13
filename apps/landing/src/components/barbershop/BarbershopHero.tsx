'use client'

import { Btn } from '../Btn'
import { RevealGroup, RevealHeadline, RevealItem } from '../Reveal'
import { Ticker } from '../Ticker'
import { ExpandableScreenTrigger } from '../ui/expandable-screen'
import { trustBarItems } from './data'

export function BarbershopHero() {
  return (
    <section className="barbershop-hero" aria-label="Barbershop hero" data-nav-bg="dark">
      <div className="barbershop-hero__bg" aria-hidden />
      <div className="barbershop-hero__content">
        <div className="container-page max-w-3xl text-center">
          <RevealGroup className="flex flex-col items-center" stagger={0.12} delay={0.15}>
            <RevealItem y={18}>
              <span className="barbershop-hero__pill">Barbershop</span>
            </RevealItem>
            <RevealItem>
              <h1 className="text-heading-lg text-pure-white m-0 mb-4">
                <RevealHeadline as="span" segments={[{ text: 'No more empty chairs.' }]} />
              </h1>
            </RevealItem>
            <RevealItem>
              <p className="text-body-lg text-ivory/90 m-0 mb-10 max-w-[560px] leading-[1.45]">
                Manage your shop from one app with no extra hardware
              </p>
            </RevealItem>
            <RevealItem y={20}>
              <div className="flex flex-col items-center gap-4">
                <ExpandableScreenTrigger>
                  <Btn variant="hero">Start Free</Btn>
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
