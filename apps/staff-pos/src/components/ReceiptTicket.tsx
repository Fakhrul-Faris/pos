'use client'

import { useEffect, useState, type SVGProps } from 'react'
import type { PaymentMethod } from '../data/mock'
import { QrCode } from './QrCode'

const methodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  duitnow: 'DuitNow',
  hitpay: 'HitPay QR',
  'hitpay-card': 'HitPay card',
}

function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function CashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 10h.01M18 14h.01" strokeLinecap="round" />
    </svg>
  )
}

function QrIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm10 0h2v2h-2v-2zm4 0h2v6h-2v-6zm-4 4h2v2h-2v-2zm4 2h2v2h-2v-2zm2-6h2v2h-2v-2z" />
    </svg>
  )
}

function CardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  )
}

function PaymentMethodIcon({ method }: { method: PaymentMethod }) {
  const className = 'h-9 w-9 shrink-0 text-carbon'
  if (method === 'cash') return <CashIcon className={className} />
  if (method === 'duitnow') return <QrIcon className={className} />
  if (method === 'hitpay') return <QrIcon className={`${className} text-lavender`} />
  return <CardIcon className={className} />
}

function DashedLine() {
  return <div className="w-full border-t-2 border-dashed border-fog" aria-hidden />
}

function ConfettiExplosion() {
  const confettiCount = 80
  const colors = ['#33c758', '#918df6', '#2c78fc', '#ffa600', '#ff3e00', '#d6409f']

  const pieces = Array.from({ length: confettiCount }).map((_, i) => ({
    left: `${(i * 17 + 7) % 100}%`,
    top: `${-20 + ((i * 13) % 10)}%`,
    rotate: `${(i * 47) % 360}deg`,
    delay: `${((i * 3) % 20) / 10}s`,
    duration: `${2.5 + ((i * 5) % 25) / 10}s`,
    color: colors[i % colors.length],
  }))

  return (
    <>
      <style>
        {`
          @keyframes receipt-confetti-fall {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
          }
        `}
      </style>
      <div className="pointer-events-none fixed inset-0 z-[71]" aria-hidden>
        {pieces.map((piece, i) => (
          <div
            key={i}
            className="absolute h-4 w-2"
            style={{
              left: piece.left,
              top: piece.top,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotate})`,
              animation: `receipt-confetti-fall ${piece.duration} ${piece.delay} linear forwards`,
            }}
          />
        ))}
      </div>
    </>
  )
}

export type ReceiptTicketProps = {
  receiptRef: string
  amount: number
  date: Date
  customer: string
  method: PaymentMethod
  receiptUrl: string
  className?: string
}

export function ReceiptTicket({
  receiptRef,
  amount,
  date,
  customer,
  method,
  receiptUrl,
  className = '',
}: ReceiptTicketProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const mountTimer = window.setTimeout(() => setShowConfetti(true), 100)
    const unmountTimer = window.setTimeout(() => setShowConfetti(false), 6000)
    return () => {
      window.clearTimeout(mountTimer)
      window.clearTimeout(unmountTimer)
    }
  }, [])

  const formattedAmount = new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(amount)

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(',', ' ·')

  return (
    <>
      <style>
        {`
          @keyframes receipt-ticket-enter {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes receipt-check-enter {
            from { opacity: 0; transform: scale(0.5); }
            to { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
      {showConfetti && <ConfettiExplosion />}
      <div
        className={`relative z-[72] w-full max-w-sm rounded-2xl bg-paper-white font-display text-carbon shadow-panel ${className}`}
        style={{ animation: 'receipt-ticket-enter 500ms ease-out both' }}
      >
        <div className="flex flex-col items-center p-8 text-center">
          <div
            className="rounded-full bg-mint-wash p-3"
            style={{ animation: 'receipt-check-enter 500ms 300ms ease-out both' }}
          >
            <CheckCircleIcon
              className="h-10 w-10 text-mint"
              style={{ animation: 'receipt-check-enter 500ms 500ms ease-out both' }}
            />
          </div>
          <h1 className="mt-4 font-display text-2xl font-medium tracking-ui text-carbon">Paid</h1>
          <p className="mt-1 text-sm text-graphite">Payment received — receipt ready for customer</p>
        </div>

        <div className="space-y-6 px-8 pb-8">
          <DashedLine />

          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <p className="text-xs uppercase tracking-ui text-ash">Receipt</p>
              <p className="font-mono font-medium text-carbon">{receiptRef}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-ui text-ash">Amount</p>
              <p className="font-display tabular-nums text-lg font-medium tracking-ui text-carbon">
                {formattedAmount}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-ui text-ash">Date & time</p>
            <p className="font-medium text-carbon">{formattedDate}</p>
          </div>

          <div className="flex items-center gap-4 rounded-xl bg-linen p-4">
            <PaymentMethodIcon method={method} />
            <div className="min-w-0 text-left">
              <p className="truncate font-medium text-carbon">{customer}</p>
              <p className="text-sm text-graphite">{methodLabels[method]}</p>
            </div>
          </div>

          <DashedLine />

          <div className="flex flex-col items-center">
            <QrCode
              value={receiptUrl}
              size={140}
              label={`Receipt QR for ${receiptRef}`}
            />
            <p className="mt-3 text-center text-xs text-ash">Scan for digital receipt</p>
            <p className="mt-1 font-mono text-xs text-ash">{receiptRef}</p>
            <p className="mt-2 max-w-full truncate text-center text-xs text-lavender">{receiptUrl}</p>
          </div>
        </div>
      </div>
    </>
  )
}
