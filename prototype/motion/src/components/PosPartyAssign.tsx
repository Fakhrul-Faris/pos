import { useEffect, useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import { MorphButton } from './MorphButton'
import { NumberFlowField } from './NumberFlowField'
import { ReceiptPrinterView, fireConfetti, type ReceiptLine } from './ReceiptPrinter'
import { spring } from '@/motion/springs'

type BarberId = 'ali' | 'siti' | 'ben'
type MemberStatus = 'expected' | 'waiting' | 'in_chair' | 'done' | 'no_show'
type Screen = 'board' | 'payment' | 'receipt'
type PaymentMethod = 'cash' | 'duitnow'

type PartyMember = {
  id: string
  name: string
  services: string
  amount: number
  barberId: BarberId
  status: MemberStatus
}

type BookingStatus = 'booked' | 'arrived' | 'in_service' | 'completed' | 'paid'

const BARBERS: {
  id: BarberId
  name: string
  initials: string
  busy?: boolean
  busyLabel?: string
}[] = [
  { id: 'ali', name: 'Ali', initials: 'A', busy: true, busyLabel: 'Finishing #40' },
  { id: 'siti', name: 'Siti', initials: 'S', busy: false },
  { id: 'ben', name: 'Ben', initials: 'B', busy: false },
]

const BOOKED_PARTY_SIZE = 3

const INITIAL_MEMBERS: PartyMember[] = [
  { id: 'm1', name: 'Abu', services: 'Haircut', amount: 35, barberId: 'ali', status: 'expected' },
  {
    id: 'm2',
    name: 'Asif',
    services: 'Haircut + Beard',
    amount: 55,
    barberId: 'ali',
    status: 'expected',
  },
  {
    id: 'm3',
    name: 'Guest 3',
    services: 'Haircut',
    amount: 35,
    barberId: 'ali',
    status: 'expected',
  },
]

const OTHER_BOOKINGS = [
  {
    id: 43,
    name: 'Walk-in Lee',
    time: '3:00 PM',
    status: 'Arrived',
    color: '#F5A623',
    barber: 'Siti',
  },
  { id: 44, name: 'Hassan K.', time: '3:30 PM', status: 'Booked', color: '#5B8DEF', barber: 'Ali' },
]

const STATUS_COLOR: Record<BookingStatus, string> = {
  booked: '#5B8DEF',
  arrived: '#F5A623',
  in_service: '#9B59B6',
  completed: '#38CE87',
  paid: '#14832B',
}

function barberName(id: BarberId) {
  return BARBERS.find((b) => b.id === id)?.name ?? id
}

function barberHasActiveCut(members: PartyMember[], barberId: BarberId) {
  return members.some((m) => m.barberId === barberId && m.status === 'in_chair')
}

function canStartCut(member: PartyMember, members: PartyMember[], aliBusy: boolean) {
  if (member.status !== 'waiting') return false
  if (member.barberId === 'ali' && aliBusy) return false
  if (barberHasActiveCut(members, member.barberId)) return false
  return true
}

function cloneMembers() {
  return INITIAL_MEMBERS.map((m) => ({ ...m }))
}

function activeMembers(members: PartyMember[]) {
  return members.filter((m) => m.status !== 'no_show' && m.status !== 'expected')
}

function presentOrExpected(members: PartyMember[]) {
  return members.filter((m) => m.status !== 'no_show')
}

export function PosPartyAssign() {
  const [screen, setScreen] = useState<Screen>('board')
  const [expanded, setExpanded] = useState(true)
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>('booked')
  const [members, setMembers] = useState<PartyMember[]>(cloneMembers)
  const [assignHint, setAssignHint] = useState(false)
  const [paymentTotal, setPaymentTotal] = useState<number | undefined>(125)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [receiptPhase, setReceiptPhase] = useState<'printing' | 'done'>('printing')
  const [aliBusy, setAliBusy] = useState(true)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [checkInDraft, setCheckInDraft] = useState<Record<string, boolean>>({})

  const active = activeMembers(members)
  const plannedTotal = active.reduce((a, m) => a + m.amount, 0)
  const bookedTotal = members.reduce((a, m) => a + m.amount, 0)
  const arrived = bookingStatus !== 'booked'
  const noShowCount = members.filter((m) => m.status === 'no_show').length
  const checkedInCount = members.filter((m) =>
    ['waiting', 'in_chair', 'done'].includes(m.status),
  ).length
  const splitCount = new Set(active.map((m) => m.barberId)).size
  const inChairCount = active.filter((m) => m.status === 'in_chair').length
  const waitingCount = active.filter((m) => m.status === 'waiting').length
  const allDone = active.length > 0 && active.every((m) => m.status === 'done')
  const doneCount = active.filter((m) => m.status === 'done').length

  useEffect(() => {
    setPaymentTotal(plannedTotal)
  }, [plannedTotal])

  function assignBarber(memberId: string, barberId: BarberId) {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, barberId } : m)))
    setAssignHint(true)
  }

  function openCheckIn() {
    setCheckInDraft(Object.fromEntries(members.map((m) => [m.id, true])))
    setCheckInOpen(true)
  }

  function confirmCheckIn() {
    const presentCount = Object.values(checkInDraft).filter(Boolean).length
    if (presentCount === 0) return

    setMembers((prev) =>
      prev.map((m) => ({
        ...m,
        status: checkInDraft[m.id] ? ('waiting' as const) : ('no_show' as const),
      })),
    )
    setBookingStatus('arrived')
    setCheckInOpen(false)
  }

  function markMemberNoShow(memberId: string) {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId && m.status === 'waiting' ? { ...m, status: 'no_show' as const } : m,
      ),
    )
  }

  function startCut(memberId: string) {
    const member = members.find((m) => m.id === memberId)
    if (!member || !canStartCut(member, members, aliBusy)) return

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, status: 'in_chair' as const } : m)),
    )
    setBookingStatus('in_service')
    if (member.barberId === 'ali') setAliBusy(false)
  }

  function completeCut(memberId: string) {
    const member = members.find((m) => m.id === memberId)
    if (!member || member.status !== 'in_chair') return

    setMembers((prev) => {
      const next = prev.map((m) =>
        m.id === memberId ? { ...m, status: 'done' as const } : m,
      )
      if (next.every((m) => m.status === 'done' || m.status === 'no_show')) setBookingStatus('completed')
      else if (!next.some((m) => m.status === 'in_chair')) setBookingStatus('arrived')
      return next
    })
  }

  function startAllReady() {
    setMembers((prev) => {
      let nextAliBusy = aliBusy
      const occupied = new Set(
        prev.filter((m) => m.status === 'in_chair').map((m) => m.barberId),
      )

      const next = prev.map((m) => {
        if (m.status !== 'waiting') return m
        if (m.barberId === 'ali' && nextAliBusy) return m
        if (occupied.has(m.barberId)) return m
        occupied.add(m.barberId)
        if (m.barberId === 'ali') nextAliBusy = false
        return { ...m, status: 'in_chair' as const }
      })

      if (next.some((m) => m.status === 'in_chair')) setBookingStatus('in_service')
      if (!nextAliBusy) setAliBusy(false)
      return next
    })
  }

  function openPayment() {
    setScreen('payment')
  }

  async function handlePay() {
    setScreen('receipt')
    setReceiptPhase('printing')
    window.setTimeout(() => {
      setReceiptPhase('done')
      setBookingStatus('paid')
      fireConfetti()
    }, 900)
  }

  function resetDemo() {
    setScreen('board')
    setBookingStatus('booked')
    setMembers(cloneMembers())
    setAssignHint(false)
    setExpanded(true)
    setPaymentTotal(125)
    setPaymentMethod('cash')
    setReceiptPhase('printing')
    setAliBusy(true)
    setCheckInOpen(false)
    setCheckInDraft({})
  }

  const receiptMembers = arrived ? active : presentOrExpected(members)
  const receiptLines: ReceiptLine[] = [
    ...receiptMembers.map((m) => ({
      label: `${m.name} · ${m.services}`,
      value: `RM ${m.amount.toFixed(2)}`,
    })),
    {
      label: 'Total',
      value: `RM ${(paymentTotal ?? plannedTotal).toFixed(2)}`,
      bold: true,
    },
  ]

  const cardStatus: BookingStatus =
    bookingStatus === 'paid'
      ? 'paid'
      : bookingStatus === 'completed'
        ? 'completed'
        : bookingStatus === 'in_service'
          ? 'in_service'
          : arrived
            ? 'arrived'
            : 'booked'

  const statusLabel =
    cardStatus === 'paid'
      ? 'Paid'
      : cardStatus === 'completed'
        ? 'Ready to pay'
        : cardStatus === 'in_service'
          ? inChairCount > 1
            ? `${inChairCount} in chair`
            : 'In chair'
          : cardStatus === 'arrived'
            ? noShowCount > 0
              ? `${checkedInCount} of ${BOOKED_PARTY_SIZE} arrived`
              : doneCount > 0
                ? `${doneCount}/${active.length} done`
                : 'Arrived'
            : 'Booked'

  const readyToStartCount = active.filter((m) => canStartCut(m, active, aliBusy)).length

  return (
    <div className="mx-auto w-full max-w-2xl">
      <AnimatePresence mode="wait">
        {screen === 'board' && (
          <motion.div
            key="board"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={spring.natural}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-black/40">
                  P-06 → P-07 · party checkout
                </p>
                <p className="mt-0.5 text-sm text-black/45">
                  Assign chairs · parallel cuts · partial check-in supported
                </p>
              </div>
              <div className="flex items-center gap-2">
                {BARBERS.map((b) => (
                  <div
                    key={b.id}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                      b.id === 'ali' ? 'ring-2 ring-[#38CE87] ring-offset-2' : 'opacity-70'
                    } ${
                      b.id === 'ali' && aliBusy
                        ? 'bg-[#F5A623] text-white'
                        : 'bg-[#1C1C1C] text-white'
                    }`}
                    title={b.id === 'ali' && aliBusy ? 'Finishing #40' : b.name}
                  >
                    {b.initials}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-2">
              <PartyBookingCard
                expanded={expanded}
                onToggle={() => setExpanded((v) => !v)}
                cardStatus={cardStatus}
                statusLabel={statusLabel}
                members={members}
                active={active}
                bookedPartySize={BOOKED_PARTY_SIZE}
                bookedTotal={bookedTotal}
                total={plannedTotal}
                arrived={arrived}
                checkInOpen={checkInOpen}
                checkInDraft={checkInDraft}
                noShowCount={noShowCount}
                checkedInCount={checkedInCount}
                assignHint={assignHint}
                splitCount={splitCount}
                inChairCount={inChairCount}
                waitingCount={waitingCount}
                allDone={allDone}
                doneCount={doneCount}
                aliBusy={aliBusy}
                readyToStartCount={readyToStartCount}
                onOpenCheckIn={openCheckIn}
                onCheckInDraftChange={setCheckInDraft}
                onConfirmCheckIn={confirmCheckIn}
                onCancelCheckIn={() => setCheckInOpen(false)}
                onMarkNoShow={markMemberNoShow}
                onAssign={assignBarber}
                onStartCut={startCut}
                onCompleteCut={completeCut}
                onStartAllReady={startAllReady}
                onCollectPayment={openPayment}
              />

              {OTHER_BOOKINGS.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white p-4 opacity-60"
                >
                  <span
                    className="h-10 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: b.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1C1C1C]">
                      #{b.id} {b.name}
                    </p>
                    <p className="text-xs text-black/45">
                      {b.time} · {b.barber}
                    </p>
                  </div>
                  <span className="text-xs font-medium" style={{ color: b.color }}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>

            <LayoutGroup id="chairs">
              <div className="rounded-2xl border border-black/[0.06] bg-[#F9F9F8] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-black/35">
                    Live chair view
                  </p>
                  <div className="flex gap-2 text-xs">
                    {inChairCount > 0 && (
                      <span className="text-[#9B59B6]">{inChairCount} cutting</span>
                    )}
                    {doneCount > 0 && (
                      <span className="text-[#1A7A4C]">
                        {doneCount}/{active.length} done
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {BARBERS.map((barber) => {
                    const assigned = active.filter((m) => m.barberId === barber.id)
                    const isAliBusy = barber.id === 'ali' && aliBusy
                    return (
                      <div
                        key={barber.id}
                        className="min-h-[128px] rounded-xl border border-black/[0.06] bg-white p-3"
                      >
                        <div className="mb-2 flex items-center justify-between gap-1">
                          <span className="text-sm font-semibold text-[#1C1C1C]">{barber.name}</span>
                          {isAliBusy && (
                            <span className="rounded-full bg-[#F5A623]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#B8750A]">
                              Busy
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <AnimatePresence mode="popLayout">
                            {assigned.length === 0 ? (
                              <motion.p
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.4 }}
                                exit={{ opacity: 0 }}
                                className="text-xs text-black/40"
                              >
                                —
                              </motion.p>
                            ) : (
                              assigned.map((m) => (
                                <MemberChip key={m.id} member={m} />
                              ))
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </LayoutGroup>

            <button
              type="button"
              onClick={resetDemo}
              className="mt-4 w-full text-center text-sm text-black/40"
            >
              Reset demo
            </button>
          </motion.div>
        )}

        {screen === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={spring.natural}
          >
            <button
              type="button"
              onClick={() => setScreen('board')}
              className="mb-4 text-sm text-[#1A7A4C]"
            >
              ← Back to board
            </button>

            <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
              <p className="text-sm text-black/50">
                Booking #42 · Ahmad R. ·{' '}
                {active.length < BOOKED_PARTY_SIZE
                  ? `${active.length} of ${BOOKED_PARTY_SIZE} arrived`
                  : `Party of ${active.length}`}
              </p>
              <h2 className="mt-1 font-[Instrument_Sans] text-2xl font-bold text-[#1C1C1C]">
                Collect payment
              </h2>
              <p className="mt-1 text-xs text-black/40">One bill · all chairs · actual services</p>

              <ul className="mt-6 space-y-2">
                {active.map((m, i) => (
                  <motion.li
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.natural, delay: i * 0.05 }}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span className="text-[#1C1C1C]">
                      {m.name}
                      <span className="ml-1 text-black/40">· {barberName(m.barberId)}</span>
                    </span>
                    <span className="shrink-0 font-medium">RM {m.amount}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-4 border-t border-black/[0.08] pt-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-black/35">
                  Total · tap to edit
                </p>
                <div className="flex justify-center py-2">
                  <NumberFlowField
                    value={paymentTotal}
                    onChange={setPaymentTotal}
                    prefix="RM"
                    decimalScale={0}
                    maxLength={4}
                    size="lg"
                    aria-label="Payment total"
                  />
                </div>
              </div>

              <p className="mb-3 mt-4 text-xs font-medium uppercase tracking-wide text-black/35">
                Payment method · Phase 1A
              </p>
              <div className="mb-6 flex gap-2">
                {(
                  [
                    { id: 'cash' as const, label: 'Cash' },
                    { id: 'duitnow' as const, label: 'Own DuitNow' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex-1 rounded-xl py-3 text-sm font-semibold transition ${
                      paymentMethod === m.id
                        ? 'bg-[#1C1C1C] text-white'
                        : 'bg-black/[0.04] text-[#1C1C1C]/70'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="flex justify-center">
                <MorphButton
                  idleLabel={`Pay RM ${paymentTotal ?? plannedTotal} · ${paymentMethod === 'cash' ? 'Cash' : 'DuitNow'}`}
                  loadingLabel="Recording…"
                  successLabel="Paid!"
                  onAction={handlePay}
                />
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'receipt' && (
          <motion.div
            key="receipt"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring.natural}
            className="py-4"
          >
            <ReceiptPrinterView
              lines={receiptLines}
              bookingLabel="#42"
              phase={receiptPhase}
            />
            {receiptPhase === 'done' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring.natural}
                className="mt-6 flex justify-center gap-3"
              >
                <button
                  type="button"
                  onClick={resetDemo}
                  className="rounded-xl bg-black/[0.06] px-6 py-3 text-sm font-medium text-[#1C1C1C]/70"
                >
                  New walk-in
                </button>
                <button
                  type="button"
                  onClick={resetDemo}
                  className="rounded-xl bg-[#38CE87] px-6 py-3 text-sm font-semibold text-[#1C1C1C]"
                >
                  Back to board
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MemberChip({ member }: { member: PartyMember }) {
  const styles =
    member.status === 'in_chair'
      ? 'border-[#9B59B6]/40 bg-[#9B59B6]/12'
      : member.status === 'done'
        ? 'border-black/[0.08] bg-black/[0.03] opacity-60'
        : 'border-[#38CE87]/25 bg-[#38CE87]/10'

  return (
    <motion.div
      layout
      layoutId={`member-${member.id}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={spring.natural}
      className={`rounded-lg border px-2 py-1.5 ${styles}`}
    >
      <div className="flex items-center justify-between gap-1">
        <p className="truncate text-xs font-semibold text-[#1C1C1C]">{member.name}</p>
        {member.status === 'in_chair' && (
          <span className="text-[9px] font-bold uppercase text-[#9B59B6]">Cut</span>
        )}
        {member.status === 'done' && <span className="text-[10px] text-[#14832B]">✓</span>}
      </div>
      <p className="truncate text-[10px] text-black/45">#{42} · {member.services}</p>
    </motion.div>
  )
}

function PartyBookingCard({
  expanded,
  onToggle,
  cardStatus,
  statusLabel,
  members,
  active,
  bookedPartySize,
  bookedTotal,
  total,
  arrived,
  checkInOpen,
  checkInDraft,
  noShowCount,
  checkedInCount,
  assignHint,
  splitCount,
  inChairCount,
  waitingCount,
  allDone,
  doneCount,
  aliBusy,
  readyToStartCount,
  onOpenCheckIn,
  onCheckInDraftChange,
  onConfirmCheckIn,
  onCancelCheckIn,
  onMarkNoShow,
  onAssign,
  onStartCut,
  onCompleteCut,
  onStartAllReady,
  onCollectPayment,
}: {
  expanded: boolean
  onToggle: () => void
  cardStatus: BookingStatus
  statusLabel: string
  members: PartyMember[]
  active: PartyMember[]
  bookedPartySize: number
  bookedTotal: number
  total: number
  arrived: boolean
  checkInOpen: boolean
  checkInDraft: Record<string, boolean>
  noShowCount: number
  checkedInCount: number
  assignHint: boolean
  splitCount: number
  inChairCount: number
  waitingCount: number
  allDone: boolean
  doneCount: number
  aliBusy: boolean
  readyToStartCount: number
  onOpenCheckIn: () => void
  onCheckInDraftChange: (draft: Record<string, boolean>) => void
  onConfirmCheckIn: () => void
  onCancelCheckIn: () => void
  onMarkNoShow: (memberId: string) => void
  onAssign: (memberId: string, barberId: BarberId) => void
  onStartCut: (memberId: string) => void
  onCompleteCut: (memberId: string) => void
  onStartAllReady: () => void
  onCollectPayment: () => void
}) {
  const statusColor = STATUS_COLOR[cardStatus]
  const noShowMembers = members.filter((m) => m.status === 'no_show')

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-xl border bg-white shadow-sm"
      style={{ borderColor: expanded ? '#38CE8766' : 'rgba(0,0,0,0.06)' }}
      transition={spring.natural}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: statusColor }} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#1C1C1C]">
            #42 Ahmad R.
            <span className="ml-2 rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] font-medium text-black/50">
              Party · {arrived ? `${checkedInCount} of ${bookedPartySize}` : bookedPartySize}
            </span>
          </p>
          <p className="text-xs text-black/45">
            2:30 PM · RM {arrived ? total : bookedTotal}
            {noShowCount > 0 && (
              <span className="text-black/35"> · {noShowCount} no-show</span>
            )}
            {splitCount > 1 && <span className="text-[#1A7A4C]"> · {splitCount} chairs</span>}
            {doneCount > 0 && <span className="text-black/35"> · {doneCount} done</span>}
            {inChairCount > 0 && (
              <span className="text-[#9B59B6]"> · {inChairCount} cutting</span>
            )}
          </p>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={spring.snappy}
          className="text-black/30"
        >
          ▾
        </motion.span>
        <span className="text-xs font-medium" style={{ color: statusColor }}>
          {statusLabel}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring.natural}
            className="overflow-hidden"
          >
            <div className="border-t border-black/[0.06] px-4 pb-4 pt-3">
              {aliBusy && arrived && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-xl border border-[#F5A623]/30 bg-[#F5A623]/10 px-3 py-2.5 text-xs text-[#8A5A00]"
                >
                  Ali still finishing <strong>#40</strong> — assign free chairs to keep the party
                  moving
                </motion.div>
              )}

              <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-black/35">Contact</p>
                  <p className="font-medium text-[#1C1C1C]">Ahmad R.</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-black/35">Phone</p>
                  <p className="font-medium text-[#1A7A4C]">+60 12-345 6789</p>
                </div>
              </div>

              {!arrived && checkInOpen && (
                <CheckInPanel
                  members={members}
                  draft={checkInDraft}
                  bookedPartySize={bookedPartySize}
                  onDraftChange={onCheckInDraftChange}
                  onConfirm={onConfirmCheckIn}
                  onCancel={onCancelCheckIn}
                />
              )}

              {arrived && (
                <>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-black/35">
                Party · assign chairs
              </p>
              <div className="mb-4 space-y-2">
                {active.map((member, i) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...spring.natural, delay: i * 0.05 }}
                    className="rounded-xl border border-black/[0.06] bg-[#F9F9F8] p-3"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#1C1C1C]">{member.name}</p>
                        <p className="text-xs text-black/45">
                          {member.services} · RM {member.amount}
                        </p>
                      </div>
                      <MemberStatusBadge status={member.status} />
                    </div>
                    <div className="flex gap-1.5">
                      {BARBERS.map((barber) => {
                        const selected = member.barberId === barber.id
                        const suggestFree = barber.id !== 'ali' && !aliBusy && !assignHint
                        const locked = member.status !== 'waiting'
                        const barberOccupied =
                          member.status === 'waiting' &&
                          barberHasActiveCut(active, barber.id)
                        return (
                          <motion.button
                            key={barber.id}
                            type="button"
                            disabled={locked}
                            onClick={() => onAssign(member.id, barber.id)}
                            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                              selected
                                ? 'bg-[#38CE87] text-[#1C1C1C]'
                                : suggestFree
                                  ? 'bg-white text-[#1C1C1C] ring-1 ring-[#38CE87]/40'
                                  : 'bg-white text-[#1C1C1C]/60 ring-1 ring-black/[0.08]'
                            } ${barberOccupied && selected ? 'ring-1 ring-[#9B59B6]/40' : ''}`}
                            whileTap={!locked ? { scale: 0.96 } : undefined}
                            transition={spring.snappy}
                          >
                            {barber.name}
                          </motion.button>
                        )
                      })}
                    </div>
                    <MemberCutAction
                      member={member}
                      members={active}
                      aliBusy={aliBusy}
                      onStart={() => onStartCut(member.id)}
                      onComplete={() => onCompleteCut(member.id)}
                    />
                    {member.status === 'waiting' && (
                      <button
                        type="button"
                        onClick={() => onMarkNoShow(member.id)}
                        className="mt-2 w-full text-center text-[10px] font-medium text-black/35 underline-offset-2 hover:text-black/55 hover:underline"
                      >
                        Mark no-show
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>

              {noShowMembers.length > 0 && (
                <div className="mb-4 rounded-xl border border-black/[0.06] bg-black/[0.02] p-3">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-black/35">
                    No-show · not charged
                  </p>
                  {noShowMembers.map((m) => (
                    <p key={m.id} className="text-xs text-black/40 line-through">
                      {m.name} · {m.services} · RM {m.amount}
                    </p>
                  ))}
                  <p className="mt-2 text-[10px] text-black/35">
                    Slot time freed on calendar · still one #42 for the party
                  </p>
                </div>
              )}
                </>
              )}

              <ActionButtons
                arrived={arrived}
                checkInOpen={checkInOpen}
                allDone={allDone}
                total={total}
                inChairCount={inChairCount}
                waitingCount={waitingCount}
                readyToStartCount={readyToStartCount}
                onOpenCheckIn={onOpenCheckIn}
                onStartAllReady={onStartAllReady}
                onCollectPayment={onCollectPayment}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function CheckInPanel({
  members,
  draft,
  bookedPartySize,
  onDraftChange,
  onConfirm,
  onCancel,
}: {
  members: PartyMember[]
  draft: Record<string, boolean>
  bookedPartySize: number
  onDraftChange: (draft: Record<string, boolean>) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const presentCount = Object.values(draft).filter(Boolean).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.natural}
      className="mb-4 rounded-xl border border-[#F5A623]/30 bg-[#F5A623]/8 p-4"
    >
      <p className="text-sm font-semibold text-[#1C1C1C]">Who arrived?</p>
      <p className="mt-0.5 text-xs text-black/45">
        Booked {bookedPartySize} · toggle anyone who didn&apos;t show · still #42
      </p>

      <div className="mt-4 space-y-2">
        {members.map((member) => {
          const present = draft[member.id] ?? true
          return (
            <div
              key={member.id}
              className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                present ? 'border-black/[0.06] bg-white' : 'border-black/[0.04] bg-black/[0.02]'
              }`}
            >
              <div className={present ? '' : 'opacity-50'}>
                <p className="text-sm font-medium text-[#1C1C1C]">{member.name}</p>
                <p className="text-xs text-black/45">
                  {member.services} · RM {member.amount}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => onDraftChange({ ...draft, [member.id]: true })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    present
                      ? 'bg-[#38CE87] text-[#1C1C1C]'
                      : 'bg-black/[0.04] text-black/45'
                  }`}
                >
                  Here
                </button>
                <button
                  type="button"
                  onClick={() => onDraftChange({ ...draft, [member.id]: false })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    !present
                      ? 'bg-black/[0.12] text-[#1C1C1C]'
                      : 'bg-black/[0.04] text-black/45'
                  }`}
                >
                  No-show
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-black/[0.08] py-3 text-sm font-medium text-black/50"
        >
          Cancel
        </button>
        <motion.button
          type="button"
          disabled={presentCount === 0}
          onClick={onConfirm}
          className="flex-[2] rounded-xl bg-[#F5A623] py-3 text-sm font-semibold text-white disabled:opacity-40"
          whileTap={{ scale: 0.98 }}
          transition={spring.snappy}
        >
          Check in {presentCount} of {bookedPartySize} · #42
        </motion.button>
      </div>
    </motion.div>
  )
}

function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const map: Record<MemberStatus, { label: string; color: string }> = {
    expected: { label: 'Expected', color: '#5B8DEF' },
    waiting: { label: 'Waiting', color: '#5B8DEF' },
    in_chair: { label: 'In chair', color: '#9B59B6' },
    done: { label: 'Done', color: '#14832B' },
    no_show: { label: 'No-show', color: '#888888' },
  }
  const { label, color } = map[status]
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {label}
    </span>
  )
}

