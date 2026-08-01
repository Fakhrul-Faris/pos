'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { fade } from '@/lib/motion'
import { AddServiceDrawer } from '@/components/AddServiceDrawer'
import { BookingDrawer } from '@/components/BookingDrawer'
import { BottomNavPill, type BottomNavTab } from '@/components/BottomNavPill'
import { CashierScreen } from '@/components/CashierScreen'
import { FloorView } from '@/components/FloorView'
import { LoginScreen } from '@/components/LoginScreen'
import { MoreSheet } from '@/components/MoreSheet'
import { MotionOverlay } from '@/components/motion/MotionOverlay'
import { NoShowConfirmModal } from '@/components/NoShowConfirmModal'
import { OfflineBanner } from '@/components/OfflineBanner'
import { PartyAssignDrawer } from '@/components/PartyAssignDrawer'
import { PartyCheckInDrawer } from '@/components/PartyCheckInDrawer'
import { ReceiptSuccessDrawer } from '@/components/ReceiptSuccessDrawer'
import { ReassignBarberDrawer } from '@/components/ReassignBarberDrawer'
import { SearchModal } from '@/components/SearchModal'
import { StatsDrawer } from '@/components/StatsDrawer'
import { Toast, type ToastState } from '@/components/Toast'
import { WalkInDrawer } from '@/components/WalkInDrawer'
import type { PaymentMethod } from '@/data/mock'
import { MANAGER_ACTING_ID, actingLabel } from '@/data/mock'
import { useStore } from '@/data/store'

type ReceiptState = {
  customer: string
  total: number
  method: PaymentMethod
  receiptUrl: string
  receiptRef: string
  paidAt: Date
}

