import { Ticker } from './Ticker'
import { Reveal } from './Reveal'

const trustItems = [
  'Trusted by shop owners across Malaysia',
  'BYOD',
  'Self-serve setup',
]

export function TrustStrip() {
  return (
    <div className="o-trust-strip">
      <Reveal y={16} blur={false} duration={0.7} className="container-page">
        <Ticker items={trustItems} aria-label="Trust indicators" />
      </Reveal>
    </div>
  )
}
