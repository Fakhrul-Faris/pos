'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { BarberSwitcher } from '@/components/BarberSwitcher'
import { MotionPresenceShell } from '@/components/motion/MotionOverlay'
import { QrCode } from '@/components/QrCode'
import { type PaymentMethod } from '@/data/mock'
import { useStore } from '@/data/store'
import { resolveBarberThemeKey } from '@/lib/barberTheme'
import { fade } from '@/lib/motion'

type CashierMethod = 'cash' | 'qr' | 'card'

type CashierScreenProps = {
  bookingId: string | null
  onClose: () => void
  onPaid: (result: { txnId: string; receiptUrl: string; total: number; method: PaymentMethod }) => void
  onPickBooking?: (id: string) => void
  onAddItem?: (bookingId: string) => void
}

function formatRm(n: number) {
  return `RM ${n.toFixed(2)}`
}

function toPaymentMethod(method: CashierMethod): PaymentMethod {
  if (method === 'qr') return 'hitpay'
  if (method === 'card') return 'hitpay-card'
  return 'cash'
}

function CashierBarberRail() {
  return (
    <div className="pointer-events-none fixed left-1/2 top-3 z-[80] -translate-x-1/2">
      <div className="pointer-events-auto">
        <BarberSwitcher compact />
      </div>
    </div>
  )
}

