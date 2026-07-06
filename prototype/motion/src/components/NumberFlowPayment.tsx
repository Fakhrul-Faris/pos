import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { NumberFlowField } from './NumberFlowField'
import { spring } from '@/motion/springs'

const SERVICES = [
  { name: 'Haircut', price: 35 },
  { name: 'Beard trim', price: 20 },
]

const SERVICE_TOTAL = SERVICES.reduce((a, s) => a + s.price, 0)

export function NumberFlowPayment() {
  const [total, setTotal] = useState<number | undefined>(SERVICE_TOTAL)
  const [editing, setEditing] = useState(false)
  const [simulating, setSimulating] = useState(false)

  async function simulateBarberEdit() {
    if (simulating) return
    setSimulating(true)
    const sequence = [SERVICE_TOTAL, 45, 60, 55, SERVICE_TOTAL]
    for (const amt of sequence) {
      setTotal(amt)
      await new Promise((r) => setTimeout(r, 700))
    }
    setSimulating(false)
  }

  useEffect(() => {
    function onFocusIn(e: FocusEvent) {
      const t = e.target as HTMLElement
      if (t.closest('[data-number-flow]')) setEditing(true)
    }
    function onFocusOut(e: FocusEvent) {
      const t = e.relatedTarget as HTMLElement | null
      if (!t?.closest('[data-number-flow]')) setEditing(false)
    }
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  return (
    <div className="mx-auto w-full max-w-md">
      <motion.div
        className="rounded-2xl border border-black/[0.06] bg-white p-8 shadow-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.natural}
      >
        <p className="mb-1 text-sm text-black/50">Booking #42 · Ahmad R.</p>
        <h2 className="mb-6 font-[Instrument_Sans] text-2xl font-bold text-[#1C1C1C]">
          Collect payment
        </h2>

        <ul className="mb-4 space-y-2">
          {SERVICES.map((s) => (
            <li key={s.name} className="flex justify-between text-sm text-[#1C1C1C]">
              <span>{s.name}</span>
              <span className="font-medium">RM {s.price}</span>
            </li>
          ))}
        </ul>

        <div className="mb-4 border-t border-black/[0.08] pt-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-black/35">
            Total · tap to edit
          </p>
          <div className="relative flex flex-col items-center py-3">
            <motion.div
              className="pointer-events-none absolute inset-x-4 inset-y-0 rounded-2xl bg-[#38CE87]/10 blur-2xl"
              animate={{
                scale: editing ? 1.08 : 1,
                opacity: editing ? 0.85 : 0.45,
              }}
              transition={spring.natural}
            />
            <NumberFlowField
              value={total}
              onChange={setTotal}
              prefix="RM"
              placeholder="0"
              decimalScale={0}
              maxLength={4}
              size="lg"
              aria-label="Payment amount in ringgit"
            />
          </div>
          <p className="mt-2 text-center text-xs text-black/40">
            {editing
              ? 'Select a digit · type to replace · barrel rolls on change'
              : 'Barber can adjust if price differs from booking'}
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {[45, 55, 65, 80].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setTotal(amt)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                total === amt
                  ? 'bg-[#38CE87]/20 text-[#1A7A4C] ring-1 ring-[#38CE87]/40'
                  : 'bg-black/[0.04] text-[#1C1C1C]/70 hover:bg-black/[0.07]'
              }`}
            >
              RM {amt}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={simulating}
          onClick={simulateBarberEdit}
          className="w-full rounded-lg border border-dashed border-black/15 py-2.5 text-sm font-medium text-black/45 transition hover:border-[#38CE87]/50 hover:text-[#1A7A4C] disabled:opacity-50"
        >
          {simulating ? 'Simulating barber edit…' : '▶ Simulate barber changing amount'}
        </button>
      </motion.div>
    </div>
  )
}
