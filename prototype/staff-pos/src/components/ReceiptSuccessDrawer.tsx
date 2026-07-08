import { useEffect } from 'react'
import type { PaymentMethod } from '../data/mock'

type ReceiptSuccessProps = {
  open: boolean
  customer: string
  total: number
  method: PaymentMethod
  receiptUrl: string
  onNewWalkIn: () => void
  onDone: () => void
}

const methodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  duitnow: 'DuitNow',
  hitpay: 'HitPay QR',
  'hitpay-card': 'HitPay card',
}

export function ReceiptSuccessDrawer({
  open,
  customer,
  total,
  method,
  receiptUrl,
  onNewWalkIn,
  onDone,
}: ReceiptSuccessProps) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onDone()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onDone])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-carbon/30" onClick={onDone} />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-fog bg-paper-white shadow-panel">
        <div className="bg-mint-wash px-6 py-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-mint text-2xl text-paper-white">
            ✓
          </div>
          <h2 className="font-display text-xl font-medium tracking-ui text-carbon">Paid</h2>
          <p className="mt-1 text-sm text-graphite">{customer}</p>
          <p className="font-display tabular-nums mt-3 text-3xl font-medium tracking-ui text-carbon">
            RM {total.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-ash">{methodLabels[method]}</p>
        </div>

        <div className="px-6 py-5">
          <p className="text-center text-xs text-ash">Customer receipt</p>
          <div className="mx-auto mt-3 flex h-36 w-36 items-center justify-center rounded-xl border-2 border-dashed border-fog bg-linen text-[10px] text-ash">
            QR · scan for digital receipt
          </div>
          <p className="mt-2 truncate text-center text-xs text-lavender">{receiptUrl}</p>

          <div className="mt-6 flex flex-col gap-2">
            <button type="button" onClick={onNewWalkIn} className="btn-primary w-full px-4 py-2">
              New walk-in
            </button>
            <button type="button" onClick={onDone} className="btn-ghost w-full px-4 py-2">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
