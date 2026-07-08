'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PaymentMethod } from '../data/mock'
import { useStore } from '../data/store'
import { QrCode } from './QrCode'

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
  const [timedOut, setTimedOut] = useState(false)
  const [morphing, setMorphing] = useState<string | null>(null)
  const timersRef = useRef<number[]>([])

  const subtotal = useMemo(() => lineItems.reduce((s, li) => s + li.amount, 0), [lineItems])
  const isHitPay = selectedMethod === 'hitpay' || selectedMethod === 'hitpay-card'
  const fee = isHitPay ? Math.round(subtotal * 0.02 * 100) / 100 : 0
  const total = subtotal + fee
  const isParty = booking?.isParty && (booking.partyMembers?.length ?? 0) > 0

  const payUrl = useMemo(() => {
    if (!booking) return ''
    return `https://miki.app/pay/${booking.id}?amount=${total.toFixed(2)}`
  }, [booking, total])

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t))
    timersRef.current = []
  }

  useEffect(() => {
    setSelectedMethod(null)
    setWaiting(false)
    setTimedOut(false)
    setMorphing(null)
    clearTimers()
    return clearTimers
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

  function complete(method: PaymentMethod) {
    const result = completeWithPayment(booking!.id, method)
    if (result) {
      onPaid({
        ...result,
        total: method === 'hitpay' || method === 'hitpay-card'
          ? subtotal + Math.round(subtotal * 0.02 * 100) / 100
          : subtotal,
        method,
      })
    }
  }

  function startHitPayWait(method: PaymentMethod) {
    clearTimers()
    setSelectedMethod(method)
    setWaiting(true)
    setTimedOut(false)

    timersRef.current.push(
      window.setTimeout(() => {
        complete(method)
      }, 4000),
    )

    timersRef.current.push(
      window.setTimeout(() => {
        setTimedOut(true)
      }, 12000),
    )
  }

  function handlePay(method: PaymentMethod) {
    setMorphing(method)
    window.setTimeout(() => setMorphing(null), 450)

    if (method === 'hitpay' || method === 'hitpay-card') {
      startHitPayWait(method)
      return
    }
    complete(method)
  }

  function retryHitPay() {
    if (!selectedMethod) return
    startHitPayWait(selectedMethod)
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
          <p className="text-xs font-medium tracking-ui text-ash">
            {isParty ? 'Party payment' : 'Payment'}
          </p>
          <h2 className="font-display mt-1 text-lg font-medium tracking-ui text-carbon">
            {booking.customer}
          </h2>
          {booking.queueNumber && <p className="mt-1 text-sm text-ash">#{booking.queueNumber}</p>}
          {isParty && (
            <p className="mt-1 text-xs text-lavender">
              {lineItems.length} guest{lineItems.length === 1 ? '' : 's'} · arrived members only
            </p>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!waiting && (
            <>
              <div className={`space-y-2 ${isParty ? 'rounded-2xl border border-lavender/20 bg-mist/40 p-3' : ''}`}>
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
                <div className="flex justify-between font-medium text-carbon">
                  <span>Total</span>
                  <span className="font-display tabular-nums text-xl tracking-ui">
                    RM {subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handlePay(m.id)}
                    className={`min-h-12 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-300 ${
                      morphing === m.id ? 'scale-[0.98] bg-lavender text-paper-white border-lavender' : ''
                    } ${
                      m.highlight
                        ? 'border-lavender bg-mist text-carbon hover:bg-lavender/10'
                        : 'border-fog bg-paper-white text-carbon hover:border-lavender'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {waiting && selectedMethod && !timedOut && (
            <div className="mt-2 rounded-2xl border border-lavender/30 bg-linen p-6 text-center">
              {selectedMethod === 'hitpay' ? (
                <>
                  <QrCode value={payUrl} size={180} label="HitPay payment QR" />
                  <p className="mt-4 text-sm font-medium text-carbon">Waiting for payment…</p>
                  <p className="mt-1 text-xs text-graphite">
                    Customer scans to pay{' '}
                    <span className="font-medium tabular-nums text-carbon">RM {total.toFixed(2)}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-ash">
                    Includes RM {fee.toFixed(2)} service fee (2%)
                  </p>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-28 w-44 flex-col items-center justify-center rounded-2xl border border-fog bg-paper-white shadow-subtle">
                    <div className="flex h-12 w-16 items-center justify-center rounded-lg border-2 border-carbon/20 bg-mist">
                      <span className="text-[10px] font-medium uppercase tracking-ui text-ash">Tap</span>
                    </div>
                    <p className="mt-2 text-[10px] text-ash">HitPay terminal</p>
                  </div>
                  <p className="text-sm font-medium text-carbon">Hold card near terminal…</p>
                  <p className="mt-1 text-xs text-graphite">
                    Charging{' '}
                    <span className="font-medium tabular-nums text-carbon">RM {total.toFixed(2)}</span>
                  </p>
                </>
              )}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ash">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-lavender border-t-transparent" />
                Listening for confirmation
              </div>
              <button
                type="button"
                onClick={() => {
                  clearTimers()
                  setTimedOut(true)
                }}
                className="mt-4 text-xs text-lavender hover:underline"
              >
                Payment issue?
              </button>
            </div>
          )}

          {waiting && timedOut && (
            <div className="mt-2 rounded-2xl border border-ember/30 bg-[#fff4e0] p-6 text-center">
              <p className="text-sm font-medium text-carbon">Payment timed out</p>
              <p className="mt-1 text-xs text-graphite">
                No confirmation received. Customer can retry QR or pay another way.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button type="button" onClick={retryHitPay} className="btn-primary min-h-12 w-full px-4 py-3">
                  Retry HitPay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearTimers()
                    setWaiting(false)
                    setTimedOut(false)
                    setSelectedMethod(null)
                  }}
                  className="btn-ghost min-h-12 w-full px-4 py-3"
                >
                  Choose another method
                </button>
                <button type="button" onClick={() => complete('cash')} className="min-h-12 text-sm text-graphite hover:text-carbon">
                  Record cash instead
                </button>
              </div>
            </div>
          )}
        </div>

        {!waiting && (
          <footer className="border-t border-fog px-5 py-4">
            <button type="button" onClick={onClose} className="btn-ghost min-h-12 w-full px-4 py-3">
              Cancel
            </button>
          </footer>
        )}
      </aside>
    </div>
  )
}
