'use client'

import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FloatingInput } from './FloatingInput'
import { MorphButton } from './MorphButton'
import { BookingStatusScreen } from './BookingStatusScreen'
import { BookingFlow } from './BookingFlow'
import {
  buildLookupDates,
  DEMO_MULTI_PHONE,
  lookupBookings,
  todayKey,
  type RetrievedBooking,
} from '@/lib/bookingLookupMock'
import {
  DEMO_RETURNING_PHONE,
  isValidMyMobile,
  normalizePhone,
} from '@/lib/loyaltyMock'
import { spring } from '@/motion/springs'

type Step = 'find' | 'pick' | 'status' | 'edit'

type RetrieveBookingPageProps = {
  onBack: () => void
  onDone: () => void
  /** After cancel → start a new booking */
  onBookAgain?: () => void
}

export function RetrieveBookingPage({ onBack, onDone, onBookAgain }: RetrieveBookingPageProps) {
  const dates = useMemo(() => buildLookupDates(new Date(), 7), [])
  const [step, setStep] = useState<Step>('find')
  const [phone, setPhone] = useState('')
  const [dateKey, setDateKey] = useState(() => todayKey())
  const [error, setError] = useState<string | null>(null)
  const [matches, setMatches] = useState<RetrievedBooking[]>([])
  const matchesRef = useRef<RetrievedBooking[]>([])
  const [selected, setSelected] = useState<RetrievedBooking | null>(null)
  const [cameFromPick, setCameFromPick] = useState(false)

  const phoneOk = isValidMyMobile(phone)
  const selectedDate = dates.find((d) => d.key === dateKey)

  function goFind() {
    setStep('find')
    setSelected(null)
    setCameFromPick(false)
  }

  function openStatus(booking: RetrievedBooking, fromPick: boolean) {
    setSelected(booking)
    setCameFromPick(fromPick)
    setStep('status')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {step === 'find' && (
          <motion.div
            key="find"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={spring.snappy}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex shrink-0 items-center gap-3 border-b border-black/[0.06] px-5 py-3.5">
              <button
                type="button"
                onClick={onBack}
                aria-label="Go back"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-black/55 transition hover:bg-black/[0.04]"
              >
                ←
              </button>
              <div className="min-w-0">
                <p className="truncate font-[family-name:var(--font-display)] text-sm font-bold tracking-tight">
                  Find booking
                </p>
                <p className="text-[11px] text-black/40">Phone + date</p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                Find your booking
              </h1>
              <p className="mt-2 text-sm text-black/45">
                No account needed. Enter the phone used when you booked.
              </p>

              <div className="mt-8 space-y-5">
                <FloatingInput
                  label="Mobile number"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(v) => {
                    setPhone(v)
                    setError(null)
                  }}
                />
                <p className="text-[11px] leading-relaxed text-black/35">
                  By continuing you agree we may use this number only to show your booking
                  for the date you pick (PDPA).
                </p>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-black/35">
                    Date
                  </p>
                  <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
                    {dates.map((d, i) => {
                      const active = d.key === dateKey
                      return (
                        <motion.button
                          key={d.key}
                          type="button"
                          onClick={() => {
                            setDateKey(d.key)
                            setError(null)
                          }}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...spring.natural, delay: i * 0.03 }}
                          className={`flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-xl border px-4 py-3 ${
                            active
                              ? 'border-[#38CE87]/50 bg-[#38CE87]/12 text-[#1A7A4C]'
                              : 'border-black/[0.06] bg-[#F9F9F8] text-[#1C1C1C]'
                          }`}
                          whileTap={{ scale: 0.97 }}
                        >
                          <span className="text-[10px] font-medium uppercase opacity-60">
                            {d.weekday}
                          </span>
                          <span className="text-xl font-bold">{d.day}</span>
                          <span className="text-[10px] opacity-50">{d.label}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <p className="rounded-xl bg-[#F9F9F8] px-3 py-2 text-[11px] leading-relaxed text-black/40">
                  Demo: <span className="font-medium text-black/55">{DEMO_RETURNING_PHONE}</span>{' '}
                  (editable) ·{' '}
                  <span className="font-medium text-black/55">{DEMO_MULTI_PHONE}</span> (one in
                  chair + one editable)
                </p>
              </div>
            </div>

            <div className="shrink-0 border-t border-black/[0.06] px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <MorphButton
                idleLabel="Find booking"
                loadingLabel="Searching…"
                successLabel="Found"
                fullWidth
                onAction={async () => {
                  if (!phoneOk) {
                    setError('Use a Malaysian mobile, e.g. 0123456789')
                    throw new Error('invalid')
                  }
                  await new Promise((r) => setTimeout(r, 500))
                  const found = lookupBookings(normalizePhone(phone), dateKey)
                  matchesRef.current = found
                  setMatches(found)
                  if (found.length === 0) {
                    const day =
                      selectedDate?.label === 'Today'
                        ? 'today'
                        : selectedDate?.label.toLowerCase() ?? 'that day'
                    setError(`No booking for this number ${day}`)
                    throw new Error('not-found')
                  }
                  setError(null)
                }}
                onSuccess={() => {
                  const found = matchesRef.current
                  if (found.length === 1) {
                    openStatus(found[0], false)
                  } else if (found.length > 1) {
                    setStep('pick')
                  }
                }}
              />
            </div>
          </motion.div>
        )}

        {step === 'pick' && (
          <motion.div
            key="pick"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={spring.snappy}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex shrink-0 items-center gap-3 border-b border-black/[0.06] px-5 py-3.5">
              <button
                type="button"
                onClick={goFind}
                aria-label="Go back"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-black/55 transition hover:bg-black/[0.04]"
              >
                ←
              </button>
              <div className="min-w-0">
                <p className="truncate font-[family-name:var(--font-display)] text-sm font-bold tracking-tight">
                  Pick a booking
                </p>
                <p className="text-[11px] text-black/40">
                  {matches.length} matches · {selectedDate?.label ?? 'Selected day'}
                </p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
              <h1 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
                Which booking?
              </h1>
              <p className="mt-2 text-sm text-black/45">
                More than one visit found for this number.
              </p>

              <ul className="mt-6 space-y-3">
                {matches.map((b, i) => (
                  <motion.li
                    key={b.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.natural, delay: i * 0.05 }}
                  >
                    <button
                      type="button"
                      onClick={() => openStatus(b, true)}
                      className="w-full rounded-xl border border-black/[0.06] bg-[#F9F9F8] px-4 py-4 text-left transition hover:border-[#38CE87]/40 hover:bg-[#38CE87]/08"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[#1C1C1C]">
                          #{b.queueNumber}
                        </span>
                        <span className="text-sm font-medium text-[#1A7A4C]">{b.timeLabel}</span>
                      </div>
                      <p className="mt-1 text-sm text-black/55">
                        {b.barberName} · {b.services}
                      </p>
                      <p className="mt-1 text-xs text-black/35">
                        {b.lifecycleStatus === 'IN_SERVICE'
                          ? 'In chair'
                          : b.partySize > 1
                            ? `${b.partySize} people`
                            : 'Booked'}
                      </p>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {step === 'status' && selected && (
          <motion.div
            key={`status-${selected.id}-${selected.queueNumber}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={spring.snappy}
            className="flex min-h-0 flex-1 flex-col"
          >
            <BookingStatusScreen
              booking={selected}
              onBack={() => {
                if (cameFromPick) {
                  setStep('pick')
                  setSelected(null)
                } else {
                  goFind()
                }
              }}
              onDone={onDone}
              onEdit={() => setStep('edit')}
              onCancelled={onBookAgain ?? onDone}
            />
          </motion.div>
        )}

        {step === 'edit' && selected && (
          <motion.div
            key={`edit-${selected.id}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={spring.snappy}
            className="flex min-h-0 flex-1 flex-col"
          >
            <BookingFlow
              mode="edit"
              initial={selected}
              onExit={() => setStep('status')}
              onSaved={(booking) => {
                setSelected(booking)
                setMatches((prev) => prev.map((m) => (m.id === booking.id ? booking : m)))
                setStep('status')
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
