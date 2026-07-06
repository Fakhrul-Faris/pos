import { useState } from 'react'
import { NumberFlowPayment } from '@/components/NumberFlowPayment'
import { MorphButton } from '@/components/MorphButton'
import { ReceiptPrinter } from '@/components/ReceiptPrinter'
import { CardToDetail } from '@/components/CardToDetail'
import { PosPartyAssign } from '@/components/PosPartyAssign'
import { GlassFab } from '@/components/GlassFab'
import { FloatingInput } from '@/components/FloatingInput'

import { BookingFlow } from '@/components/BookingFlow'

const DEMOS = [
  { id: 'booking', label: 'Customer booking', hint: 'Services → schedule → #42' },
  { id: 'payment', label: 'Number flow', hint: 'Wise-style payment total' },
  { id: 'morph', label: 'Button morph', hint: 'Idle → loading → success' },
  { id: 'receipt', label: 'Receipt + confetti', hint: 'Printer slot · P-08' },
  { id: 'card', label: 'Card → detail', hint: 'POS today board scale' },
  { id: 'party', label: 'Party assign', hint: 'Check-in · split · pay' },
  { id: 'fab', label: 'Glass FAB', hint: 'Blur menu · + rotates to ×' },
  { id: 'input', label: 'Floating input', hint: 'Login field lift on focus' },
] as const

type DemoId = (typeof DEMOS)[number]['id']

export default function App() {
  const [active, setActive] = useState<DemoId>('booking')

  return (
    <div className="min-h-dvh bg-[#F9F9F8]">
      <header className="border-b border-black/[0.06] bg-white px-6 py-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#38CE87] text-sm font-bold text-[#1C1C1C]">
              M
            </div>
            <div>
              <h1 className="font-[Instrument_Sans] text-xl font-bold text-[#1C1C1C]">
                Miki Motion Prototype
              </h1>
              <p className="text-xs text-black/45">
                Polish phase · natural springs · moderate restraint
              </p>
            </div>
          </div>
          <a
            href="https://hello-mat.com/design-engineering/component/number-flow-input"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#1A7A4C] underline-offset-2 hover:underline"
          >
            Number flow reference ↗
          </a>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {DEMOS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setActive(d.id)}
              className={`shrink-0 rounded-xl px-4 py-3 text-left transition lg:w-full ${
                active === d.id
                  ? 'bg-[#1C1C1C] text-white'
                  : 'bg-white text-[#1C1C1C]/70 hover:bg-black/[0.04]'
              }`}
            >
              <span className="block text-sm font-semibold">{d.label}</span>
              <span
                className={`mt-0.5 block text-[11px] ${
                  active === d.id ? 'text-white/60' : 'text-black/35'
                }`}
              >
                {d.hint}
              </span>
            </button>
          ))}
        </nav>

        <main className="min-h-[480px] rounded-2xl border border-black/[0.06] bg-white/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          {active === 'booking' && <BookingFlow />}
          {active === 'payment' && <NumberFlowPayment />}
          {active === 'morph' && (
            <div className="flex flex-col items-center gap-6 py-12">
              <p className="max-w-sm text-center text-sm text-black/50">
                System-wide CTA pattern — morphs on every primary action.
              </p>
              <MorphButton
                idleLabel="Pay RM 55 · Cash"
                loadingLabel="Recording…"
                successLabel="Payment received"
                onAction={() => new Promise((r) => setTimeout(r, 1400))}
              />
            </div>
          )}
          {active === 'receipt' && <ReceiptPrinter />}
          {active === 'card' && <CardToDetail />}
          {active === 'party' && <PosPartyAssign />}
          {active === 'fab' && <GlassFab />}
          {active === 'input' && (
            <div className="mx-auto w-full max-w-sm space-y-4 py-8">
              <h2 className="font-[Instrument_Sans] text-xl font-bold text-[#1C1C1C]">
                Sign in to counter
              </h2>
              <FloatingInput label="Email address" type="email" autoComplete="email" />
              <FloatingInput label="Password" type="password" autoComplete="current-password" />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
