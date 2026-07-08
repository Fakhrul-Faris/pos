'use client'

import { useEffect } from 'react'
import type { PaymentMethod } from '../data/mock'
import { ReceiptTicket } from './ReceiptTicket'

type ReceiptSuccessProps = {
  open: boolean
  customer: string
  total: number
  method: PaymentMethod
  receiptUrl: string
  receiptRef: string
  paidAt: Date
  onNewWalkIn: () => void
  onDone: () => void
}

export function ReceiptSuccessDrawer({
  open,
  customer,
  total,
  method,
  receiptUrl,
  receiptRef,
  paidAt,
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-carbon/30" onClick={onDone} />

      <div className="pos-receipt-slide relative flex w-full max-w-sm flex-col gap-4">
        <div className="mx-auto mb-1 h-3 w-40 rounded-full bg-carbon shadow-inner" aria-hidden />
        <ReceiptTicket
          receiptRef={receiptRef}
          amount={total}
          date={paidAt}
          customer={customer}
          method={method}
          receiptUrl={receiptUrl}
        />

        <div className="relative z-[72] flex flex-col gap-2 rounded-2xl border border-fog bg-paper-white p-3 shadow-panel">
          <button type="button" onClick={onNewWalkIn} className="btn-primary min-h-12 w-full px-4 py-3">
            New walk-in
          </button>
          <button
            type="button"
            onClick={onDone}
            className="min-h-12 w-full rounded-full border border-fog bg-mist px-4 py-3 text-sm font-medium tracking-ui text-carbon transition-colors hover:bg-fog"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
