import { useMemo, useState } from 'react'
import { Shell } from './components/Shell'
import { Dashboard } from './components/Dashboard'
import { Calendar } from './components/Calendar'
import { Transactions } from './components/Transactions'
import { BookingsList } from './components/BookingsList'
import { StaffScreen } from './components/StaffScreen'
import { QueueView } from './components/QueueView'
import { BookingDetailDrawer } from './components/BookingDetailDrawer'
import { NewBookingDrawer } from './components/NewBookingDrawer'
import { PrototypeBar } from './components/PrototypeBar'
import { TransactionDetailDrawer } from './components/TransactionDetailDrawer'
import { Toast, type ToastState } from './components/Toast'
import { BookingsProvider, useBookings, type NewBookingDefaults } from './data/bookingsStore'
import { serviceOptions, verticals, type BookingRecord, type PortalScreen, type VerticalId } from './data/mock'

function serviceIdFromLabel(label: string) {
  return serviceOptions.find((s) => s.label === label)?.id ?? serviceOptions[0].id
}

function PortalApp() {
  const [verticalId, setVerticalId] = useState<VerticalId>('barbershop')
  const [screen, setScreen] = useState<PortalScreen>('dashboard')
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null)
  const [newBookingOpen, setNewBookingOpen] = useState(false)
  const [newBookingDefaults, setNewBookingDefaults] = useState<NewBookingDefaults | undefined>()
  const [editBookingId, setEditBookingId] = useState<string | undefined>()
  const [calendarDate, setCalendarDate] = useState<string | undefined>()
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | undefined>()
  const [toast, setToast] = useState<ToastState>({
    open: false,
    kind: 'success',
    title: '',
  })

  const {
    events,
    demoNowMinutes,
    setDemoNowMinutes,
    getRecordById,
    updateStatus,
    completeWithPayment,
    getReceiptTransactionId,
    transactions,
    addBooking,
    updateBooking,
    refundTransaction,
  } = useBookings()

  const vertical = verticals[verticalId]

  const selectedRecord = useMemo(() => {
    if (!selectedBooking) return null
    return getRecordById(selectedBooking.id) ?? selectedBooking
  }, [selectedBooking, getRecordById, events])

  function openNewBooking(defaults?: NewBookingDefaults) {
    setNewBookingDefaults(defaults)
    setEditBookingId(undefined)
    setNewBookingOpen(true)
  }

  function refreshSelected(id: string) {
    const updated = getRecordById(id)
    if (updated) setSelectedBooking(updated)
  }

  function handleAddBooking(input: Parameters<typeof addBooking>[0]) {
    const record = addBooking(input)
    setNewBookingOpen(false)
    setNewBookingDefaults(undefined)
    setSelectedBooking(record)
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-linen">
      <PrototypeBar
        verticalId={verticalId}
        onVerticalChange={setVerticalId}
        demoNowMinutes={demoNowMinutes}
        onDemoNowMinutesChange={setDemoNowMinutes}
      />
      <Shell
        businessName={vertical.businessName}
        staffLabel={vertical.staffPlural}
        activeScreen={screen}
        onNavigate={setScreen}
      >
        {screen === 'dashboard' && (
          <Dashboard
            vertical={vertical}
            onSelectBooking={setSelectedBooking}
            onViewAllBookings={() => setScreen('bookings')}
            onNewBooking={() => openNewBooking()}
            onOpenCounter={() => setScreen('queue')}
            onManageStaff={() => setScreen('staff')}
          />
        )}
        {screen === 'calendar' && (
          <Calendar
            vertical={vertical}
            onSelectBooking={setSelectedBooking}
            onNewBooking={(date) => openNewBooking({ date })}
            onDateChange={setCalendarDate}
          />
        )}
        {screen === 'bookings' && (
          <BookingsList
            vertical={vertical}
            onSelectBooking={setSelectedBooking}
            onNewBooking={() => openNewBooking()}
          />
        )}
        {screen === 'staff' && (
          <StaffScreen vertical={vertical} onSelectBooking={setSelectedBooking} />
        )}
        {screen === 'queue' && (
          <QueueView
            onSelectBooking={setSelectedBooking}
            onStartService={(id) => {
              updateStatus(id, 'in-service')
              setToast({
                open: true,
                kind: 'success',
                title: 'Added to barber list',
                message: 'Moved to “Now serving”.',
              })
            }}
          />
        )}
        {screen === 'payments' && (
          <Transactions
            selectedTransactionId={selectedTransactionId}
            onSelectTransaction={(id) => setSelectedTransactionId(id)}
          />
        )}
      </Shell>

      <BookingDetailDrawer
        booking={selectedRecord}
        onClose={() => setSelectedBooking(null)}
        onCheckIn={(id) => {
          updateStatus(id, 'checked-in')
          refreshSelected(id)
        }}
        onStartService={(id) => {
          updateStatus(id, 'in-service')
          refreshSelected(id)
        }}
        onMarkNoShow={(id) => updateStatus(id, 'no-show')}
        onComplete={(id, method) => {
          const txnId = completeWithPayment(id, method)
          if (txnId) setSelectedTransactionId(txnId)
        }}
        onRebook={(booking) => {
          openNewBooking({
            customer: booking.customer,
            phone: booking.phone !== '—' ? booking.phone : '',
            serviceId: serviceIdFromLabel(booking.services),
            staffName: booking.staffName,
            date: calendarDate ?? booking.date,
            startMinutes: booking.startMinutes,
            source: booking.source,
            notes: booking.notes,
          })
        }}
        onReschedule={(booking) => {
          setEditBookingId(booking.id)
          setNewBookingDefaults({
            customer: booking.customer,
            phone: booking.phone !== '—' ? booking.phone : '',
            serviceId: serviceIdFromLabel(booking.services),
            staffName: booking.staffName,
            date: booking.date,
            startMinutes: booking.startMinutes,
            source: booking.source,
            notes: booking.notes,
          })
          setNewBookingOpen(true)
        }}
        onViewReceipt={(bookingId) => {
          setSelectedTransactionId(getReceiptTransactionId(bookingId) ?? undefined)
          setScreen('payments')
        }}
      />

      <TransactionDetailDrawer
        transaction={
          selectedTransactionId
            ? transactions.find((t) => t.id === selectedTransactionId) ?? null
            : null
        }
        onClose={() => setSelectedTransactionId(undefined)}
        onRefund={(id) => {
          refundTransaction(id)
          setToast({
            open: true,
            kind: 'success',
            title: 'Refunded',
            message: 'Transaction marked as refunded.',
          })
        }}
      />

      <Toast
        toast={toast}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      <NewBookingDrawer
        open={newBookingOpen}
        vertical={vertical}
        defaults={newBookingDefaults}
        editBookingId={editBookingId}
        onClose={() => {
          setNewBookingOpen(false)
          setNewBookingDefaults(undefined)
          setEditBookingId(undefined)
        }}
        onSubmit={handleAddBooking}
        onUpdate={({ bookingId, staffName, date, startMinutes, serviceId }) => {
          updateBooking({ bookingId, staffName, date, startMinutes, serviceId })
          setNewBookingOpen(false)
          setNewBookingDefaults(undefined)
          setEditBookingId(undefined)
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <BookingsProvider>
      <PortalApp />
    </BookingsProvider>
  )
}
