'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MorphButton } from './MorphButton'
import { NumberFlowStepper } from './NumberFlowStepper'
import { FloatingInput } from './FloatingInput'
import { LoyaltySheet } from './LoyaltySheet'
import { QueueNumber } from './QueueNumber'
import { EditBookingWarnSheet } from './EditBookingWarnSheet'
import { CancelBookingWarnSheet } from './CancelBookingWarnSheet'
import {
  afterPaidStamp,
  DEMO_RETURNING_PHONE,
  isValidMyMobile,
  lookupLoyalty,
  normalizePhone,
  type LoyaltyProfile,
} from '@/lib/loyaltyMock'
import {
  barberNameFromId,
  BOOKING_SERVICES,
  buildLookupDates,
  canEditBooking,
  canCancelBooking,
  formatBookingDateLabel,
  needsNewQueueNumber,
  nextQueueNumber,
  slotIdFor,
  todayKey,
  type BookingBarberId,
  type BookingServiceId,
  type RetrievedBooking,
} from '@/lib/bookingLookupMock'
import { spring } from '@/motion/springs'

const SERVICES = BOOKING_SERVICES

type ServiceId = BookingServiceId

type PartyMember = {
  id: string
  name: string
  serviceIds: Set<ServiceId>
}

type BarberId = BookingBarberId

type TimeSlot = {
  id: string
  label: string
  startMin: number
  reason?: 'taken' | 'walkin' | 'short'
}

const BARBERS = [
  { id: 'ali' as const, name: 'Ali', initials: 'A', full: false, nextFree: '2:30 PM' },
  { id: 'siti' as const, name: 'Siti', initials: 'S', full: false, nextFree: '3:00 PM' },
  { id: 'ben' as const, name: 'Ben', initials: 'B', full: true, nextFree: null },
]

const PROGRESS = ['Services', 'Schedule', 'Details', 'Review', 'Done'] as const

const BOOKING_DATES = buildLookupDates(new Date(), 7)
const DEMO_TODAY = todayKey()

const SHOP_CLOSE_MIN = 18 * 60
const WALKIN_ONLY: Record<string, [number, number]> = {
  [DEMO_TODAY]: [12 * 60, 14 * 60],
  [BOOKING_DATES[6]?.key ?? DEMO_TODAY]: [12 * 60, 14 * 60],
}

/** Mock occupied windows [startMin, endMin) per barber+date */
const OCCUPIED: Record<string, [number, number][]> = {
  [`ali-${DEMO_TODAY}`]: [
    [14 * 60, 14 * 60 + 45],
    [16 * 60 + 30, 17 * 60 + 15],
  ],
  [`siti-${DEMO_TODAY}`]: [[15 * 60, 15 * 60 + 60]],
  [`ali-${BOOKING_DATES[1]?.key ?? DEMO_TODAY}`]: [[10 * 60, 11 * 60 + 30]],
}

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6

type BookingStatus = 'BOOKED' | 'PAID' | 'CANCELLED'

export type BookingFlowProps = {
  onExit: () => void
  mode?: 'create' | 'edit'
  initial?: RetrievedBooking
  onSaved?: (booking: RetrievedBooking, queueReissued: boolean) => void
}

function progressIndex(step: Step) {
  if (step === 0) return 0
  if (step <= 2) return 1
  if (step === 3) return 2
  if (step === 4) return 3
  return 4
}

function createMember(index: number, serviceIds: ServiceId[] = index === 0 ? ['haircut'] : []): PartyMember {
  return {
    id: `member-${index}`,
    name: index === 0 ? 'You' : `Guest ${index + 1}`,
    serviceIds: new Set(serviceIds),
  }
}

function memberSubtotal(member: PartyMember) {
  return SERVICES.filter((s) => member.serviceIds.has(s.id)).reduce((a, s) => a + s.price, 0)
}

function memberDurationMin(member: PartyMember) {
  return SERVICES.filter((s) => member.serviceIds.has(s.id)).reduce((a, s) => a + s.durationMin, 0)
}

function memberServiceLabel(member: PartyMember) {
  return SERVICES.filter((s) => member.serviceIds.has(s.id))
    .map((s) => s.name)
    .join(' + ')
}

function resizeMembers(prev: PartyMember[], partySize: number): PartyMember[] {
  if (partySize > prev.length) {
    const added = Array.from({ length: partySize - prev.length }, (_, i) => {
      const index = prev.length + i
      return createMember(index)
    })
    return [...prev, ...added]
  }
  if (partySize < prev.length) return prev.slice(0, partySize)
  return prev
}

