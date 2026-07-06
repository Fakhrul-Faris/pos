import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MorphButton } from './MorphButton'
import { NumberFlowField } from './NumberFlowField'
import { NumberFlowStepper } from './NumberFlowStepper'
import { FloatingInput } from './FloatingInput'
import { spring } from '@/motion/springs'

const SERVICES = [
  { id: 'haircut', name: 'Haircut', price: 35, durationMin: 30 },
  { id: 'beard', name: 'Beard trim', price: 20, durationMin: 15 },
] as const

type ServiceId = (typeof SERVICES)[number]['id']

type PartyMember = {
  id: string
  name: string
  serviceIds: Set<ServiceId>
}

type BarberId = 'ali' | 'siti' | 'ben' | 'anyone'

type BookingDate = {
  key: string
  label: string
  weekday: string
  day: number
}

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

/** Demo anchor — Sun 5 Jul 2026 */
const BOOKING_DATES: BookingDate[] = [
  { key: '2026-07-05', label: 'Today', weekday: 'Sun', day: 5 },
  { key: '2026-07-06', label: 'Mon', weekday: 'Mon', day: 6 },
  { key: '2026-07-07', label: 'Tue', weekday: 'Tue', day: 7 },
  { key: '2026-07-08', label: 'Wed', weekday: 'Wed', day: 8 },
  { key: '2026-07-09', label: 'Thu', weekday: 'Thu', day: 9 },
  { key: '2026-07-10', label: 'Fri', weekday: 'Fri', day: 10 },
  { key: '2026-07-11', label: 'Sat', weekday: 'Sat', day: 11 },
]

const SHOP_CLOSE_MIN = 18 * 60
const WALKIN_ONLY: Record<string, [number, number]> = {
  '2026-07-05': [12 * 60, 14 * 60],
  '2026-07-11': [12 * 60, 14 * 60],
}

/** Mock occupied windows [startMin, endMin) per barber+date */
const OCCUPIED: Record<string, [number, number][]> = {
  'ali-2026-07-05': [
    [14 * 60, 14 * 60 + 45],
    [16 * 60 + 30, 17 * 60 + 15],
  ],
  'siti-2026-07-05': [[15 * 60, 15 * 60 + 60]],
  'ali-2026-07-06': [[10 * 60, 11 * 60 + 30]],
}

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

function progressIndex(step: Step) {
  if (step === 0) return 0
  if (step <= 3) return 1
  if (step === 4) return 2
  if (step === 5) return 3
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
  if (!d) return dateKey
  if (d.label === 'Today') return `Sun ${d.day} Jul`
  return `${d.weekday} ${d.day} Jul`
}