function MemberCutAction({
  member,
  members,
  aliBusy,
  onStart,
  onComplete,
}: {
  member: PartyMember
  members: PartyMember[]
  aliBusy: boolean
  onStart: () => void
  onComplete: () => void
}) {
  if (member.status === 'no_show' || member.status === 'expected' || member.status === 'done') {
    return null
  }

  if (member.status === 'in_chair') {
    return (
      <motion.button
        type="button"
        onClick={onComplete}
        className="mt-2 w-full rounded-lg bg-[#9B59B6] py-2 text-xs font-semibold text-white"
        whileTap={{ scale: 0.97 }}
        transition={spring.snappy}
      >
        Complete · {member.name} ({barberName(member.barberId)})
      </motion.button>
    )
  }

  const canStart = canStartCut(member, members, aliBusy)
  const reason =
    member.barberId === 'ali' && aliBusy
      ? 'Ali finishing #40'
      : barberHasActiveCut(members, member.barberId)
        ? `${barberName(member.barberId)} busy`
        : null

  return (
    <motion.button
      type="button"
      onClick={onStart}
      disabled={!canStart}
      className="mt-2 w-full rounded-lg bg-[#1C1C1C] py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-black/20 disabled:text-black/35"
      whileTap={canStart ? { scale: 0.97 } : undefined}
      transition={spring.snappy}
    >
      {canStart
        ? `Start cut · ${member.name} with ${barberName(member.barberId)}`
        : `Start cut · ${member.name}${reason ? ` (${reason})` : ''}`}
    </motion.button>
  )
}

