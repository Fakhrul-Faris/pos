import { useState } from 'react'
import './App.css'
import { AddServiceDrawer } from './components/AddServiceDrawer'
import { BarberSwitcher } from './components/BarberSwitcher'
import { BookingDrawer } from './components/BookingDrawer'
import { FloorView } from './components/FloorView'
import { LoginScreen } from './components/LoginScreen'
import { NoShowConfirmModal } from './components/NoShowConfirmModal'
import { OfflineBanner } from './components/OfflineBanner'
import { PartyAssignDrawer } from './components/PartyAssignDrawer'
import { PartyCheckInDrawer } from './components/PartyCheckInDrawer'
import { PaymentDrawer } from './components/PaymentDrawer'
import { ReceiptSuccessDrawer } from './components/ReceiptSuccessDrawer'
import { ReassignBarberDrawer } from './components/ReassignBarberDrawer'
import { SearchModal } from './components/SearchModal'
import { StatsDrawer } from './components/StatsDrawer'
import { Toast, type ToastState } from './components/Toast'
import { WalkInDrawer } from './components/WalkInDrawer'
import type { PaymentMethod } from './data/mock'
import { StoreProvider, useStore } from './data/store'

type ReceiptState = {
  customer: string
  total: number
  method: PaymentMethod
  receiptUrl: string
}

function PosApp() {
  const { loggedIn, logout, setOffline, isOffline, getBookingById } = useStore()
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
  const [receipt, setReceipt] = useState<ReceiptState | null>(null)
  const [toast, setToast] = useState<ToastState>({ open: false, kind: 'success', title: '' })

  if (!loggedIn) return <LoginScreen />

  const paymentBooking = paymentBookingId ? getBookingById(paymentBookingId) : null

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-linen">
      <OfflineBanner />

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-fog bg-paper-white px-5 py-3">
        <div>
          <p className="text-xs font-medium tracking-ui text-ash">Staff POS · Hafiz Cuts</p>
          <h1 className="font-display mt-0.5 text-lg font-medium tracking-ui text-carbon">Today</h1>
        </div>
        <BarberSwitcher />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOffline(!isOffline)}
            className={`btn-ghost px-3 py-2 text-xs ${isOffline ? 'text-amber' : ''}`}
            title="Toggle offline mode (prototype)"
          >
            {isOffline ? 'Offline' : 'Online'}
          </button>
          <button type="button" onClick={() => setStatsOpen(true)} className="btn-ghost px-4 py-2">
            My day
          </button>
          <button type="button" onClick={() => setSearchOpen(true)} className="btn-ghost px-4 py-2">
            Search
          </button>
          <button type="button" onClick={() => setWalkInOpen(true)} className="btn-primary px-4 py-2">
            Walk-in
          </button>
          <button type="button" onClick={logout} className="btn-ghost px-3 py-2 text-xs text-ash">
            End session
          </button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 items-stretch justify-center overflow-y-auto p-3">
        <FloorView onSelectBooking={(id) => setSelectedBookingId(id)} />
      </main>

      <BookingDrawer
        bookingId={selectedBookingId}
        onClose={() => setSelectedBookingId(null)}
        onToast={(t) => setToast({ open: true, ...t })}
        onOpenReassign={(id) => {
          setSelectedBookingId(null)
          setReassignId(id)
        }}
        onOpenAddService={(id) => {
          setSelectedBookingId(null)
          setAddServiceId(id)
        }}
        onOpenNoShow={(id) => setNoShowId(id)}
        onOpenPartyCheckIn={(id) => {
          setSelectedBookingId(null)
          setPartyCheckInId(id)
        }}
        onOpenPartyAssign={(id) => {
          setSelectedBookingId(null)
          setPartyAssignId(id)
        }}
        onOpenPayment={(id) => {
          setSelectedBookingId(null)
          setPaymentBookingId(id)
        }}
      />

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
          setAddServiceId(null)
          setToast({
            open: true,
            kind: hasWarning ? 'info' : 'success',
            title: 'Service added',
            message: hasWarning ? 'Check overlap warning on booking.' : undefined,
          })
          if (addServiceId) setSelectedBookingId(addServiceId)
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
          setPaymentBookingId(null)
          setReceipt({ customer, total, method, receiptUrl })
        }}
      />

      <ReceiptSuccessDrawer
        open={!!receipt}
        customer={receipt?.customer ?? ''}
        total={receipt?.total ?? 0}
        method={receipt?.method ?? 'cash'}
        receiptUrl={receipt?.receiptUrl ?? ''}
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

export default function App() {
  return (
    <StoreProvider>
      <PosApp />
    </StoreProvider>
  )
}
