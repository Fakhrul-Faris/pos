import { useEffect, useMemo, useState } from 'react'
import type { PaymentMethod } from '../data/mock'
import { useStore } from '../data/store'

type PaymentDrawerProps = {
  bookingId: string | null
  onClose: () => void
  onPaid: (result: { txnId: string; receiptUrl: string; total: number; method: PaymentMethod }) => void
}

const methods: { id: PaymentMethod; label: string; highlight?: boolean }[] = [
  { id: 'hitpay', label: 'HitPay QR', highlight: true },
  { id: 'hitpay-card', label: 'HitPay card', highlight: true },
  { id: 'cash', label: 'Cash' },
  { id: 'duitnow', label: 'Own DuitNow' },
]

export function PaymentDrawer({ bookingId, onClose, onPaid }: PaymentDrawerProps) {
  const { getBookingById, getPaymentLineItems, completeWithPayment } = useStore()
  const booking = bookingId ? getBookingById(bookingId) : null
  const lineItems = bookingId ? getPaymentLineItems(bookingId) : []
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [waiting, setWaiting] = useState(false)

  const subtotal = useMemo(() => lineItems.reduce((s, li) => s + li.amount, 0), [lineItems])
  const isHitPay = selectedMethod === 'hitpay' || selectedMethod === 'hitpay-card'
  const fee = isHitPay ? Math.round(subtotal * 0.02 * 100) / 100 : 0
  const total = subtotal + fee

  useEffect(() => {
    setSelectedMethod(null)
    setWaiting(false)
  }, [bookingId])

  useEffect(() => {
    if (!bookingId) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !waiting) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [bookingId, onClose, waiting])

  if (!booking) return null

  function handlePay(method: PaymentMethod) {
    if (method === 'hitpay' || method === 'hitpay-card') {
      setSelectedMethod(method)
      setWaiting(true)
      window.setTimeout(() => {
        const result = completeWithPayment(booking!.id, method)
        if (result) {
          onPaid({
            ...result,
            total: subtotal + Math.round(subtotal * 0.02 * 100) / 100,
            method,
          })
        }
      }, 1500)
      return
    }
    const result = completeWithPayment(booking!.id, method)
    if (result) onPaid({ ...result, total: subtotal, method })
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        aria-label="Close payment"
        className="absolute inset-0 bg-carbon/25"
        onClick={() => !waiting && onClose()}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-fog bg-paper-white shadow-panel">
        <header className="border-b border-fog px-5 py-4">
          <p className="text-xs font-medium tracking-ui text-ash">Payment</p>
          <h2 className="font-display mt-1 text-lg font-medium tracking-ui text-carbon">
            {booking.customer}
          </h2>
          {booking.queueNumber && (
            <p className="mt-1 text-sm text-ash">#{booking.queueNumber}</p>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-2">
            {lineItems.map((li) => (
              <div key={li.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-carbon">{li.label}</p>
                  {li.sublabel && <p className="text-xs text-ash">{li.sublabel}</p>}
                </div>
                <p className="tabular-nums text-carbon">RM {li.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1 border-t border-fog pt-4 text-sm">
            <div className="flex justify-between text-graphite">
              <span>Subtotal</span>
              <span className="tabular-nums">RM {subtotal.toFixed(2)}</span>
            </div>
            {isHitPay && (
              <div className="flex justify-between text-graphite">
                <span>Service fee (2%)</span>
                <span className="tabular-nums">RM {fee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-carbon">
              <span>{isHitPay ? 'Customer pays' : 'Total'}</span>
              <span className="font-display tabular-nums text-xl tracking-ui">
                RM {(selectedMethod ? total : subtotal).toFixed(2)}
              </span>
            </div>
          </div>

          {waiting && selectedMethod && (
            <div className="mt-6 rounded-2xl border border-lavender/30 bg-mist p-6 text-center">
              {selectedMethod === 'hitpay' ? (
                <>
                  <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-lavender bg-paper-white text-xs text-ash">
                    QR code
                  </div>
                  <p className="text-sm font-medium text-carbon">Waiting for payment…</p>
                </>
              ) : (
                <p className="text-sm font-medium text-carbon">
                  Hold card near terminal…
                </p>
              )}
              <div className="mt-3 flex justify-center">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-lavender border-t-transparent" />
              </div>
            </div>
          )}

          {!waiting && (
            <div className="mt-6 grid grid-cols-2 gap-2">
              {methods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handlePay(m.id)}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    m.highlight
                      ? 'border-lavender bg-mist text-carbon hover:bg-lavender/10'
                      : 'border-fog bg-paper-white text-carbon hover:border-lavender'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {!waiting && (
          <footer className="border-t border-fog px-5 py-4">
            <button type="button" onClick={onClose} className="btn-ghost w-full px-4 py-2">
              Cancel
            </button>
          </footer>
        )}
      </aside>
    </div>
  )
}
