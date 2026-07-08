import { PromoBanner } from './components/PromoBanner'
import { Hero } from './components/Hero'
import { TrustStrip } from './components/TrustStrip'
import { ProblemSection } from './components/ProblemSection'
import { ThreeSurfaces } from './components/ThreeSurfaces'
import { Payments } from './components/Payments'
import { VerticalPicker } from './components/VerticalPicker'
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
          <ThreeSurfaces />
          <Payments />
          <VerticalPicker />
          <FAQ />
          <WaitlistStub />
        </main>
        <Footer />
      </div>
    </div>
  )
}
