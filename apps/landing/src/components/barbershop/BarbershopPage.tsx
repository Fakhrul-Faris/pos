'use client'

import { ExpandableScreen } from '../ui/expandable-screen'
import { SignupScreenContent } from '../SignupScreen'
import { PromoBanner } from './PromoBanner'
import { BarbershopNav } from './BarbershopNav'
import { BarbershopHero } from './BarbershopHero'
import { BarbershopProblem } from './BarbershopProblem'
import { BarbershopThreeScreens } from './BarbershopThreeScreens'
import { BarbershopByod } from './BarbershopByod'
import { BarbershopSetup } from './BarbershopSetup'
import { BarbershopWhyWorks } from './BarbershopWhyWorks'
import { BarbershopTestimonials } from './BarbershopTestimonials'
import { BarbershopPricing } from './BarbershopPricing'
import { BarbershopFaq } from './BarbershopFaq'
import { BarbershopClosingCta, BarbershopFooter } from './BarbershopFooter'

export function BarbershopPage() {
  return (
    <ExpandableScreen
      layoutId="barbershop-signup-cta"
      triggerRadius="32px"
      contentRadius="0px"
    >
      <div className="barbershop-page group/page-layout-container">
        <PromoBanner />
        <BarbershopNav />
        <div className="barbershop-stack">
          <div className="barbershop-hero-layer">
            <BarbershopHero />
          </div>
          <div className="barbershop-stack-content" data-nav-bg="light">
            <main>
              <BarbershopProblem />
              <BarbershopThreeScreens />
              <BarbershopByod />
              <BarbershopSetup />
              <BarbershopWhyWorks />
              <BarbershopTestimonials />
              <BarbershopPricing />
              <BarbershopFaq />
              <BarbershopClosingCta />
            </main>
            <BarbershopFooter />
          </div>
        </div>
      </div>
      <SignupScreenContent />
    </ExpandableScreen>
  )
}