function barberDisplayName(id: BarberId) {
  if (id === 'anyone') return 'First available'
  return BARBERS.find((b) => b.id === id)?.name ?? id
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

export function BookingFlow() {
  const [step, setStep] = useState<Step>(0)
  const [partySize, setPartySize] = useState(1)
  const [members, setMembers] = useState<PartyMember[]>(() => [createMember(0)])
  const [activeMemberIndex, setActiveMemberIndex] = useState(0)
  const [barberId, setBarberId] = useState<BarberId>('ali')
  const [dateKey, setDateKey] = useState(BOOKING_DATES[0].key)
  const [slotId, setSlotId] = useState<string | null>(null)
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [displayQueue, setDisplayQueue] = useState<number | undefined>(undefined)
  const [assignedBarberId, setAssignedBarberId] = useState<Exclude<BarberId, 'anyone'>>('ali')

  useEffect(() => {
    setMembers((prev) => resizeMembers(prev, partySize))
    setActiveMemberIndex((i) => Math.min(i, Math.max(0, partySize - 1)))
  }, [partySize])

  useEffect(() => {
    if (step === 6) {
      const id = window.setTimeout(() => setDisplayQueue(42), 80)
      return () => window.clearTimeout(id)
    }
    setDisplayQueue(undefined)
  }, [step])

  const total = members.reduce((a, m) => a + memberSubtotal(m), 0)
  const estMinutes = members.reduce((a, m) => a + memberDurationMin(m), 0)
  const allConfigured = members.every((m) => m.serviceIds.size > 0)
  const configuredCount = members.filter((m) => m.serviceIds.size > 0).length
  const activeMember = members[activeMemberIndex]

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

  async function confirmBooking() {
    if (selectedSlot) {
      setAssignedBarberId(
        resolveBarberForSlot(barberId, dateKey, selectedSlot.startMin, estMinutes),
      )
    }
    await new Promise((r) => setTimeout(r, 1100))
  }

  function handleBookingSuccess() {
    window.setTimeout(() => setStep(6), 350)
  }

  function restartDemo() {
    setStep(0)
    setPartySize(1)
    setMembers([createMember(0)])
    setActiveMemberIndex(0)
    setBarberId('ali')
    setDateKey(BOOKING_DATES[0].key)
    setSlotId(null)
    setNickname('')
    setPhone('')
    setNotes('')
    setAssignedBarberId('ali')
  }

  function goToDetails() {
    const primary = members[0]?.name.trim()
    if (primary && primary !== 'You' && !nickname) setNickname(primary)
    setStep(4)
  }

  const detailsValid = nickname.trim().length >= 2 && /^01\d{8,9}$/.test(phone.replace(/\s/g, ''))
  const progress = progressIndex(step)

  return (
    <div className="mx-auto w-full max-w-[390px]">
      <div className="mb-6 flex items-center gap-1">
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

      <div className="relative min-h-[580px] overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
        <AnimatePresence mode="wait" initial={false}>
          {step === 0 && (
            <StepPanel key="services" direction={1}>
              <ScreenHeader
                kicker="Ali Barbershop"
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

              <PrimaryNext disabled={!allConfigured} onClick={() => setStep(1)} label={`Next · RM ${total}`} />
            </StepPanel>
          )}

          {step === 1 && (
            <StepPanel key="barber" direction={1}>
              <BackButton onClick={() => setStep(0)} />
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

              <PrimaryNext onClick={() => setStep(2)} label="Next · Pick date" />
            </StepPanel>
          )}

          {step === 2 && (
            <StepPanel key="date" direction={1}>
              <BackButton onClick={() => setStep(1)} />
              <ScreenHeader
                title="Pick a date"
                subtitle={`${barberDisplayName(barberId)} · ~${estMinutes} min for your party`}
              />

              <div className="mt-6 -mx-2 flex gap-2 overflow-x-auto px-2 pb-2">
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
                      className={`flex shrink-0 flex-col items-center rounded-xl border px-4 py-3 min-w-[4.5rem] ${
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

              <PrimaryNext onClick={() => setStep(3)} label="Next · Pick time" />
            </StepPanel>
          )}

          {step === 3 && (
            <StepPanel key="time" direction={1}>
              <BackButton onClick={() => setStep(2)} />
              <ScreenHeader
                title="Pick a time"
                subtitle={`Arrive ${selectedDateLabel} · ~${estMinutes} min for your party`}
              />

              <div className="mt-6 grid grid-cols-3 gap-2">
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

              <PrimaryNext disabled={!slotId} onClick={goToDetails} label="Next · Your details" />
            </StepPanel>
          )}

          {step === 4 && (
            <StepPanel key="details" direction={1}>
              <BackButton onClick={() => setStep(3)} />
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
                <FloatingInput
                  label="Phone number"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  autoComplete="tel"
                />
                <FloatingInput label="Notes (optional)" value={notes} onChange={setNotes} />
              </div>

              <p className="mt-4 text-xs leading-relaxed text-black/40">
                We use your phone to find this booking — no account needed. By continuing you agree
                we store your name and phone for this visit.
              </p>

              <PrimaryNext
                disabled={!detailsValid}
                onClick={() => setStep(5)}
                label="Review booking"
              />
            </StepPanel>
          )}

          {step === 5 && (
            <StepPanel key="review" direction={1}>
              <BackButton onClick={() => setStep(4)} />
              <ScreenHeader title="Review booking" />

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

              <div className="mt-8 flex justify-center">
                <MorphButton
                  idleLabel="Confirm booking"
                  loadingLabel="Locking slot…"
                  successLabel="Booked!"
                  onAction={confirmBooking}
                  onSuccess={handleBookingSuccess}
                />
              </div>
            </StepPanel>
          )}

          {step === 6 && (
            <StepPanel key="confirmed" direction={1}>
              <div className="flex flex-col items-center py-6 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={spring.playful}
                  className="mb-2 rounded-full bg-[#14832B]/10 px-4 py-1 text-xs font-semibold text-[#14832B]"
                >
                  Confirmed
                </motion.div>

                <p className="mb-2 text-sm text-black/45">Your queue number</p>
                <NumberFlowField value={displayQueue} prefix="#" placeholder="—" readOnly size="xl" />

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
                  Save this page — your booking link works without an account.
                </p>

                <motion.button
                  type="button"
                  onClick={() => setStep(7)}
                  className="mt-8 w-full rounded-xl bg-[#1C1C1C] py-4 text-base font-semibold text-white"
                  whileTap={{ scale: 0.98 }}
                >
                  View status
                </motion.button>
              </div>
            </StepPanel>
          )}

          {step === 7 && (
            <StepPanel key="status" direction={1}>
              <div className="py-4">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-black/40">Ali Barbershop</p>
                    <h2 className="font-[Instrument_Sans] text-xl font-bold text-[#1C1C1C]">
                      Your booking
                    </h2>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: '#5B8DEF1A', color: '#5B8DEF' }}
                  >
                    Booked
                  </span>
                </div>

                <div className="rounded-2xl bg-[#1C1C1C] p-6 text-center text-white">
                  <p className="text-xs text-white/50">Your number</p>
                  <div className="mt-2 flex justify-center">
                    <NumberFlowField value={42} prefix="#" readOnly size="xl" tone="light" />
                  </div>
                  <p className="mt-3 text-sm text-white/60">
                    Now serving: <span className="font-semibold text-white">#40</span>
                  </p>
                </div>

                {partySize > 1 && (
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
                </div>

                <button
                  type="button"
                  onClick={restartDemo}
                  className="mt-6 w-full text-center text-sm text-black/40"
                >
                  Restart demo
                </button>
              </div>
            </StepPanel>
          )}
        </AnimatePresence>
      </div>
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

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mb-4 text-sm text-[#1A7A4C]">
      ← Back
    </button>
  )
}

function PrimaryNext({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <div className="mt-8">
      <motion.button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="w-full rounded-xl bg-[#38CE87] py-4 text-base font-semibold text-[#1C1C1C] disabled:opacity-40"
        whileTap={{ scale: 0.98 }}
        transition={spring.snappy}
      >
        {label}
      </motion.button>
    </div>
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
  return (
    <div className="mt-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {members.map((member, i) => {
        const active = i === activeIndex
        const done = member.serviceIds.size > 0
        const label = member.name.trim() || `Guest ${i + 1}`

        return (
          <motion.button
            key={member.id}
            type="button"
            onClick={() => onSelect(i)}
            layout
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? 'border-[#38CE87]/50 bg-[#38CE87]/15 text-[#1A7A4C]'
                : 'border-black/[0.08] bg-white text-[#1C1C1C]/70'
            }`}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                done ? 'bg-[#38CE87] text-[#1C1C1C]' : 'bg-black/[0.06] text-black/35'
              }`}
            >
              {done ? '✓' : i + 1}
            </span>
            <span className="max-w-[88px] truncate">{label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

function StepPanel({
  children,
  direction,
}: {
  children: React.ReactNode
  direction: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction * 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction * -24 }}
      transition={spring.natural}
      className="p-6"
    >
      {children}
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
