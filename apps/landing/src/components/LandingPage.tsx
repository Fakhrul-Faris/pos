'use client'

import { Hero } from './Hero'
import { TrustStrip } from './TrustStrip'
import { ProblemSection } from './ProblemSection'
import { ThreeSurfaces } from './ThreeSurfaces'
import { WhyChooseMiki } from './WhyChooseMiki'
import { VerticalPicker } from './VerticalPicker'
import { FAQ } from './FAQ'
import { Footer, WaitlistStub } from './Footer'
import { ExpandableScreen } from './ui/expandable-screen'
import { SignupScreenContent } from './SignupScreen'

export function LandingPage() {
  return (
    <ExpandableScreen layoutId="signup-cta" triggerRadius="32px" contentRadius="0px">
      <div id="theme-switch-scroller">
        <div className="group/page-layout-container">
          <main>
            <Hero />
            <TrustStrip />
            <ProblemSection />
            <ThreeSurfaces />
            <WhyChooseMiki />
            <VerticalPicker />
            <FAQ />
            <WaitlistStub />
          </main>
          <Footer />
        </div>
      </div>
      <SignupScreenContent />
    </ExpandableScreen>
  )
}
