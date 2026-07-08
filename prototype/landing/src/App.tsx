import { PromoBanner } from './components/PromoBanner'
import { Hero } from './components/Hero'
import { TrustStrip } from './components/TrustStrip'
import { ProblemSection } from './components/ProblemSection'
import { FeaturesSection } from './components/FeaturesSection'
import { ThreeSurfaces } from './components/ThreeSurfaces'
import { WhyNotPos } from './components/WhyNotPos'
import { Payments } from './components/Payments'
import { Outcomes } from './components/Outcomes'
import { FAQ } from './components/FAQ'
import { Footer, WaitlistStub } from './components/Footer'

export default function App() {
  return (
    <div id="theme-switch-scroller">
      <PromoBanner />
      <div className="group/page-layout-container">
        <main>
          <Hero />
          <TrustStrip />
          <ProblemSection />
          <FeaturesSection />
          <ThreeSurfaces />
          <WhyNotPos />
          <Payments />
          <Outcomes />
          <FAQ />
          <WaitlistStub />
        </main>
        <Footer />
      </div>
    </div>
  )
}