export function PosApp() {
  const { loggedIn, logout, getBookingById, actingStaffId, isOnShift, staff } = useStore()
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [cashierBookingId, setCashierBookingId] = useState<string | null | undefined>(undefined)
  const [reassignId, setReassignId] = useState<string | null>(null)
  const [addServiceId, setAddServiceId] = useState<string | null>(null)
  const [noShowId, setNoShowId] = useState<string | null>(null)
  const [partyCheckInId, setPartyCheckInId] = useState<string | null>(null)
  const [partyAssignId, setPartyAssignId] = useState<string | null>(null)
  const [walkInOpen, setWalkInOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [endSessionOpen, setEndSessionOpen] = useState(false)
  const [boardView, setBoardView] = useState<'lanes' | 'timeline'>('lanes')
  const [receipt, setReceipt] = useState<ReceiptState | null>(null)
  const [toast, setToast] = useState<ToastState>({ open: false, kind: 'success', title: '' })

  const cashierOpen = cashierBookingId !== undefined
  const cashierBooking = cashierBookingId ? getBookingById(cashierBookingId) : null
  const actingIsBarber = actingStaffId !== MANAGER_ACTING_ID
  const clockedOut =
    loggedIn && actingIsBarber && !isOnShift(actingStaffId)
  const clockedOutName =
    staff.find((s) => s.id === actingStaffId)?.name ?? actingLabel(actingStaffId, staff)

  const hidePill =
    cashierOpen ||
    !!receipt ||
    !!noShowId ||
    endSessionOpen

  const navActive: BottomNavTab | null = moreOpen
    ? 'more'
    : cashierOpen
      ? 'cashier'
      : boardView === 'timeline'
        ? 'calendar'
        : 'today'

  const bookingProps = {
    bookingId: selectedBookingId,
    onClose: () => setSelectedBookingId(null),
    onToast: (t: { kind: 'success' | 'info' | 'error'; title: string; message?: string }) =>
      setToast({ open: true, ...t }),
    onOpenReassign: (id: string) => {
      setSelectedBookingId(null)
      setReassignId(id)
    },
    onOpenAddService: (id: string) => {
      setSelectedBookingId(null)
      setAddServiceId(id)
    },
    onOpenNoShow: (id: string) => setNoShowId(id),
    onOpenPartyCheckIn: (id: string) => {
      setSelectedBookingId(null)
      setPartyCheckInId(id)
    },
    onOpenPartyAssign: (id: string) => {
      setSelectedBookingId(null)
      setPartyAssignId(id)
    },
    onOpenPayment: (id: string) => {
      setSelectedBookingId(null)
      setCashierBookingId(id)
    },
  }

  return (
    <AnimatePresence mode="wait">
      {!loggedIn ? (
        <LoginScreen key="login" />
      ) : (
    <motion.div
      key="pos"
      className="pos-shell flex h-dvh flex-col overflow-hidden"
      data-acting-barber={actingStaffId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fade.soft}
    >
      <OfflineBanner />

      <MotionOverlay
        open={endSessionOpen}
        onClose={() => setEndSessionOpen(false)}
        variant="modal"
        zClass="z-[60]"
        backdropClassName="bg-carbon/30"
        panelClassName="w-full max-w-sm rounded-lg border border-fog bg-paper-white p-6 shadow-panel"
        aria-label="End session"
      >
        <h2 className="font-display text-lg font-medium tracking-ui text-carbon">End session?</h2>
        <p className="mt-2 text-sm text-graphite">
          You&apos;ll return to the login screen. Any unsynced changes stay queued until you&apos;re back
          online.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setEndSessionOpen(false)
              logout()
            }}
            className="btn-primary min-h-12 w-full px-4 py-3"
          >
            End session
          </button>
          <button
            type="button"
            onClick={() => setEndSessionOpen(false)}
            className="btn-ghost min-h-12 w-full px-4 py-3"
          >
            Keep working
          </button>
        </div>
      </MotionOverlay>

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-28 pt-3">
        <FloorView
          selectedBookingId={selectedBookingId}
          onSelectBooking={(id) => setSelectedBookingId(id)}
          onPromptNoShow={(id) => setNoShowId(id)}
          onToast={(t) => setToast({ open: true, ...t })}
          viewMode={boardView}
          onViewModeChange={setBoardView}
        />
        {clockedOut ? (
          <div
            className="absolute inset-x-3 bottom-28 top-3 z-20 flex items-center justify-center rounded-lg bg-[var(--pos-canvas-soft)]/95 px-6 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
          >
            <div className="max-w-sm text-center">
              <p className="text-[10px] font-semibold uppercase tracking-ui text-ash">Clocked out</p>
              <h2 className="font-display mt-2 text-2xl font-medium tracking-ui text-carbon">
                Shift ended
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-graphite">
                {clockedOutName} is off the floor. Tap the barber control and enter a PIN to clock
                in, or switch to someone already on shift.
              </p>
              <p className="mt-4 text-xs text-ash">
                Device logout is Manager-only (More → End session).
              </p>
            </div>
          </div>
        ) : null}
      </main>

      <BottomNavPill
        active={navActive}
        visible={!hidePill}
        onToday={() => {
          setMoreOpen(false)
          setBoardView('lanes')
        }}
        onWalkIn={() => {
          if (clockedOut) {
            setToast({
              open: true,
              kind: 'info',
              title: 'Clock in to continue',
              message: 'Start a shift from the barber switcher first.',
            })
            return
          }
          setMoreOpen(false)
          setWalkInOpen(true)
        }}
        onCashier={() => {
          if (clockedOut) {
            setToast({
              open: true,
              kind: 'info',
              title: 'Clock in to continue',
              message: 'Start a shift from the barber switcher first.',
            })
            return
          }
          setMoreOpen(false)
          setSelectedBookingId(null)
          setCashierBookingId(null)
        }}
        onCalendar={() => {
          setMoreOpen(false)
          setBoardView('timeline')
        }}
        onMore={() => setMoreOpen(true)}
      />

      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        onSearch={() => setSearchOpen(true)}
        onMyDay={() => setStatsOpen(true)}
        onEndSession={() => setEndSessionOpen(true)}
        onToast={(t) => setToast({ open: true, ...t })}
        onToggleOffline={(goingOffline, pendingCount) => {
          if (!goingOffline && pendingCount > 0) {
            setToast({
              open: true,
              kind: 'success',
              title: `Synced ${pendingCount} pending change${pendingCount === 1 ? '' : 's'}`,
            })
          }
        }}
      />

      <AnimatePresence>
        {selectedBookingId ? <BookingDrawer key="booking" variant="drawer" {...bookingProps} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {cashierOpen ? (
          <CashierScreen
            key="cashier"
            bookingId={cashierBookingId}
            onClose={() => setCashierBookingId(undefined)}
            onPickBooking={(id) => setCashierBookingId(id)}
            onAddItem={(id) => setAddServiceId(id)}
            onPaid={({ receiptUrl, total, method }) => {
              const customer =
                cashierBooking?.customer ?? getBookingById(cashierBookingId ?? '')?.customer ?? 'Customer'
              const receiptRef = receiptUrl.split('/').pop() ?? 'RCPT'
              setCashierBookingId(undefined)
              setReceipt({
                customer,
                total,
                method,
                receiptUrl,
                receiptRef,
                paidAt: new Date(),
              })
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {reassignId ? (
          <ReassignBarberDrawer
            key="reassign"
            bookingId={reassignId}
            onClose={() => setReassignId(null)}
            onReassigned={() => {
              setReassignId(null)
              setToast({ open: true, kind: 'success', title: 'Reassigned', message: 'Barber updated.' })
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {addServiceId ? (
          <AddServiceDrawer
            key="add-service"
            bookingId={addServiceId}
            elevated={cashierOpen}
            onClose={() => setAddServiceId(null)}
            onSaved={(hasWarning) => {
              const id = addServiceId
              const fromCashier = cashierOpen
              setAddServiceId(null)
              setToast({
                open: true,
                kind: hasWarning ? 'info' : 'success',
                title: 'Added to bill',
                message: hasWarning ? 'Check overlap warning on booking.' : undefined,
              })
              if (id && !fromCashier) setSelectedBookingId(id)
            }}
          />
        ) : null}
      </AnimatePresence>

      <NoShowConfirmModal
        bookingId={noShowId}
        onClose={() => setNoShowId(null)}
        onConfirmed={() => {
          setNoShowId(null)
          setSelectedBookingId(null)
          setToast({ open: true, kind: 'info', title: 'Marked no-show', message: 'Slot freed.' })
        }}
        onArrived={() => {
          const id = noShowId
          setNoShowId(null)
          if (id) setSelectedBookingId(id)
        }}
      />

      <AnimatePresence>
        {partyCheckInId ? (
          <PartyCheckInDrawer
            key="party-checkin"
            bookingId={partyCheckInId}
            onClose={() => setPartyCheckInId(null)}
            onConfirmed={() => {
              const id = partyCheckInId
              setPartyCheckInId(null)
              if (id) {
                setPartyAssignId(id)
                setToast({
                  open: true,
                  kind: 'success',
                  title: 'Party checked in',
                  message: 'Assign chairs next.',
                })
              }
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {partyAssignId ? (
          <PartyAssignDrawer
            key="party-assign"
            bookingId={partyAssignId}
            onClose={() => setPartyAssignId(null)}
            onReadyForPayment={() => {
              const id = partyAssignId
              setPartyAssignId(null)
              if (id) setCashierBookingId(id)
            }}
          />
        ) : null}
      </AnimatePresence>

      <ReceiptSuccessDrawer
        open={!!receipt}
        customer={receipt?.customer ?? ''}
        total={receipt?.total ?? 0}
        method={receipt?.method ?? 'cash'}
        receiptUrl={receipt?.receiptUrl ?? ''}
        receiptRef={receipt?.receiptRef ?? ''}
        paidAt={receipt?.paidAt ?? new Date()}
        onNewWalkIn={() => {
          setReceipt(null)
          setWalkInOpen(true)
        }}
        onDone={() => setReceipt(null)}
      />

      <WalkInDrawer
        open={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        onCreated={(id) => {
          setWalkInOpen(false)
          setSelectedBookingId(id)
          setToast({ open: true, kind: 'success', title: 'Added walk-in', message: 'Ticket checked in.' })
        }}
      />

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectBooking={(id) => setSelectedBookingId(id)}
      />

      <StatsDrawer open={statsOpen} onClose={() => setStatsOpen(false)} />

      <Toast toast={toast} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </motion.div>
      )}
    </AnimatePresence>
  )
}
