import { Ticker } from './Ticker'

const trustItems = [
  'Trusted by shop owners across Malaysia',
  'BYOD',
  'Self-serve setup',
]

export function TrustStrip() {
  return (
    <div className="o-trust-strip">
      <div className="container-page">
        <Ticker items={trustItems} aria-label="Trust indicators" />
      </div>
    </div>
  )
}