function ActionButtons({
  arrived,
  checkInOpen,
  allDone,
  total,
  inChairCount,
  waitingCount,
  readyToStartCount,
  onOpenCheckIn,
  onStartAllReady,
  onCollectPayment,
}: {
  arrived: boolean
  checkInOpen: boolean
  allDone: boolean
  total: number
  inChairCount: number
  waitingCount: number
  readyToStartCount: number
  onOpenCheckIn: () => void
  onStartAllReady: () => void
  onCollectPayment: () => void
}) {
  if (!arrived && !checkInOpen) {
    return (
      <motion.button
        type="button"
        onClick={onOpenCheckIn}
        className="w-full rounded-xl bg-[#F5A623] py-3 text-sm font-semibold text-white"
        whileTap={{ scale: 0.98 }}
        transition={spring.snappy}
      >
        Check in party · #42
      </motion.button>
    )
  }

  if (!arrived && checkInOpen) {
    return null
  }

  if (allDone) {
    return (
      <div className="space-y-2">
        <p className="text-center text-xs text-[#14832B]">✓ All cuts complete · one payment</p>
        <motion.button
          type="button"
          onClick={onCollectPayment}
          className="w-full rounded-xl bg-[#38CE87] py-3.5 text-sm font-semibold text-[#1C1C1C]"
          whileTap={{ scale: 0.98 }}
          transition={spring.snappy}
        >
          Collect payment · RM {total}
        </motion.button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {inChairCount > 0 && (
        <p className="text-center text-xs text-[#9B59B6]">
          {inChairCount} cutting in parallel
          {waitingCount > 0 ? ` · ${waitingCount} waiting` : ''}
        </p>
      )}
      {readyToStartCount > 1 && (
        <motion.button
          type="button"
          onClick={onStartAllReady}
          className="w-full rounded-xl border border-[#38CE87]/40 bg-[#38CE87]/10 py-2.5 text-sm font-semibold text-[#1A7A4C]"
          whileTap={{ scale: 0.98 }}
          transition={spring.snappy}
        >
          Start all ready ({readyToStartCount}) · parallel
        </motion.button>
      )}
      {inChairCount === 0 && readyToStartCount === 0 && (
        <p className="text-center text-xs text-black/40">
          Assign chairs, then start each cut — Siti & Ben can go while Ali finishes #40
        </p>
      )}
    </div>
  )
}
