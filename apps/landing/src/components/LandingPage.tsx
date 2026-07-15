'use client'

import { Hero } from './Hero'
import { LandingNav } from './LandingNav'
import { ThreeSurfaces } from './ThreeSurfaces'
import { WhyChooseMiki } from './WhyChooseMiki'
import { VerticalPicker } from './VerticalPicker'
import { ClosingCta } from './ClosingCta'
import { Footer } from './Footer'
import { ExpandableScreen } from './ui/expandable-screen'
import { SignupScreenContent } from './SignupScreen'

export function LandingPage() {
  return (
    <ExpandableScreen layoutId="signup-cta" triggerRadius="32px" contentRadius="28px">
      <div id="theme-switch-scroller">
        <div className="group/page-layout-container">
          <LandingNav />
          <main>
            <Hero />
            <div data-nav-bg="light">
              <ThreeSurfaces />
              <WhyChooseMiki />
              <VerticalPicker />
              <ClosingCta />
            </div>
          </main>
          <Footer />
        </div>
      </div>
      <SignupScreenContent />
    </ExpandableScreen>
  )
}