function formatSlotLabel(startMin: number) {
  const h = Math.floor(startMin / 60)
  const m = startMin % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return m === 0 ? `${hour12}:00 ${period}` : `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

function formatDateLong(dateKey: string) {
  const d = BOOKING_DATES.find((x) => x.key === dateKey)
  if (d?.label === 'Today') return `Today · ${formatBookingDateLabel(dateKey)}`
  return formatBookingDateLabel(dateKey)
}

function barberDisplayName(id: BarberId) {
  return barberNameFromId(id)
}

function membersFromBooking(booking: RetrievedBooking): PartyMember[] {
  return booking.members.map((m, i) => ({
    id: `member-${i}`,
    name: m.name,
    serviceIds: new Set(m.serviceIds),
  }))
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd
}

function isWindowFree(barberId: Exclude<BarberId, 'anyone'>, dateKey: string, startMin: number, durationMin: number) {
  const endMin = startMin + durationMin
  if (endMin > SHOP_CLOSE_MIN) return false

  const walkin = WALKIN_ONLY[dateKey]
  if (walkin && overlaps(startMin, endMin, walkin[0], walkin[1])) return false

  const blocks = OCCUPIED[`${barberId}-${dateKey}`] ?? []
  return !blocks.some(([s, e]) => overlaps(startMin, endMin, s, e))
}

function generateTimeSlots(barberId: BarberId, dateKey: string, partyDurationMin: number): TimeSlot[] {
  const slots: TimeSlot[] = []
  const barberIds: Exclude<BarberId, 'anyone'>[] =
    barberId === 'anyone'
      ? BARBERS.filter((b) => !b.full).map((b) => b.id)
      : [barberId]

  for (let startMin = 9 * 60; startMin < SHOP_CLOSE_MIN; startMin += 30) {
    const label = formatSlotLabel(startMin)
    const id = `${dateKey}-${startMin}`

    const walkin = WALKIN_ONLY[dateKey]
    if (walkin && overlaps(startMin, startMin + partyDurationMin, walkin[0], walkin[1])) {
      slots.push({ id, label, startMin, reason: 'walkin' })
      continue
    }

    if (startMin + partyDurationMin > SHOP_CLOSE_MIN) {
      slots.push({ id, label, startMin, reason: 'short' })
      continue
    }

    const freeForAny = barberIds.some((bid) =>
      isWindowFree(bid, dateKey, startMin, partyDurationMin),
    )

    if (!freeForAny) {
      slots.push({ id, label, startMin, reason: 'taken' })
      continue
    }

    slots.push({ id, label, startMin })
  }

  return slots
}

function resolveBarberForSlot(barberId: BarberId, dateKey: string, startMin: number, durationMin: number) {
  if (barberId !== 'anyone') return barberId
  const free = BARBERS.filter((b) => !b.full && isWindowFree(b.id, dateKey, startMin, durationMin))
  return free[0]?.id ?? 'ali'
}

export function BookingFlow({
  onExit,
  mode = 'create',
  initial,
  onSaved,
}: BookingFlowProps) {
  const isEditProp = mode === 'edit' && !!initial

  const [step, setStep] = useState<Step>(0)
  const [partySize, setPartySize] = useState(() => initial?.partySize ?? 1)
  const [members, setMembers] = useState<PartyMember[]>(() =>
    initial ? membersFromBooking(initial) : [createMember(0)],
  )
  const [activeMemberIndex, setActiveMemberIndex] = useState(0)
  const [barberId, setBarberId] = useState<BarberId>(() => initial?.barberId ?? 'ali')
  const [dateKey, setDateKey] = useState(
    () => initial?.dateKey ?? BOOKING_DATES[0]?.key ?? DEMO_TODAY,
  )
  const [slotId, setSlotId] = useState<string | null>(() =>
    initial ? slotIdFor(initial.dateKey, initial.slotStartMin) : null,
  )
  const [nickname, setNickname] = useState(() => initial?.nickname ?? '')
  const [phone, setPhone] = useState(() => initial?.phone ?? '')
  const [notes, setNotes] = useState(() => initial?.notes ?? '')
  const [displayQueue, setDisplayQueue] = useState<number | undefined>(
    () => initial?.queueNumber,
  )
  const [previousQueue, setPreviousQueue] = useState<number | undefined>(
    () => initial?.previousQueueNumber,
  )
  const [assignedBarberId, setAssignedBarberId] = useState<Exclude<BarberId, 'anyone'>>(
    () => initial?.barberId ?? 'ali',
  )
  const [loyalty, setLoyalty] = useState<LoyaltyProfile | null>(() =>
    initial ? lookupLoyalty(initial.phone) : null,
  )
  const [softLoyaltyOpen, setSoftLoyaltyOpen] = useState(false)
  const [softLoyaltySeen, setSoftLoyaltySeen] = useState(() => isEditProp)
  const [pendingReviewAfterSoft, setPendingReviewAfterSoft] = useState(false)
  const [celebrateOpen, setCelebrateOpen] = useState(false)
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>('BOOKED')
  const [stampsAfterPay, setStampsAfterPay] = useState<number | null>(null)
  /** Create-flow: editing from status without leaving BookingFlow */
  const [editingFromStatus, setEditingFromStatus] = useState(false)
  const [baselinePartySize, setBaselinePartySize] = useState(
    () => initial?.partySize ?? 1,
  )
  const [baselineDurationMin, setBaselineDurationMin] = useState(
    () => initial?.durationMin ?? 30,
  )
  const [baselineQueue, setBaselineQueue] = useState(() => initial?.queueNumber ?? 42)
  const [queueReissued, setQueueReissued] = useState(false)
  const [editWarnOpen, setEditWarnOpen] = useState(false)
  const [cancelWarnOpen, setCancelWarnOpen] = useState(false)
  const bookingIdRef = useRef(initial?.id ?? `bk-local-${Date.now()}`)

  const isEditing = isEditProp || editingFromStatus

  useEffect(() => {
    setMembers((prev) => resizeMembers(prev, partySize))
    setActiveMemberIndex((i) => Math.min(i, Math.max(0, partySize - 1)))
  }, [partySize])

  useEffect(() => {
    if (step === 5) {
      if (displayQueue != null) return
      const id = window.setTimeout(() => setDisplayQueue(42), 80)
      return () => window.clearTimeout(id)
    }
  }, [step, displayQueue])

  const total = members.reduce((a, m) => a + memberSubtotal(m), 0)
  const estMinutes = members.reduce((a, m) => a + memberDurationMin(m), 0)
  const allConfigured = members.every((m) => m.serviceIds.size > 0)
  const configuredCount = members.filter((m) => m.serviceIds.size > 0).length
  const activeMember = members[activeMemberIndex]

  const willReissueQueue =
    isEditing &&
    needsNewQueueNumber(
      { partySize: baselinePartySize, durationMin: baselineDurationMin },
      { partySize, durationMin: estMinutes },
    )

  const timeSlots = useMemo(
    () => generateTimeSlots(barberId, dateKey, estMinutes),
    [barberId, dateKey, estMinutes],
  )

  const selectedSlot = timeSlots.find((s) => s.id === slotId)
  const selectedTimeLabel = selectedSlot?.label ?? ''
  const selectedDateLabel = formatDateLong(dateKey)

  useEffect(() => {
    if (!slotId) return
    const slot = timeSlots.find((s) => s.id === slotId)
    if (!slot || slot.reason) setSlotId(null)
  }, [timeSlots, slotId])

  /** Instant loyalty detect when phone becomes a valid MY mobile on Details */
  useEffect(() => {
    if (step !== 3) return
    if (isEditing) return
    if (!isValidMyMobile(phone)) return

    const profile = lookupLoyalty(phone)
    setLoyalty(profile)

    if (profile.isReturning) {
      if (profile.nicknameHint) {
        setNickname((current) => (current.trim().length >= 2 ? current : profile.nicknameHint!))
      }
      if (!softLoyaltySeen) {
        setPendingReviewAfterSoft(false)
        setSoftLoyaltyOpen(true)
      }
    }
  }, [phone, step, softLoyaltySeen, isEditing])

  function handlePartySizeChange(size: number) {
    setPartySize(size)
  }

  function updateMember(index: number, patch: Partial<Pick<PartyMember, 'name' | 'serviceIds'>>) {
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)))
  }

  function toggleServiceForMember(index: number, serviceId: ServiceId) {
    setMembers((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m
        const next = new Set(m.serviceIds)
        if (next.has(serviceId)) next.delete(serviceId)
        else next.add(serviceId)
        return { ...m, serviceIds: next }
      }),
    )
  }

  function buildSavedBooking(
    queueNumber: number,
    previousQueueNumber: number | undefined,
    assigned: Exclude<BarberId, 'anyone'>,
  ): RetrievedBooking {
    const memberSnaps = members.map((m) => ({
      name: m.name.trim() || 'Guest',
      serviceIds: [...m.serviceIds] as BookingServiceId[],
    }))
    return {
      id: bookingIdRef.current,
      queueNumber,
      previousQueueNumber,
      nickname: nickname.trim(),
      phone: normalizePhone(phone),
      barberId: assigned,
      barberName: barberDisplayName(assigned),
      timeLabel: selectedTimeLabel,
      slotStartMin: selectedSlot?.startMin ?? 0,
      dateKey,
      dateLabel: formatBookingDateLabel(dateKey),
      services: memberSnaps.map((m) =>
        SERVICES.filter((s) => m.serviceIds.includes(s.id))
          .map((s) => s.name)
          .join(' + '),
      ).join(' · '),
      total,
      partySize,
      durationMin: estMinutes,
      members: memberSnaps,
      nowServing: 40,
      lifecycleStatus: 'BOOKED',
      notes: notes.trim() || undefined,
    }
  }

  async function confirmBooking() {
    let assigned: Exclude<BarberId, 'anyone'> = assignedBarberId
    if (selectedSlot) {
      assigned = resolveBarberForSlot(barberId, dateKey, selectedSlot.startMin, estMinutes)
      setAssignedBarberId(assigned)
    }

    if (isEditing) {
      const reissue = needsNewQueueNumber(
        { partySize: baselinePartySize, durationMin: baselineDurationMin },
        { partySize, durationMin: estMinutes },
      )
      const nextQ = reissue ? nextQueueNumber(baselineQueue) : baselineQueue
      setQueueReissued(reissue)
      setPreviousQueue(reissue ? baselineQueue : undefined)
      setDisplayQueue(nextQ)
      await new Promise((r) => setTimeout(r, 700))
      return
    }

    await new Promise((r) => setTimeout(r, 1100))
  }

  function handleBookingSuccess() {
    if (isEditing) {
      window.setTimeout(() => setStep(5), 350)
      return
    }
    window.setTimeout(() => setStep(5), 350)
  }

  function finishEditToStatus() {
    const q = displayQueue ?? baselineQueue
    const assigned = assignedBarberId
    const saved = buildSavedBooking(q, queueReissued ? previousQueue : undefined, assigned)
    setBaselinePartySize(partySize)
    setBaselineDurationMin(estMinutes)
    setBaselineQueue(q)
    setEditingFromStatus(false)
    setBookingStatus('BOOKED')
    if (isEditProp && onSaved) {
      onSaved(saved, queueReissued)
      return
    }
    setStep(6)
  }

  function startEditFromStatus() {
    setBaselinePartySize(partySize)
    setBaselineDurationMin(estMinutes)
    setBaselineQueue(displayQueue ?? 42)
    setQueueReissued(false)
    setPreviousQueue(undefined)
    setEditingFromStatus(true)
    setSoftLoyaltySeen(true)
    setStep(0)
  }

  function restartDemo() {
    setStep(0)
    setPartySize(1)
    setMembers([createMember(0)])
    setActiveMemberIndex(0)
    setBarberId('ali')
    setDateKey(BOOKING_DATES[0]?.key ?? DEMO_TODAY)
    setSlotId(null)
    setNickname('')
    setPhone('')
    setNotes('')
    setAssignedBarberId('ali')
    setLoyalty(null)
    setSoftLoyaltyOpen(false)
    setSoftLoyaltySeen(false)
    setPendingReviewAfterSoft(false)
    setCelebrateOpen(false)
    setBookingStatus('BOOKED')
    setStampsAfterPay(null)
    setEditingFromStatus(false)
    setDisplayQueue(undefined)
    setPreviousQueue(undefined)
    setQueueReissued(false)
    setEditWarnOpen(false)
    setCancelWarnOpen(false)
    setBaselinePartySize(1)
    setBaselineDurationMin(30)
    setBaselineQueue(42)
    bookingIdRef.current = `bk-local-${Date.now()}`
  }

  function goToDetails() {
    const primary = members[0]?.name.trim()
    if (primary && primary !== 'You' && !nickname) setNickname(primary)
    setStep(3)
  }

  function handleReviewClick() {
    if (isEditing) {
      setStep(4)
      return
    }
    const profile = lookupLoyalty(phone)
    setLoyalty(profile)
    if (!softLoyaltySeen) {
      setPendingReviewAfterSoft(true)
      setSoftLoyaltyOpen(true)
      return
    }
    setStep(4)
  }

  function dismissSoftLoyalty() {
    setSoftLoyaltyOpen(false)
    setSoftLoyaltySeen(true)
    if (pendingReviewAfterSoft) {
      setPendingReviewAfterSoft(false)
      setStep(4)
    }
  }

  function simulatePaid() {
    const base = loyalty ?? lookupLoyalty(phone)
    const next = afterPaidStamp(base)
    setLoyalty(next)
    setStampsAfterPay(next.stamps)
    setBookingStatus('PAID')
    setCelebrateOpen(true)
  }

  function handleHeaderBack() {
    if (step === 0) {
      if (isEditProp) {
        onExit()
        return
      }
      if (editingFromStatus) {
        setEditingFromStatus(false)
        setStep(6)
        return
      }
      onExit()
      return
    }
    if (step >= 5) {
      onExit()
      return
    }
    setStep((s) => (s - 1) as Step)
  }

  const headerSubtitle =
    step === 0
      ? isEditing
        ? 'Edit booking'
        : 'New booking'
      : step === 1
        ? 'Pick a barber'
        : step === 2
          ? 'Date & time'
          : step === 3
            ? 'Your details'
            : step === 4
              ? 'Review'
              : step === 5
                ? isEditing
                  ? 'Updated'
                  : 'Confirmed'
                : 'Status'

  const detailsValid = nickname.trim().length >= 2 && isValidMyMobile(phone)
  const progress = progressIndex(step)
  const statusEditable =
    bookingStatus === 'BOOKED' && canEditBooking('BOOKED')
  const statusCancellable =
    bookingStatus === 'BOOKED' && canCancelBooking('BOOKED')

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-x-hidden">
      <div className="flex shrink-0 items-center gap-3 border-b border-black/[0.06] px-5 py-3.5">
        <button
          type="button"
          onClick={handleHeaderBack}
          aria-label={
            step === 0 || step >= 5
              ? isEditing && step === 0
                ? 'Cancel edit'
                : 'Exit booking'
              : 'Go back'
          }
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-black/55 transition hover:bg-black/[0.04] hover:text-[var(--order-ink)]"
        >
          ←
        </button>
        <div className="min-w-0">
          <p className="truncate font-[family-name:var(--font-display)] text-sm font-bold tracking-tight">
            Ali Barbershop
          </p>
          <p className="text-[11px] text-black/40">{headerSubtitle}</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5 pt-3">
      <div className="mb-3 flex shrink-0 items-center gap-1">
        {PROGRESS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <motion.div
              className="h-1 w-full rounded-full"
              animate={{
                backgroundColor: i <= progress ? '#38CE87' : 'rgba(0,0,0,0.08)',
              }}
              transition={spring.natural}
            />
            <span className="hidden text-[9px] text-black/30 sm:block">{label}</span>
          </div>
        ))}
      </div>

      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          {step === 0 && (
            <StepPanel
              key="services"
              direction={1}
              footer={
                <PrimaryNext
                  disabled={!allConfigured}
                  onClick={() => setStep(1)}
                  label={`Next · RM ${total}`}
                />
              }
            >
              <ScreenHeader
                title={partySize > 1 ? 'Services per person' : 'Select services'}
                subtitle={
                  partySize > 1 ? 'Each person can pick a different package' : undefined
                }
              />

              <NumberFlowStepper
                className="mt-6"
                label="Party size"
                value={partySize}
                onChange={handlePartySizeChange}
                min={1}
                max={6}
                suffix={partySize === 1 ? 'person' : 'people'}
              />

              {partySize > 1 && (
                <>
                  <PersonTabs
                    members={members}
                    activeIndex={activeMemberIndex}
                    onSelect={setActiveMemberIndex}
                  />
                  <motion.div
                    key={`name-${activeMemberIndex}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={spring.snappy}
                    className="mt-4"
                  >
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-black/35">
                      Name (optional)
                    </label>
                    <input
                      type="text"
                      value={activeMember?.name ?? ''}
                      onChange={(e) => updateMember(activeMemberIndex, { name: e.target.value })}
                      placeholder={`Guest ${activeMemberIndex + 1}`}
                      className="w-full rounded-xl border border-black/[0.08] bg-[#F9F9F8] px-4 py-3 text-sm text-[#1C1C1C] outline-none transition focus:border-[#38CE87]/50 focus:ring-2 focus:ring-[#38CE87]/20"
                    />
                  </motion.div>
                  <p className="mt-3 text-center text-xs text-black/45">
                    {configuredCount}/{partySize} configured · ~{estMinutes} min total
                  </p>
                </>
              )}

              {partySize === 1 && estMinutes > 0 && (
                <p className="mt-2 text-center text-xs text-black/45">~{estMinutes} min</p>
              )}

              <ServicePicker
                partySize={partySize}
                activeMember={activeMember}
                activeMemberIndex={activeMemberIndex}
                members={members}
                onToggle={(idx, sid) => toggleServiceForMember(idx, sid)}
              />

              {partySize > 1 && activeMemberIndex < partySize - 1 && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setActiveMemberIndex((i) => i + 1)}
                  className="mt-4 w-full rounded-xl border border-black/[0.08] py-3 text-sm font-medium text-[#1A7A4C]"
                >
                  Next person →
                </motion.button>
              )}
            </StepPanel>
          )}

          {step === 1 && (
            <StepPanel
              key="barber"
              direction={1}
              footer={<PrimaryNext onClick={() => setStep(2)} label="Next · Schedule" />}
            >
              <ScreenHeader title="Pick a barber" subtitle="Or let us assign the first available chair" />

              <div className="mt-6 space-y-3">
                <BarberCard
                  name="Anyone available"
                  initials="✦"
                  selected={barberId === 'anyone'}
                  hint="Earliest slot that fits your party"
                  onSelect={() => setBarberId('anyone')}
                />
                {BARBERS.map((b, i) => (
                  <BarberCard
                    key={b.id}
                    name={b.name}
                    initials={b.initials}
                    selected={barberId === b.id}
                    full={b.full}
                    hint={b.full ? 'Full today' : `Next free · ${b.nextFree}`}
                    delay={i * 0.05}
                    onSelect={() => !b.full && setBarberId(b.id)}
                    disabled={b.full}
                  />
                ))}
              </div>

              {partySize > 1 && (
                <p className="mt-4 rounded-xl bg-[#F9F9F8] px-4 py-3 text-xs text-black/45">
                  Your party needs ~{estMinutes} min back-to-back. Counter may split chairs at
                  arrival if another barber is free.
                </p>
              )}
            </StepPanel>
          )}

          {step === 2 && (
            <StepPanel
              key="schedule"
              direction={1}
              footer={
                <PrimaryNext disabled={!slotId} onClick={goToDetails} label="Next · Your details" />
              }
            >
              <ScreenHeader
                title="Pick date & time"
                subtitle={`${barberDisplayName(barberId)} · ~${estMinutes} min for your party`}
              />

              <p className="mt-6 text-xs font-medium uppercase tracking-wide text-black/35">Date</p>
              <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
                {BOOKING_DATES.map((d, i) => {
                  const active = d.key === dateKey
                  return (
                    <motion.button
                      key={d.key}
                      type="button"
                      onClick={() => {
                        setDateKey(d.key)
                        setSlotId(null)
                      }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring.natural, delay: i * 0.04 }}
                      className={`flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-xl border px-4 py-3 ${
                        active
                          ? 'border-[#38CE87]/50 bg-[#38CE87]/12 text-[#1A7A4C]'
                          : 'border-black/[0.06] bg-[#F9F9F8] text-[#1C1C1C]'
                      }`}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span className="text-[10px] font-medium uppercase opacity-60">{d.weekday}</span>
                      <span className="text-xl font-bold">{d.day}</span>
                      <span className="text-[10px] opacity-50">{d.label}</span>
                    </motion.button>
                  )
                })}
              </div>

              <p className="mt-5 text-xs font-medium uppercase tracking-wide text-black/35">
                Time · {selectedDateLabel}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {timeSlots.map((slot, i) => {
                  const selected = slot.id === slotId
                  const disabled = !!slot.reason
                  return (
                    <motion.button
                      key={slot.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSlotId(slot.id)}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...spring.natural, delay: Math.min(i * 0.02, 0.3) }}
                      className={`relative rounded-xl border py-3 text-sm font-semibold transition-colors ${
                        selected
                          ? 'border-[#38CE87] bg-[#38CE87]/15 text-[#1A7A4C]'
                          : disabled
                            ? 'cursor-not-allowed border-black/[0.04] bg-black/[0.02] text-black/25'
                            : 'border-black/[0.06] bg-[#F9F9F8] text-[#1C1C1C] hover:border-[#38CE87]/30'
                      }`}
                      whileTap={disabled ? undefined : { scale: 0.96 }}
                    >
                      {slot.label}
                      {slot.reason === 'short' && (
                        <span className="mt-0.5 block text-[9px] font-normal opacity-60">Too short</span>
                      )}
                      {slot.reason === 'walkin' && (
                        <span className="mt-0.5 block text-[9px] font-normal opacity-60">Walk-in</span>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              {estMinutes > 45 && (
                <p className="mt-4 text-center text-xs text-black/40">
                  Grey slots can&apos;t fit ~{estMinutes} min for your whole party
                </p>
              )}
            </StepPanel>
          )}

          {step === 3 && (
            <StepPanel
              key="details"
              direction={1}
              footer={
                <PrimaryNext
                  disabled={!detailsValid}
                  onClick={handleReviewClick}
                  label="Review booking"
                />
              }
            >
              <ScreenHeader
                title="Your details"
                subtitle={`${selectedTimeLabel} · ${selectedDateLabel} · ${barberDisplayName(barberId)}`}
              />

              <div className="mt-6 space-y-4">
                <FloatingInput
                  label="Nickname"
                  value={nickname}
                  onChange={setNickname}
                  autoComplete="nickname"
                />
                <div>
                  <FloatingInput
                    label="Phone number"
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    autoComplete="tel"
                    readOnly={isEditing}
                  />
                  {isEditing ? (
                    <p className="mt-2 text-[11px] text-black/35">
                      Phone can&apos;t be changed. It&apos;s used to find this booking.
                    </p>
                  ) : loyalty?.isReturning && isValidMyMobile(phone) ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={spring.snappy}
                      className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-[#38CE87]/25 bg-[#38CE87]/10 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1A7A4C]">
                          Welcome back{loyalty.nicknameHint ? `, ${loyalty.nicknameHint}` : ''}
                        </p>
                        <p className="text-xs text-[#1A7A4C]/80">
                          {loyalty.stamps} / {loyalty.goal} stamps on {loyalty.campaignName}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSoftLoyaltyOpen(true)}
                        className="shrink-0 text-xs font-semibold text-[#1A7A4C] underline-offset-2 hover:underline"
                      >
                        View card
                      </button>
                    </motion.div>
                  ) : (
                    <p className="mt-2 text-[11px] text-black/35">
                      Demo returning guest:{' '}
                      <button
                        type="button"
                        className="font-medium text-[#1A7A4C] underline-offset-2 hover:underline"
                        onClick={() => setPhone(DEMO_RETURNING_PHONE)}
                      >
                        {DEMO_RETURNING_PHONE}
                      </button>
                    </p>
                  )}
                </div>
                <FloatingInput label="Notes (optional)" value={notes} onChange={setNotes} />
              </div>

              <p className="mt-4 text-xs leading-relaxed text-black/40">
                We use your phone to find this booking. No account needed. By continuing you agree
                we store your name and phone for this visit.
              </p>
            </StepPanel>
          )}

          {step === 4 && (
            <StepPanel
              key="review"
              direction={1}
              footer={
                <div className="flex justify-center">
                  <MorphButton
                    idleLabel={isEditing ? 'Save changes' : 'Confirm booking'}
                    loadingLabel={isEditing ? 'Updating…' : 'Locking slot…'}
                    successLabel={isEditing ? 'Saved' : 'Booked!'}
                    fullWidth
                    onAction={confirmBooking}
                    onSuccess={handleBookingSuccess}
                  />
                </div>
              }
            >
              <ScreenHeader title={isEditing ? 'Review changes' : 'Review booking'} />

              {willReissueQueue ? (
                <div className="mt-4 rounded-xl border border-[#F5A623]/35 bg-[#F5A623]/10 px-3 py-3 text-sm text-[#8A5A00]">
                  Adding people or services needs a new queue number.
                </div>
              ) : null}

              <div className="mt-6 space-y-3 rounded-xl bg-[#F9F9F8] p-4 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-black/35">
                  {partySize > 1 ? 'Each person' : 'Services'}
                </p>
                {members.map((member, i) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.natural, delay: i * 0.05 }}
                    className="flex items-start justify-between gap-3 border-b border-black/[0.06] pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-[#1C1C1C]">
                        {partySize > 1 ? member.name.trim() || `Guest ${i + 1}` : 'Services'}
                      </p>
                      <p className="mt-0.5 text-xs text-black/45">{memberServiceLabel(member)}</p>
                    </div>
                    <span className="shrink-0 font-semibold">RM {memberSubtotal(member)}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 space-y-4 rounded-xl bg-[#F9F9F8] p-4 text-sm">
                <Row label="Contact">{nickname}</Row>
                <Row label="Phone">{phone}</Row>
                <Row label="Barber">{barberDisplayName(barberId)}</Row>
                <Row label="Arrive">{selectedDateLabel} · {selectedTimeLabel}</Row>
                <Row label="Duration">
                  ~{estMinutes} min{partySize > 1 ? ' · back-to-back' : ''}
                </Row>
                <Row label="Total">
                  <span className="font-bold text-[#1A7A4C]">RM {total}</span>
                </Row>
              </div>

              {partySize > 1 && (
                <p className="mt-3 text-xs text-black/40">
                  One queue number for your party. Chairs may be assigned at the counter.
                </p>
              )}
            </StepPanel>
          )}

          {step === 5 && (
            <StepPanel
              key="confirmed"
              direction={1}
              footer={
                <PrimaryNext
                  onClick={() => {
                    if (isEditing) finishEditToStatus()
                    else setStep(6)
                  }}
                  label={isEditing ? 'View status' : 'View status'}
                  dark
                />
              }
            >
              <div className="flex flex-col items-center py-6 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={spring.playful}
                  className="mb-2 rounded-full bg-[#14832B]/10 px-4 py-1 text-xs font-semibold text-[#14832B]"
                >
                  {isEditing ? 'Updated' : 'Confirmed'}
                </motion.div>

                <p className="mb-2 text-sm text-black/45">
                  {queueReissued ? 'Your new queue number' : 'Your queue number'}
                </p>
                <QueueNumber value={displayQueue} />
                {queueReissued && previousQueue != null ? (
                  <p className="mt-1 text-xs text-black/40">Was #{previousQueue}</p>
                ) : null}

                <p className="mt-3 text-base font-medium text-[#1C1C1C]">{nickname}</p>
                <p className="text-sm text-black/45">
                  {barberDisplayName(assignedBarberId)} · {selectedDateLabel} · {selectedTimeLabel}
                  {partySize > 1 && ` · ${partySize} people`}
                </p>

                {partySize > 1 && (
                  <div className="mt-4 w-full max-w-[280px] rounded-xl bg-[#F9F9F8] p-3 text-left text-xs">
                    {members.map((member, i) => (
                      <p key={member.id} className="text-black/55">
                        <span className="font-medium text-[#1C1C1C]">
                          {member.name.trim() || `Guest ${i + 1}`}
                        </span>
                        {' · '}
                        {memberServiceLabel(member)}
                      </p>
                    ))}
                  </div>
                )}

                <p className="mt-4 max-w-[260px] text-xs text-black/40">
                  {isEditing
                    ? queueReissued
                      ? 'Party or services take more chair time. You moved in the queue.'
                      : 'Your booking was updated. Queue number unchanged.'
                    : 'Save this page. Your booking link works without an account.'}
                </p>
                {!isEditing ? (
                  <p className="mt-2 max-w-[260px] text-xs text-black/35">
                    Stamp card: stamps after you pay at the counter.
                  </p>
                ) : null}
              </div>
            </StepPanel>
          )}

          {step === 6 && (
            <StepPanel
              key="status"
              direction={1}
              footer={
                <div className="space-y-2">
                  {bookingStatus === 'CANCELLED' ? (
                    <>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={restartDemo}
                        className="w-full rounded-xl bg-[#38CE87] py-3.5 text-sm font-semibold text-[#1C1C1C]"
                      >
                        Book again
                      </motion.button>
                      <button
                        type="button"
                        onClick={onExit}
                        className="w-full py-2 text-center text-sm text-black/40"
                      >
                        Done
                      </button>
                    </>
                  ) : (
                    <>
                      {statusEditable ? (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setEditWarnOpen(true)}
                          className="w-full rounded-xl border border-black/[0.08] bg-white py-3.5 text-sm font-semibold text-[#1C1C1C]"
                        >
                          Edit booking
                        </motion.button>
                      ) : null}
                      {bookingStatus === 'BOOKED' ? (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={simulatePaid}
                          className="w-full rounded-xl border border-black/[0.08] bg-[#F9F9F8] py-3.5 text-sm font-semibold text-[#1C1C1C]"
                        >
                          Simulate payment (prototype)
                        </motion.button>
                      ) : (
                        <p className="text-center text-xs text-black/40">
                          Receipt available at the counter · stamp added to your card
                        </p>
                      )}
                      {statusCancellable ? (
                        <button
                          type="button"
                          onClick={() => setCancelWarnOpen(true)}
                          className="w-full py-2.5 text-center text-sm font-medium text-[#C62828]"
                        >
                          Cancel booking
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={restartDemo}
                        className="w-full py-2 text-center text-sm text-black/40"
                      >
                        Restart demo
                      </button>
                    </>
                  )}
                </div>
              }
            >
              <div className="py-2">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-black/40">Ali Barbershop</p>
                    <h2 className="font-[Instrument_Sans] text-xl font-bold text-[#1C1C1C]">
                      Your booking
                    </h2>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={
                      bookingStatus === 'PAID'
                        ? { backgroundColor: '#14832B1A', color: '#14832B' }
                        : bookingStatus === 'CANCELLED'
                          ? { backgroundColor: '#00000014', color: '#666' }
                          : { backgroundColor: '#5B8DEF1A', color: '#5B8DEF' }
                    }
                  >
                    {bookingStatus === 'PAID'
                      ? 'Paid'
                      : bookingStatus === 'CANCELLED'
                        ? 'Cancelled'
                        : 'Booked'}
                  </span>
                </div>

                {bookingStatus === 'CANCELLED' ? (
                  <div className="rounded-2xl border border-black/[0.06] bg-[#F9F9F8] p-6 text-center">
                    <p className="font-[Instrument_Sans] text-lg font-bold text-[#1C1C1C]">
                      Booking cancelled
                    </p>
                    <p className="mt-2 text-sm text-black/45">
                      #{displayQueue ?? 42} · {selectedDateLabel} · {selectedTimeLabel} is released.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#1C1C1C] p-6 text-center text-white">
                    <p className="text-xs text-white/50">Your number</p>
                    <div className="mt-2 flex justify-center">
                      <QueueNumber value={displayQueue ?? 42} tone="light" />
                    </div>
                    {previousQueue != null ? (
                      <p className="mt-1 text-xs text-white/40">Was #{previousQueue}</p>
                    ) : null}
                    <p className="mt-3 text-sm text-white/60">
                      {bookingStatus === 'PAID' ? (
                        <>Thanks. See you next time</>
                      ) : (
                        <>
                          Now serving: <span className="font-semibold text-white">#40</span>
                        </>
                      )}
                    </p>
                  </div>
                )}

                {partySize > 1 && bookingStatus === 'BOOKED' && (
                  <div className="mt-4 rounded-xl border border-[#38CE87]/20 bg-[#38CE87]/5 p-4 text-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#1A7A4C]">
                      Party progress
                    </p>
                    <ul className="mt-2 space-y-2">
                      {members.map((member, i) => (
                        <li key={member.id} className="flex items-center justify-between gap-2">
                          <span className="text-black/55">
                            {member.name.trim() || `Guest ${i + 1}`}
                          </span>
                          <span className="text-xs font-medium text-black/35">Waiting</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-black/40">
                      Barber may assign chairs at counter · still one #42
                    </p>
                  </div>
                )}

                <div className="mt-4 space-y-3 rounded-xl border border-black/[0.06] p-4 text-sm">
                  <Row label="Contact">{nickname}</Row>
                  <Row label="Party">{partySize}</Row>
                  <Row label="Barber">{barberDisplayName(assignedBarberId)}</Row>
                  <Row label="Arrive">{selectedTimeLabel}</Row>
                  {partySize > 1 ? (
                    <div>
                      <span className="text-black/45">Services</span>
                      <ul className="mt-2 space-y-2">
                        {members.map((member, i) => (
                          <li
                            key={member.id}
                            className="flex justify-between gap-3 text-right font-medium text-[#1C1C1C]"
                          >
                            <span className="text-left text-black/45">
                              {member.name.trim() || `Guest ${i + 1}`}
                            </span>
                            <span>{memberServiceLabel(member)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <Row label="Services">{memberServiceLabel(members[0])}</Row>
                  )}
                  <Row label="Total">
                    <span className="font-bold text-[#1A7A4C]">RM {total}</span>
                  </Row>
                  {loyalty ? (
                    <Row label="Stamps">
                      {stampsAfterPay ?? loyalty.stamps} / {loyalty.goal}
                    </Row>
                  ) : null}
                </div>
              </div>
            </StepPanel>
          )}
        </AnimatePresence>
      </div>
      </div>

      {loyalty ? (
        <>
          <LoyaltySheet
            open={softLoyaltyOpen}
            variant="soft"
            profile={loyalty}
            onDismiss={dismissSoftLoyalty}
          />
          <LoyaltySheet
            open={celebrateOpen}
            variant="celebrate"
            profile={loyalty}
            stampsOverride={stampsAfterPay ?? loyalty.stamps}
            onDismiss={() => setCelebrateOpen(false)}
          />
        </>
      ) : null}

      <EditBookingWarnSheet
        open={editWarnOpen}
        queueNumber={displayQueue ?? baselineQueue}
        onCancel={() => setEditWarnOpen(false)}
        onConfirm={() => {
          setEditWarnOpen(false)
          startEditFromStatus()
        }}
      />
      <CancelBookingWarnSheet
        open={cancelWarnOpen}
        queueNumber={displayQueue ?? baselineQueue}
        timeLabel={`${selectedDateLabel} · ${selectedTimeLabel}`}
        onKeep={() => setCancelWarnOpen(false)}
        onConfirm={() => {
          setCancelWarnOpen(false)
          setBookingStatus('CANCELLED')
        }}
      />
    </div>
  )
}

function ScreenHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string
  title: string
  subtitle?: string
}) {
  return (
    <>
      {kicker ? <p className="text-xs font-medium text-[#1A7A4C]">{kicker}</p> : null}
      <h2 className="mt-1 font-[Instrument_Sans] text-2xl font-bold text-[#1C1C1C]">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-black/45">{subtitle}</p> : null}
    </>
  )
}

function PrimaryNext({
  label,
  onClick,
  disabled,
  dark,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  dark?: boolean
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-xl py-4 text-base font-semibold disabled:opacity-40 ${
        dark ? 'bg-[#1C1C1C] text-white' : 'bg-[#38CE87] text-[#1C1C1C]'
      }`}
      whileTap={{ scale: 0.98 }}
      transition={spring.snappy}
    >
      {label}
    </motion.button>
  )
}

function ServicePicker({
  partySize,
  activeMember,
  activeMemberIndex,
  members,
  onToggle,
}: {
  partySize: number
  activeMember: PartyMember | undefined
  activeMemberIndex: number
  members: PartyMember[]
  onToggle: (index: number, serviceId: ServiceId) => void
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={partySize > 1 ? activeMember?.id : 'solo'}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={spring.natural}
        className="mt-6 space-y-3"
      >
        {partySize > 1 && activeMember && (
          <p className="text-sm font-medium text-[#1C1C1C]">
            Pick services for{' '}
            <span className="text-[#1A7A4C]">
              {activeMember.name.trim() || `Guest ${activeMemberIndex + 1}`}
            </span>
          </p>
        )}
        {SERVICES.map((s, i) => {
          const member = partySize > 1 ? activeMember : members[0]
          const on = member?.serviceIds.has(s.id) ?? false
          return (
            <motion.button
              key={s.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.natural, delay: i * 0.05 }}
              onClick={() => onToggle(partySize > 1 ? activeMemberIndex : 0, s.id)}
              className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                on
                  ? 'border-[#38CE87]/50 bg-[#38CE87]/10'
                  : 'border-black/[0.06] bg-[#F9F9F8]'
              }`}
            >
              <div>
                <p className="font-semibold text-[#1C1C1C]">{s.name}</p>
                <p className="text-xs text-black/45">{s.durationMin} min</p>
              </div>
              <span className="font-semibold text-[#1C1C1C]">RM {s.price}</span>
            </motion.button>
          )
        })}
      </motion.div>
    </AnimatePresence>
  )
}

function BarberCard({
  name,
  initials,
  selected,
  full,
  hint,
  delay = 0,
  disabled,
  onSelect,
}: {
  name: string
  initials: string
  selected: boolean
  full?: boolean
  hint?: string | null
  delay?: number
  disabled?: boolean
  onSelect: () => void
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.natural, delay }}
      className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
        selected
          ? 'border-[#38CE87]/50 bg-[#38CE87]/10'
          : disabled
            ? 'cursor-not-allowed border-black/[0.04] bg-black/[0.02] opacity-60'
            : 'border-black/[0.06] bg-[#F9F9F8]'
      }`}
      whileTap={disabled ? undefined : { scale: 0.98 }}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          selected ? 'bg-[#38CE87] text-[#1C1C1C]' : 'bg-[#1C1C1C] text-white'
        }`}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[#1C1C1C]">{name}</p>
          {full && (
            <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase text-black/45">
              Full
            </span>
          )}
        </div>
        {hint ? <p className="mt-0.5 text-xs text-black/45">{hint}</p> : null}
      </div>
    </motion.button>
  )
}

