'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { QueueNumber } from './QueueNumber'
import { LoyaltySheet } from './LoyaltySheet'
import { EditBookingWarnSheet } from './EditBookingWarnSheet'
import {
  afterPaidStamp,
  lookupLoyalty,
  type LoyaltyProfile,
} from '@/lib/loyaltyMock'
import {
  canEditBooking,
  memberServicesLabel,
  type LifecycleStatus,
  type RetrievedBooking,
} from '@/lib/bookingLookupMock'

type BookingStatusScreenProps = {
  booking: RetrievedBooking
  onBack: () => void
  onDone?: () => void
  onEdit?: () => void
}

const STATUS_CHIP: Record<
  LifecycleStatus,
  { label: string; bg: string; color: string }
> = {
  BOOKED: { label: 'Booked', bg: '#5B8DEF1A', color: '#5B8DEF' },
  ARRIVED: { label: 'Arrived', bg: '#F5A6231A', color: '#C47F0A' },
  IN_SERVICE: { label: 'In chair', bg: '#7B61FF1A', color: '#5B45D1' },
  PAID: { label: 'Paid', bg: '#14832B1A', color: '#14832B' },
  NO_SHOW: { label: 'No-show', bg: '#00000014', color: '#666' },
}

export function BookingStatusScreen({
  booking,
  onBack,
  onDone,
  onEdit,
}: BookingStatusScreenProps) {
  const [lifecycle, setLifecycle] = useState<LifecycleStatus>(booking.lifecycleStatus)
  const [loyalty, setLoyalty] = useState<LoyaltyProfile>(() => lookupLoyalty(booking.phone))
  const [stampsAfterPay, setStampsAfterPay] = useState<number | null>(null)
  const [celebrateOpen, setCelebrateOpen] = useState(false)
  const [editWarnOpen, setEditWarnOpen] = useState(false)

  useEffect(() => {
    setLifecycle(booking.lifecycleStatus)
    setLoyalty(lookupLoyalty(booking.phone))
    setStampsAfterPay(null)
    setCelebrateOpen(false)
    setEditWarnOpen(false)
  }, [booking.id, booking.queueNumber, booking.lifecycleStatus, booking.phone])

  const editable = canEditBooking(lifecycle) && !!onEdit
  const chip = STATUS_CHIP[lifecycle]

  function simulatePaid() {
    const next = afterPaidStamp(loyalty)
    setLoyalty(next)
    setStampsAfterPay(next.stamps)
    setLifecycle('PAID')
    setCelebrateOpen(true)
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
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
            Ali Barbershop
          </p>
          <p className="text-[11px] text-black/40">Your booking</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-black/40">Ali Barbershop</p>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#1C1C1C]">
              Your booking
            </h2>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: chip.bg, color: chip.color }}
          >
            {chip.label}
          </span>
        </div>

        <div className="rounded-2xl bg-[#1C1C1C] p-6 text-center text-white">
          <p className="text-xs text-white/50">Your number</p>
          <div className="mt-2 flex justify-center">
            <QueueNumber value={booking.queueNumber} tone="light" />
          </div>
          {booking.previousQueueNumber != null ? (
            <p className="mt-1 text-xs text-white/40">Was #{booking.previousQueueNumber}</p>
          ) : null}
          <p className="mt-3 text-sm text-white/60">
            {lifecycle === 'PAID' ? (
              <>Thanks. See you next time</>
            ) : lifecycle === 'IN_SERVICE' ? (
              <>You’re in the chair</>
            ) : (
              <>
                Now serving:{' '}
                <span className="font-semibold text-white">#{booking.nowServing}</span>
              </>
            )}
          </p>
        </div>

        {booking.partySize > 1 && lifecycle !== 'PAID' && lifecycle !== 'NO_SHOW' && (
          <div className="mt-4 rounded-xl border border-[#38CE87]/20 bg-[#38CE87]/5 p-4 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-[#1A7A4C]">
              Party progress
            </p>
            <ul className="mt-2 space-y-2">
              {booking.members.map((member) => (
                <li key={member.name} className="flex items-center justify-between gap-2">
                  <span className="text-black/55">{member.name}</span>
                  <span className="text-xs font-medium text-black/35">
                    {lifecycle === 'IN_SERVICE' ? 'In chair / waiting' : 'Waiting'}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-black/40">
              Barber may assign chairs at counter · still one #{booking.queueNumber}
            </p>
          </div>
        )}

        <div className="mt-4 space-y-3 rounded-xl border border-black/[0.06] p-4 text-sm">
          <Row label="Contact">{booking.nickname}</Row>
          <Row label="Phone">{booking.phone}</Row>
          <Row label="Party">{booking.partySize}</Row>
          <Row label="Barber">{booking.barberName}</Row>
          <Row label="Arrive">
            {booking.dateLabel} · {booking.timeLabel}
          </Row>
          {booking.members.length > 1 ? (
            <div>
              <span className="text-black/45">Services</span>
              <ul className="mt-2 space-y-2">
                {booking.members.map((m) => (
                  <li
                    key={m.name}
                    className="flex justify-between gap-3 text-right font-medium text-[#1C1C1C]"
                  >
                    <span className="text-left text-black/45">{m.name}</span>
                    <span>{memberServicesLabel(m.serviceIds)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Row label="Services">{booking.services}</Row>
          )}
          <Row label="Total">
            <span className="font-bold text-[#1A7A4C]">RM {booking.total}</span>
          </Row>
          <Row label="Stamps">
            {stampsAfterPay ?? loyalty.stamps} / {loyalty.goal}
          </Row>
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-black/[0.06] px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {editable ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setEditWarnOpen(true)}
            className="w-full rounded-xl border border-black/[0.08] bg-white py-3.5 text-sm font-semibold text-[#1C1C1C]"
          >
            Edit booking
          </motion.button>
        ) : null}

        {lifecycle === 'IN_SERVICE' ? (
          <p className="text-center text-xs text-black/40">
            In chair. Ask the barber to change services.
          </p>
        ) : null}

        {lifecycle === 'BOOKED' || lifecycle === 'ARRIVED' ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={simulatePaid}
            className="w-full rounded-xl border border-black/[0.08] bg-[#F9F9F8] py-3.5 text-sm font-semibold text-[#1C1C1C]"
          >
            Simulate payment (prototype)
          </motion.button>
        ) : lifecycle === 'PAID' ? (
          <p className="text-center text-xs text-black/40">
            Receipt available at the counter · stamp added to your card
          </p>
        ) : null}

        {onDone ? (
          <button
            type="button"
            onClick={onDone}
            className="w-full py-2 text-center text-sm text-black/40"
          >
            Done
          </button>
        ) : null}
      </div>

      <LoyaltySheet
        open={celebrateOpen}
        variant="celebrate"
        profile={loyalty}
        stampsOverride={stampsAfterPay ?? loyalty.stamps}
        onDismiss={() => setCelebrateOpen(false)}
      />
      <EditBookingWarnSheet
        open={editWarnOpen}
        queueNumber={booking.queueNumber}
        onCancel={() => setEditWarnOpen(false)}
        onConfirm={() => {
          setEditWarnOpen(false)
          onEdit?.()
        }}
      />
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-black/45">{label}</span>
      <span className="text-right font-medium text-[#1C1C1C]">{children}</span>
    </div>
  )
}
