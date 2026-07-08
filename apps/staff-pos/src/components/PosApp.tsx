'use client'

import { useState } from 'react'
import { AddServiceDrawer } from '@/components/AddServiceDrawer'
import { BarberSwitcher } from '@/components/BarberSwitcher'
import { BookingDrawer } from '@/components/BookingDrawer'
import { FloorView } from '@/components/FloorView'
import { LoginScreen } from '@/components/LoginScreen'
import { NoShowConfirmModal } from '@/components/NoShowConfirmModal'
import { OfflineBanner } from '@/components/OfflineBanner'
import { PartyAssignDrawer } from '@/components/PartyAssignDrawer'
import { PartyCheckInDrawer } from '@/components/PartyCheckInDrawer'
import { PaymentDrawer } from '@/components/PaymentDrawer'
import { PrototypeControls } from '@/components/PrototypeControls'
import { ReceiptSuccessDrawer } from '@/components/ReceiptSuccessDrawer'
import { ReassignBarberDrawer } from '@/components/ReassignBarberDrawer'
import { SearchModal } from '@/components/SearchModal'
import { StatsDrawer } from '@/components/StatsDrawer'
import { Toast, type ToastState } from '@/components/Toast'
import { WalkInDrawer } from '@/components/WalkInDrawer'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { PaymentMethod } from '@/data/mock'
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
  const { loggedIn, logout, getBookingById, setOffline, isOffline, pendingSyncCount } = useStore()
  const isWide = useMediaQuery('(min-width: 1024px)')
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [paymentBookingId, setPaymentBookingId] = useState<string | null>(null)
  const [reassignId, setReassignId] = useState<string | null>(null)
  const [addServiceId, setAddServiceId] = useState<string | null>(null)
  const [noShowId, setNoShowId] = useState<string | null>(null)
  const [partyCheckInId, setPartyCheckInId] = useState<string | null>(null)
  const [partyAssignId, setPartyAssignId] = useState<string | null>(null)
  const [walkInOpen, setWalkInOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [endSessionOpen, setEndSessionOpen] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptState | null>(null)
  const [toast, setToast] = useState<ToastState>({ open: false, kind: 'success', title: '' })

  if (!loggedIn) return <LoginScreen />

  const paymentBooking = paymentBookingId ? getBookingById(paymentBookingId) : null

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
      setPaymentBookingId(id)
    },
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-linen">
      <OfflineBanner />

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-fog bg-paper-white px-5 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-ui text-ash">Staff POS · Hafiz Cuts</p>
          <h1 className="font-display mt-0.5 text-lg font-medium tracking-ui text-carbon">Today</h1>
          <button
            type="button"
            onClick={() => setEndSessionOpen(true)}
            className="mt-2 min-h-10 text-xs text-ash transition-colors hover:text-ember"
          >
            End session
          </button>
        </div>
        <BarberSwitcher
          onActingChange={(name) =>
            setToast({ open: true, kind: 'info', title: `Now acting as ${name}` })
          }
        />
        <div className="flex items-center gap-2">
          <PrototypeControls />
          <button
            type="button"
            onClick={() => {
              if (isOffline && pendingSyncCount > 0) {
                setToast({
                  open: true,
                  kind: 'success',
                  title: `Synced ${pendingSyncCount} pending change${pendingSyncCount === 1 ? '' : 's'}`,
                })
              }
              setOffline(!isOffline)
            }}
            className={`min-h-12 rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
              isOffline
                ? 'border-amber/40 bg-[#fff4e0] text-carbon'
                : 'border-fog bg-paper-white text-graphite hover:bg-mist'
            }`}
            title="Toggle offline mode"
          >
            {isOffline ? 'Offline' : 'Online'}
          </button>
          <button type="button" onClick={() => setStatsOpen(true)} className="btn-ghost min-h-12 px-4 py-2">
            My day
          </button>
          <button type="button" onClick={() => setSearchOpen(true)} className="btn-ghost min-h-12 px-4 py-2">
            Search
          </button>
          <button type="button" onClick={() => setWalkInOpen(true)} className="btn-primary min-h-12 px-4 py-2">
            Walk-in
          </button>
        </div>
      </header>

      {endSessionOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-carbon/30"
            onClick={() => setEndSessionOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-fog bg-paper-white p-6 shadow-panel">
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
          </div>
        </div>
      )}

      <main className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto p-3 lg:border-r lg:border-fog">
          <FloorView
            selectedBookingId={selectedBookingId}
            onSelectBooking={(id) => setSelectedBookingId(id)}
            onPromptNoShow={(id) => setNoShowId(id)}
            onToast={(t) => setToast({ open: true, ...t })}
          />
        </div>

        {isWide && (
          <aside className="hidden w-full max-w-md shrink-0 overflow-hidden lg:flex lg:flex-col">
            <BookingDrawer variant="panel" {...bookingProps} />
          </aside>
        )}
      </main>

      {!isWide && selectedBookingId && <BookingDrawer variant="drawer" {...bookingProps} />}

      <ReassignBarberDrawer
        bookingId={reassignId}
        onClose={() => setReassignId(null)}
        onReassigned={() => {
          setReassignId(null)
          setToast({ open: true, kind: 'success', title: 'Reassigned', message: 'Barber updated.' })
        }}
      />

      <AddServiceDrawer
        bookingId={addServiceId}
        onClose={() => setAddServiceId(null)}
        onSaved={(hasWarning) => {
          const id = addServiceId
          setAddServiceId(null)
          setToast({
            open: true,
            kind: hasWarning ? 'info' : 'success',
            title: 'Service added',
            message: hasWarning ? 'Check overlap warning on booking.' : undefined,
          })
          if (id) setSelectedBookingId(id)
        }}
      />

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

      <PartyCheckInDrawer
        bookingId={partyCheckInId}
        onClose={() => setPartyCheckInId(null)}
        onConfirmed={() => {
          const id = partyCheckInId
          setPartyCheckInId(null)
          if (id) {
            setPartyAssignId(id)
            setToast({ open: true, kind: 'success', title: 'Party checked in', message: 'Assign chairs next.' })
          }
        }}
      />

      <PartyAssignDrawer
        bookingId={partyAssignId}
        onClose={() => setPartyAssignId(null)}
        onReadyForPayment={() => {
          const id = partyAssignId
          setPartyAssignId(null)
          if (id) setPaymentBookingId(id)
        }}
      />

      <PaymentDrawer
        bookingId={paymentBookingId}
        onClose={() => setPaymentBookingId(null)}
        onPaid={({ receiptUrl, total, method }) => {
          const customer = paymentBooking?.customer ?? 'Customer'
          const receiptRef = receiptUrl.split('/').pop() ?? 'RCPT'
          setPaymentBookingId(null)
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
    </div>
  )
}
