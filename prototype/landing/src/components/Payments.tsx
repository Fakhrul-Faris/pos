import { ItalicHeadline } from './ui'

const rows = [
  {
    method: 'Cash',
    merchant: 'RM0 platform fee',
    customer: 'Exact total',
  },
  {
    method: 'Your own DuitNow QR',
    merchant: 'RM0 platform fee',
    customer: 'Exact total',
  },
  {
    method: 'Integrated QR & card',
    merchant: 'RM0 merchant fee',
    customer: 'Subtotal + 2% service fee',
    note: 'Growth plan',
  },
]

export function Payments() {
  return (
    <section id="payments" className="py-[var(--section-gap)] bg-linen/50">
      <div className="container-page">
        <ItalicHeadline
          before="Pay how you"
          italic="already"
          after=" pay."
        />
        <p className="text-body text-muted mt-4 mb-10 max-w-xl">
          We never block checkout on cash or your own QR.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[520px]">
            <thead>
              <tr className="text-left text-caption text-muted tracking-[0.03em]">
                <th className="pb-4 font-medium">Method</th>
                <th className="pb-4 font-medium">Merchant fee</th>
                <th className="pb-4 font-medium">Customer pays</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.method} className="border-t border-black/5">
                  <td className="py-5 text-body font-medium text-ink">
                    {row.method}
                    {row.note && (
                      <span className="block text-caption text-muted font-normal mt-1">
                        {row.note}
                      </span>
                    )}
                  </td>
                  <td className="py-5 text-body text-ink">{row.merchant}</td>
                  <td className="py-5 text-body text-muted">{row.customer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
