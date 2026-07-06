import { useState } from 'react'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'motion/react'
import { spring, stagger } from '@/motion/springs'
import { MorphButton } from './MorphButton'

export type ReceiptLine = { label: string; value: string; bold?: boolean }

type ReceiptPrinterProps = {
  lines?: ReceiptLine[]
  bookingLabel?: string
  shopName?: string
  compact?: boolean
  onBackToBoard?: () => void
}

const DEFAULT_LINES: ReceiptLine[] = [
  { label: 'Haircut', value: 'RM 35.00' },
  { label: 'Beard trim', value: 'RM 20.00' },
  { label: 'Total', value: 'RM 55.00', bold: true },
]

function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.55 },
    colors: ['#38CE87', '#1A7A4C', '#FFFFFF', '#6DD9A8'],
    ticks: 120,
    gravity: 0.9,
    scalar: 0.9,
  })
}

export function ReceiptPrinter({
  lines = DEFAULT_LINES,
  bookingLabel = '#42',
  shopName = 'Ali Barbershop',
  compact = false,
  onBackToBoard,
}: ReceiptPrinterProps = {}) {
  const [phase, setPhase] = useState<'hidden' | 'printing' | 'done'>('hidden')

  function print() {
    setPhase('printing')
    window.setTimeout(() => {
      setPhase('done')
      fireConfetti()
    }, 900)
  }

  function reset() {
    setPhase('hidden')
  }

  return (
    <div className={`mx-auto flex w-full flex-col items-center ${compact ? '' : 'max-w-sm'}`}>
      <div className="relative mb-0 w-full">
        <div className="mx-auto h-3 w-48 rounded-full bg-[#1C1C1C] shadow-inner" />
        <div className="mx-auto -mt-1 h-2 w-44 rounded-b-lg bg-[#2a2a2a]" />
      </div>

      <div className={`relative w-full overflow-hidden ${compact ? 'min-h-[360px]' : 'min-h-[420px]'}`}>
        <AnimatePresence>
          {(phase === 'printing' || phase === 'done') && (
            <motion.div
              key="receipt"
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0, rotate: 2 }}
              transition={spring.natural}
              className="mx-auto w-[280px] origin-top rounded-b-sm bg-white px-5 pb-8 pt-4 font-[JetBrains_Mono] text-xs text-[#1C1C1C] shadow-lg"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(transparent, transparent 23px, #00000008 23px, #00000008 24px)',
              }}
            >
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: stagger.delay } },
                }}
              >
                <motion.p
                  variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                  className="mb-1 text-center text-sm font-bold tracking-widest"
                >
                  MIKI RECEIPT
                </motion.p>
                <motion.p
                  variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                  className="mb-4 text-center text-[10px] text-black/50"
                >
                  {shopName} · {bookingLabel}
                </motion.p>
                {lines.map((line) => (
                  <motion.div
                    key={line.label}
                    variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                    className={`flex justify-between border-b border-dashed border-black/10 py-2 ${
                      line.bold ? 'mt-2 border-none text-sm font-bold' : ''
                    }`}
                  >
                    <span className="max-w-[160px] truncate">{line.label}</span>
                    <span>{line.value}</span>
                  </motion.div>
                ))}
                <motion.p
                  variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                  className="mt-4 text-center text-[10px] text-black/40"
                >
                  Scan QR on customer phone · C-08
                </motion.p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex gap-3">
        {phase === 'hidden' && (
          <MorphButton
            idleLabel="Complete payment"
            successLabel="Paid!"
            onAction={async () => {
              print()
              await new Promise((r) => setTimeout(r, 1200))
            }}
          />
        )}
        {phase === 'done' && (
          <>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl bg-black/[0.06] px-6 py-3 text-sm font-medium text-[#1C1C1C]/70"
            >
              New walk-in
            </button>
            <motion.button
              type="button"
              onClick={onBackToBoard}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring.natural}
              className="rounded-xl bg-[#38CE87] px-6 py-3 text-sm font-semibold text-[#1C1C1C]"
            >
              Back to board
            </motion.button>
          </>
        )}
      </div>
    </div>
  )
}

/** Exposed for parent-driven payment success (POS party flow) */
export function ReceiptPrinterView({
  lines,
  bookingLabel,
  shopName,
  phase,
}: {
  lines: ReceiptLine[]
  bookingLabel: string
  shopName?: string
  phase: 'printing' | 'done'
}) {
  return (
    <div className="mx-auto flex w-full flex-col items-center">
      <div className="relative mb-0 w-full">
        <div className="mx-auto h-3 w-48 rounded-full bg-[#1C1C1C] shadow-inner" />
        <div className="mx-auto -mt-1 h-2 w-44 rounded-b-lg bg-[#2a2a2a]" />
      </div>
      <div className="relative min-h-[360px] w-full overflow-hidden">
        <AnimatePresence>
          <motion.div
            key="receipt"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={spring.natural}
            className="mx-auto w-[280px] origin-top rounded-b-sm bg-white px-5 pb-8 pt-4 font-[JetBrains_Mono] text-xs text-[#1C1C1C] shadow-lg"
            style={{
              backgroundImage:
                'repeating-linear-gradient(transparent, transparent 23px, #00000008 23px, #00000008 24px)',
            }}
          >
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: stagger.delay } },
              }}
            >
              <motion.p
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                className="mb-1 text-center text-sm font-bold tracking-widest"
              >
                MIKI RECEIPT
              </motion.p>
              <motion.p
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                className="mb-4 text-center text-[10px] text-black/50"
              >
                {shopName ?? 'Ali Barbershop'} · {bookingLabel}
              </motion.p>
              {lines.map((line) => (
                <motion.div
                  key={line.label}
                  variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                  className={`flex justify-between border-b border-dashed border-black/10 py-2 ${
                    line.bold ? 'mt-2 border-none text-sm font-bold' : ''
                  }`}
                >
                  <span className="max-w-[160px] truncate">{line.label}</span>
                  <span>{line.value}</span>
                </motion.div>
              ))}
              <motion.p
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                className="mt-4 text-center text-[10px] text-black/40"
              >
                Cash · Scan QR on customer phone
              </motion.p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
      {phase === 'done' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm font-semibold text-[#14832B]"
        >
          Payment received · #42 paid
        </motion.p>
      )}
    </div>
  )
}

export { fireConfetti }
