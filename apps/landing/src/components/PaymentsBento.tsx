import { RevealGroup, RevealItem } from './Reveal'
import type { ReactNode } from 'react'

type BentoCell = {
  id: string
  layout: 'tall' | 'wide' | 'small-a' | 'small-b'
  label: string
  line: string
  visual: ReactNode
}

const cells: BentoCell[] = [
  {
    id: 'cash',
    layout: 'tall',
    label: 'Cash',
    line: 'Still accepted. Still counted automatically.',
    visual: <CashVisual />,
  },
  {
    id: 'card',
    layout: 'wide',
    label: 'Card',
    line: 'Tap or swipe, synced the moment it clears.',
    visual: <CardVisual />,
  },
  {
    id: 'qr',
    layout: 'small-a',
    label: 'Your own QR',
    line: 'Keep the QR you already use. We just plug it in.',
    visual: <QrVisual />,
  },
  {
    id: 'lockin',
    layout: 'small-b',
    label: 'Zero lock-in',
    line: 'Instant checkout',
    visual: <LockInVisual />,
  },
]

const layoutClass: Record<BentoCell['layout'], string> = {
  tall: 'payments-bento-card--tall',
  wide: 'payments-bento-card--wide',
  'small-a': 'payments-bento-card--small-a',
  'small-b': 'payments-bento-card--small-b',
}

export function PaymentsBento() {
  return (
    <RevealGroup className="payments-bento-grid" stagger={0.11} delay={0.05}>
      {cells.map((cell) => (
        <RevealItem
          key={cell.id}
          y={40}
          className={`payments-bento-card ${layoutClass[cell.layout]}`}
        >
          <div className="payments-bento-visual" aria-hidden>
            {cell.visual}
          </div>
          <div>
            <h3 className="payments-bento-label">{cell.label}</h3>
            <p className="payments-bento-line">{cell.line}</p>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  )
}

function CashVisual() {
  return (
    <div className="payments-bento-cash">
      <div className="payments-bento-cash__stack">
        {['RM50', 'RM20', 'RM10'].map((note, i) => (
          <div
            key={note}
            className="payments-bento-cash__note"
            style={{ transform: `translateY(${i * 10}px) rotate(${i * -2}deg)` }}
          >
            <span>{note}</span>
          </div>
        ))}
      </div>
      <div className="payments-bento-cash__receipt">
        <div className="payments-bento-cash__row">
          <span>Walk-in #14</span>
          <span className="text-signal">Paid</span>
        </div>
        <div className="payments-bento-cash__row payments-bento-cash__row--muted">
          <span>Cash</span>
          <span>RM35</span>
        </div>
      </div>
    </div>
  )
}

function CardVisual() {
  return (
    <div className="payments-bento-card-tap">
      <div className="payments-bento-card-tap__waves">
        <span />
        <span />
        <span />
      </div>
      <div className="payments-bento-card-tap__device">
        <div className="payments-bento-card-tap__screen">
          <span className="payments-bento-card-tap__amount">RM 68.00</span>
          <span className="payments-bento-card-tap__status">Tap card</span>
        </div>
      </div>
      <div className="payments-bento-card-tap__card">
        <span />
        <span />
      </div>
    </div>
  )
}

function QrVisual() {
  return (
    <div className="payments-bento-qr">
      <div className="payments-bento-qr__frame">
        <div className="payments-bento-qr__grid">
          {Array.from({ length: 49 }, (_, i) => (
            <span
              key={i}
              className={i % 3 === 0 || i % 7 === 0 ? 'is-dark' : undefined}
            />
          ))}
        </div>
      </div>
      <div className="payments-bento-qr__badge">Your DuitNow</div>
    </div>
  )
}

function LockInVisual() {
  return (
    <div className="payments-bento-lockin">
      <div className="payments-bento-lockin__ring">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 11V8a5 5 0 0 1 10 0v3"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <rect
            x="5"
            y="11"
            width="14"
            height="10"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path
            d="M12 15v2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="payments-bento-lockin__check">✓</div>
    </div>
  )
}