export function CashierScreen({
  bookingId,
  onClose,
  onPaid,
  onPickBooking,
  onAddItem,
}: CashierScreenProps) {
  const {
    getBookingById,
    getPaymentLineItems,
    completeWithPayment,
    staff,
    bookings,
    actingStaffId,
  } = useStore()

  const booking = bookingId ? getBookingById(bookingId) : null
  const lineItems = bookingId ? getPaymentLineItems(bookingId) : []
  const subtotal = useMemo(() => lineItems.reduce((s, li) => s + li.amount, 0), [lineItems])

  const [tenderRaw, setTenderRaw] = useState('')
  const [method, setMethod] = useState<CashierMethod>('cash')
  const [face, setFace] = useState<'staff' | 'customer'>('staff')
  const [waiting, setWaiting] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const timersRef = useRef<number[]>([])

  const digital = method === 'qr' || method === 'card'
  const fee = digital ? Math.round(subtotal * 0.02 * 100) / 100 : 0
  const totalDue = subtotal + fee

  const readyBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status === 'in-service' ||
          (b.isParty && b.partyPhase === 'ready-pay'),
      ),
    [bookings],
  )

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t))
    timersRef.current = []
  }

  useEffect(() => {
    setTenderRaw('')
    setMethod('cash')
    setFace('staff')
    setWaiting(false)
    setTimedOut(false)
    clearTimers()
    return clearTimers
  }, [bookingId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (face === 'customer') {
        clearTimers()
        setFace('staff')
        setWaiting(false)
        setTimedOut(false)
        return
      }
      onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [face, onClose])

  const barber = booking
    ? staff.find((s) => s.id === booking.staffId)
    : staff.find((s) => s.id === actingStaffId)
  const themeKey = resolveBarberThemeKey(actingStaffId)

  const tendered = tenderRaw === '' ? totalDue : Number(tenderRaw) / 100
  const change = Math.max(0, Math.round((tendered - totalDue) * 100) / 100)
  const shortfall = method === 'cash' && tendered < totalDue - 0.001

  const payUrl = useMemo(() => {
    if (!booking) return ''
    return `https://miki.app/pay/${booking.id}?amount=${totalDue.toFixed(2)}`
  }, [booking, totalDue])

  function appendDigit(d: string) {
    setTenderRaw((prev) => {
      if (prev.length >= 8) return prev
      if (prev === '' && d === '0') return '0'
      if (prev === '0') return d
      return prev + d
    })
  }

  function backspace() {
    setTenderRaw((prev) => prev.slice(0, -1))
  }

  function clearAmount() {
    setTenderRaw('')
  }

  function finish(payMethod: PaymentMethod) {
    if (!booking) return
    const result = completeWithPayment(booking.id, payMethod)
    if (result) {
      clearTimers()
      onPaid({
        ...result,
        total:
          payMethod === 'hitpay' || payMethod === 'hitpay-card'
            ? subtotal + Math.round(subtotal * 0.02 * 100) / 100
            : subtotal,
        method: payMethod,
      })
    }
  }

  function startCustomerHandoff(kind: 'qr' | 'card') {
    clearTimers()
    setMethod(kind)
    setFace('customer')
    setWaiting(true)
    setTimedOut(false)
    const payMethod = toPaymentMethod(kind)

    timersRef.current.push(
      window.setTimeout(() => {
        finish(payMethod)
      }, 4500),
    )
    timersRef.current.push(
      window.setTimeout(() => {
        setTimedOut(true)
      }, 14000),
    )
  }

  function backToStaff() {
    clearTimers()
    setFace('staff')
    setWaiting(false)
    setTimedOut(false)
  }

  function handlePay() {
    if (!booking || shortfall) return
    if (method === 'qr' || method === 'card') {
      startCustomerHandoff(method)
      return
    }
    finish('cash')
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'] as const
  const displayAmount = method === 'cash' && tenderRaw !== '' ? tendered : totalDue
  const payLabel =
    method === 'qr'
      ? `Show QR · ${formatRm(totalDue)}`
      : method === 'card'
        ? `Ready to tap · ${formatRm(totalDue)}`
        : `Pay ${formatRm(totalDue)}`

  const reduce = useReducedMotion()
  const faceMotion = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.01 },
      }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: fade.soft,
      }

  const faceKey = !booking ? 'picker' : face === 'customer' ? 'customer' : 'staff'

  return (
    <MotionPresenceShell
      variant="fullscreen"
      zClass="z-[70]"
      closeOnBackdrop={false}
      panelClassName="pos-shell flex h-dvh w-full flex-col overflow-hidden"
      aria-label={face === 'customer' ? 'Customer payment' : 'Cashier'}
    >
      <div data-acting-barber={themeKey} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={faceKey}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            {...faceMotion}
          >
            {!booking ? (
              <>
                <CashierBarberRail />
                <header className="flex shrink-0 items-center justify-between px-5 pb-4 pt-14">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-ui text-ash">Cashier</p>
                    <h1 className="font-display text-xl font-medium tracking-ui text-carbon">
                      Select a ticket
                    </h1>
                  </div>
                  <button type="button" onClick={onClose} className="btn-ghost min-h-12 px-4">
                    Close
                  </button>
                </header>
                <div className="flex-1 overflow-y-auto px-5 pb-8">
                  {readyBookings.length === 0 ? (
                    <div className="rounded-3xl border border-fog bg-paper-white/90 p-8 text-center shadow-panel">
                      <p className="font-display text-lg text-carbon">Nothing ready to pay</p>
                      <p className="mt-2 text-sm text-graphite">
                        Complete a cut first, then open Cashier.
                      </p>
                    </div>
                  ) : (
                    <div className="mx-auto grid max-w-2xl gap-3">
                      {readyBookings.map((b) => {
                        const s = staff.find((x) => x.id === b.staffId)
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => onPickBooking?.(b.id)}
                            className="flex min-h-16 items-center justify-between rounded-2xl border border-fog bg-paper-white px-5 py-4 text-left shadow-sm transition-shadow hover:shadow-panel"
                          >
                            <div>
                              <p className="font-display text-lg font-medium text-carbon">
                                {b.queueNumber ? `#${b.queueNumber}` : '—'} · {b.customer}
                              </p>
                              <p className="text-sm text-ash">
                                {b.services} · {s?.name ?? '—'}
                              </p>
                            </div>
                            <p className="font-display text-lg font-medium tabular-nums text-carbon">
                              {formatRm(b.amount)}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : face === 'customer' ? (
              <>
                <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 px-6 py-8">
                  <div className="w-full text-center">
                    <p className="text-[10px] font-medium uppercase tracking-ui text-ash">Your bill</p>
                    <p className="font-display mt-1 text-lg font-medium text-carbon">{booking.customer}</p>
                    <p className="font-display mt-3 text-5xl font-semibold tabular-nums tracking-ui text-carbon sm:text-6xl">
                      {formatRm(totalDue)}
                    </p>
                    {fee > 0 && (
                      <p className="mt-2 text-xs text-ash">
                        Includes {formatRm(fee)} processing fee (2%)
                      </p>
                    )}
                  </div>

                  <ul className="w-full max-w-sm space-y-2 rounded-2xl border border-white/60 bg-paper-white/90 px-4 py-3 text-sm shadow-sm">
                    {lineItems.map((li, i) => (
                      <li key={`${li.id}-${i}`} className="flex justify-between gap-3">
                        <span className="truncate text-carbon">{li.label}</span>
                        <span className="shrink-0 tabular-nums text-graphite">
                          {formatRm(li.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {!timedOut ? (
                    method === 'card' ? (
                      <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-white/60 bg-paper-white p-8 shadow-panel">
                        <div className="relative flex h-36 w-36 items-center justify-center">
                          <span className="absolute inset-0 animate-ping rounded-full bg-barber-muted opacity-60" />
                          <span className="absolute inset-3 rounded-full border-2 border-dashed border-barber/50" />
                          <div className="relative flex h-20 w-28 flex-col items-center justify-center rounded-xl border-2 border-carbon/15 bg-mist">
                            <span className="text-[11px] font-semibold uppercase tracking-ui text-carbon">
                              Tap
                            </span>
                            <span className="mt-0.5 text-[10px] text-ash">Card · Wallet</span>
                          </div>
                        </div>
                        <p className="mt-6 text-base font-medium text-carbon">Hold card or phone here</p>
                        <p className="mt-1 text-sm text-graphite">Contactless · Apple Pay · Google Pay</p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-ash">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-barber border-t-transparent" />
                          Waiting for tap…
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center rounded-3xl border border-white/60 bg-paper-white p-6 shadow-panel">
                        <QrCode value={payUrl} size={220} label="Payment QR" />
                        <p className="mt-5 text-base font-medium text-carbon">Scan to pay</p>
                        <div className="mt-3 flex items-center gap-2 text-xs text-ash">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-barber border-t-transparent" />
                          Waiting for payment…
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="w-full max-w-sm rounded-3xl border border-ember/30 bg-paper-white p-6 text-center shadow-panel">
                      <p className="text-base font-medium text-carbon">Still waiting?</p>
                      <p className="mt-1 text-sm text-graphite">
                        No confirmation yet. Retry or switch method.
                      </p>
                      <div className="mt-5 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => startCustomerHandoff(method === 'card' ? 'card' : 'qr')}
                          className="btn-primary min-h-12 w-full px-4 py-3"
                        >
                          {method === 'card' ? 'Retry tap' : 'Retry QR'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            backToStaff()
                            setMethod('cash')
                          }}
                          className="btn-ghost min-h-12 w-full px-4 py-3"
                        >
                          Pay with cash
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="shrink-0 px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <button
                    type="button"
                    onClick={backToStaff}
                    className="mx-auto block text-xs font-medium text-graphite underline-offset-2 hover:text-carbon hover:underline"
                  >
                    Back to staff
                  </button>
                </div>
              </>
            ) : (
              <>
                <CashierBarberRail />
                <header className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-14">
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-ui text-ash">Cashier</p>
                    <p className="truncate text-sm font-medium text-carbon">
                      {barber?.name ?? 'Barber'}
                      {booking.queueNumber ? ` · #${booking.queueNumber}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-11 rounded-full px-4 text-sm font-medium text-graphite hover:bg-paper-white/50"
                  >
                    Close
                  </button>
                </header>

                <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-4 px-4 pb-5 lg:flex-row lg:gap-6 lg:px-6">
                  <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/60 bg-paper-white shadow-panel lg:max-w-[46%]">
                    <div className="shrink-0 border-b border-fog px-5 py-4">
                      <p className="font-display text-xl font-medium tracking-ui text-carbon">
                        {booking.queueNumber ? `#${booking.queueNumber}` : 'Ticket'}{' '}
                        <span className="text-graphite">·</span> {booking.customer}
                      </p>
                      <p className="mt-1 text-sm text-ash">
                        {barber?.name ?? 'Barber'}
                        {booking.isParty ? ` · Party of ${booking.partySize}` : ''}
                      </p>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col">
                      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                        <p className="mb-3 text-[10px] font-medium uppercase tracking-ui text-ash">
                          Bill
                        </p>
                        <ul className="space-y-3">
                          {lineItems.map((li, i) => (
                            <li
                              key={`${li.id}-${i}`}
                              className="flex items-start justify-between gap-3 text-sm"
                            >
                              <span className="text-carbon">
                                {li.label}
                                {(booking.isParty || li.sublabel === 'Product') && li.sublabel ? (
                                  <span className="mt-0.5 block text-xs text-ash">{li.sublabel}</span>
                                ) : null}
                              </span>
                              <span className="shrink-0 tabular-nums text-graphite">
                                {formatRm(li.amount)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {!booking.isParty && (
                        <div className="shrink-0 px-5 pb-3">
                          <button
                            type="button"
                            onClick={() => onAddItem?.(booking.id)}
                            className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-barber bg-barber-muted text-sm font-semibold text-barber transition-colors hover:bg-barber-soft"
                          >
                            <span className="text-lg leading-none" aria-hidden>
                              +
                            </span>
                            Add service or product
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 border-t border-fog px-5 py-4">
                      <div className="flex justify-between text-sm text-graphite">
                        <span>Subtotal</span>
                        <span className="tabular-nums">{formatRm(subtotal)}</span>
                      </div>
                      <div className="mt-1.5 flex justify-between text-sm text-ash">
                        <span>Tax (SST)</span>
                        <span className="tabular-nums">{formatRm(0)}</span>
                      </div>
                      {fee > 0 && (
                        <div className="mt-1.5 flex justify-between text-sm text-ash">
                          <span>Processing fee (2%)</span>
                          <span className="tabular-nums">{formatRm(fee)}</span>
                        </div>
                      )}
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-sm font-medium text-carbon">Total due</span>
                        <span className="font-display text-2xl font-semibold tabular-nums tracking-ui text-carbon">
                          {formatRm(totalDue)}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="flex min-h-0 flex-1 flex-col gap-4 lg:max-w-[54%]">
                    <div className="flex shrink-0 flex-wrap justify-center gap-2">
                      {(
                        [
                          { id: 'cash' as const, label: 'Cash' },
                          { id: 'qr' as const, label: 'QR' },
                          { id: 'card' as const, label: 'Card' },
                        ] as const
                      ).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setMethod(m.id)
                            if (m.id !== 'cash') setTenderRaw('')
                          }}
                          className={`min-h-11 min-w-11 rounded-full px-5 text-sm font-medium transition-colors ${
                            method === m.id
                              ? 'bg-carbon text-paper-white'
                              : 'border border-fog/80 bg-paper-white/70 text-graphite hover:bg-paper-white'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {method === 'cash' ? (
                      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5">
                        <div className="shrink-0 text-center">
                          <p className="text-[10px] font-medium uppercase tracking-ui text-ash">
                            {tenderRaw === '' ? 'Amount due' : 'Tendered'}
                          </p>
                          <p className="font-display mt-1.5 text-4xl font-semibold tabular-nums tracking-ui text-carbon sm:text-5xl">
                            {formatRm(displayAmount)}
                          </p>
                          <p
                            className={`mt-2 min-h-5 text-sm font-medium ${
                              tenderRaw !== '' ? (shortfall ? 'text-ember' : 'text-mint') : 'invisible'
                            }`}
                            aria-live="polite"
                          >
                            {tenderRaw !== ''
                              ? shortfall
                                ? `Short ${formatRm(totalDue - tendered)}`
                                : `Change ${formatRm(change)}`
                              : '—'}
                          </p>
                        </div>

                        <div className="grid w-fit grid-cols-3 gap-x-3 gap-y-2.5">
                          {keys.map((k) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => {
                                if (k === 'C') clearAmount()
                                else if (k === '⌫') backspace()
                                else appendDigit(k)
                              }}
                              className={`flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border border-white/80 bg-paper-white text-[1.75rem] font-medium text-carbon shadow-sm transition-transform active:scale-95 sm:h-[4.5rem] sm:w-[4.5rem] ${
                                k === 'C' || k === '⌫' ? 'text-lg text-graphite' : ''
                              }`}
                            >
                              {k}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-2">
                        <div className="w-full max-w-md rounded-3xl border border-white/60 bg-paper-white/90 px-6 py-8 text-center shadow-panel sm:px-8 sm:py-10">
                          <p className="text-[10px] font-medium uppercase tracking-ui text-ash">
                            {method === 'qr' ? 'Customer scans' : 'Customer taps'}
                          </p>
                          <p className="font-display mt-2 text-4xl font-semibold tabular-nums tracking-ui text-carbon sm:text-5xl">
                            {formatRm(displayAmount)}
                          </p>
                          <p className="mt-3 text-sm font-medium text-ash">
                            {method === 'qr'
                              ? 'Turn tablet after Show QR'
                              : 'Turn tablet after Ready to tap'}
                          </p>
                          <div className="mx-auto mt-6 max-w-xs border-t border-fog pt-6">
                            <p className="text-sm leading-relaxed text-graphite">
                              {method === 'qr'
                                ? 'Guest scans the QR on the next screen. Keep the tablet facing them until it confirms.'
                                : 'Guest taps card, Apple Pay, or Google Pay on the next screen. Hold near the contactless zone.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex shrink-0 items-center gap-4 px-1">
                      <button
                        type="button"
                        onClick={onClose}
                        className="min-h-14 flex-1 text-base font-medium text-carbon/70 transition-colors hover:text-carbon"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={shortfall || waiting}
                        onClick={handlePay}
                        className="min-h-14 flex-[1.4] rounded-full bg-paper-white text-base font-semibold text-carbon shadow-panel transition-transform enabled:active:scale-[0.98] disabled:opacity-40"
                        style={{ boxShadow: '0 8px 28px var(--barber-soft)' }}
                      >
                        {payLabel}
                      </button>
                    </div>
                  </section>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionPresenceShell>
  )
}