function PersonTabs({
  members,
  activeIndex,
  onSelect,
}: {
  members: PartyMember[]
  activeIndex: number
  onSelect: (index: number) => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ active: boolean; startX: number; scrollLeft: number; moved: boolean }>({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  })

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const activeBtn = el.querySelector<HTMLElement>('[data-active-tab="true"]')
    if (!activeBtn) return
    activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeIndex, members.length])

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = scrollerRef.current
    if (!el) return
    dragRef.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
    }
    el.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = scrollerRef.current
    const drag = dragRef.current
    if (!el || !drag.active) return
    const dx = e.clientX - drag.startX
    if (Math.abs(dx) > 4) drag.moved = true
    el.scrollLeft = drag.scrollLeft - dx
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const el = scrollerRef.current
    const drag = dragRef.current
    if (el) el.releasePointerCapture(e.pointerId)
    drag.active = false
  }

  return (
    <div className="mt-5 w-full max-w-full min-w-0">
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="w-full max-w-full min-w-0 cursor-grab overflow-x-auto overflow-y-hidden overscroll-x-contain active:cursor-grabbing [-ms-overflow-style:auto] [scrollbar-width:thin]"
        style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
      >
        {/* Inner w-max forces content wider than the viewport so the outer actually scrolls */}
        <div className="flex w-max flex-nowrap gap-2 px-0.5 pb-2 pr-4">
          {members.map((member, i) => {
            const active = i === activeIndex
            const done = member.serviceIds.size > 0
            const label = member.name.trim() || `Guest ${i + 1}`

            return (
              <button
                key={member.id}
                type="button"
                data-active-tab={active ? 'true' : undefined}
                onClick={() => {
                  if (dragRef.current.moved) return
                  onSelect(i)
                }}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-[#38CE87]/50 bg-[#38CE87]/15 text-[#1A7A4C]'
                    : 'border-black/[0.08] bg-white text-[#1C1C1C]/70'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    done ? 'bg-[#38CE87] text-[#1C1C1C]' : 'bg-black/[0.06] text-black/35'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StepPanel({
  children,
  footer,
  direction,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
  direction: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction * 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction * -24 }}
      transition={spring.natural}
      className="absolute inset-0 flex min-h-0 min-w-0 flex-col overflow-hidden"
    >
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-4">
        {children}
      </div>
      {footer ? (
        <div className="shrink-0 border-t border-black/[0.06] bg-white pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      ) : null}
    </motion.div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-black/45">{label}</span>
      <span className="text-right font-medium text-[#1C1C1C]">{children}</span>
    </div>
  )
}
