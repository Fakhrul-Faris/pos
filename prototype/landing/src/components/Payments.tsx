import { ItalicHeadline } from './ui'
import { PaymentsBento } from './PaymentsBento'

export function Payments() {
  return (
    <section id="payments" className="py-[var(--section-gap)] bg-linen/50">
      <div className="container-page">
        <ItalicHeadline
          before="Get paid."
          italic="Your way."
          className="w-full text-center"
        />
        <p className="text-body text-muted mt-4 mb-10 w-full text-center">
          Accept cash, cards, or QR codes. We never hold your checkout hostage.
        </p>

        <PaymentsBento />
      </div>
    </section>
  )
}
