import { useEffect, useMemo, useState } from 'react'
import {
  calendarToday,
  serviceOptions,
  type BookingSource,
  type VerticalLabels,
} from '../data/mock'
import { useBookings } from '../data/bookingsStore'
import type { NewBookingDefaults, NewBookingInput } from '../data/bookingsStore'
import { IconX } from './icons'

type NewBookingDrawerProps = {
  open: boolean
  vertical: VerticalLabels
  defaults?: NewBookingDefaults
  editBookingId?: string
  onClose: () => void
  onSubmit: (input: NewBookingInput) => void
  onUpdate?: (params: {
    bookingId: string
    staffName: string
    date: string
    startMinutes: number
    serviceId: string
  }) => void
}

const sourceOptions: { id: BookingSource; label: string }[] = [
  { id: 'walk-in', label: 'Walk-in' },
  { id: 'phone', label: 'Phone' },
  { id: 'online', label: 'Online' },
]

function generateTimeSlots() {
  const slots: { label: string; minutes: number }[] = []
  for (let m = 9 * 60; m <= 19 * 60 + 30; m += 30) {
    const h = Math.floor(m / 60)
    const min = m % 60
    const period = h < 12 ? 'am' : 'pm'
    const displayH = h % 12 || 12
    slots.push({
      label: `${displayH}:${String(min).padStart(2, '0')}${period}`,
      minutes: m,
    })
  }
  return slots
}

const timeSlots = generateTimeSlots()

function emptyForm(defaults?: NewBookingDefaults) {
  return {
    customer: defaults?.customer ?? '',
    phone: defaults?.phone ?? '',
    serviceId: defaults?.serviceId ?? serviceOptions[0].id,
    staffName: defaults?.staffName ?? '',
    date: defaults?.date ?? calendarToday,
    startMinutes: defaults?.startMinutes ?? 11 * 60,
    source: defaults?.source ?? ('walk-in' as BookingSource),
    notes: defaults?.notes ?? '',
  }
}

export function NewBookingDrawer({
  open,
  vertical,
  defaults,
  editBookingId,
  onClose,
  onSubmit,
  onUpdate,
}: NewBookingDrawerProps) {
  const { staff, findBookingConflict, suggestNextAvailableStart, findAnyAvailableStaffId } =
    useBookings()
  const [form, setForm] = useState(() => emptyForm(defaults))

  useEffect(() => {
    if (!open) return
    const base = emptyForm(defaults)
    setForm({
      ...base,
      staffName: base.staffName || defaults?.staffName || staff[0]?.name || 'Anyone',
    })
  }, [open, defaults, staff])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const selectedService = useMemo(
    () => serviceOptions.find((s) => s.id === form.serviceId) ?? serviceOptions[0],
    [form.serviceId],
  )

  const staffChoices = useMemo(() => [...staff.map((s) => s.name), 'Anyone'], [staff])

  const selectedStaffId = useMemo(() => {
    if (form.staffName === 'Anyone') return null
    return staff.find((s) => s.name === form.staffName)?.id ?? null
  }, [form.staffName, staff])

  const anyoneAssignedStaffId = useMemo(() => {
    if (form.staffName !== 'Anyone') return null
    return findAnyAvailableStaffId({
      date: form.date,
      startMinutes: form.startMinutes,
      durationMinutes: selectedService.durationMinutes,
    })
  }, [findAnyAvailableStaffId, form.date, form.staffName, form.startMinutes, selectedService.durationMinutes])

  const anyoneAssignedStaffName = useMemo(() => {
    if (!anyoneAssignedStaffId) return null
    return staff.find((s) => s.id === anyoneAssignedStaffId)?.name ?? null
  }, [anyoneAssignedStaffId, staff])

  const conflict = useMemo(() => {
    if (!selectedStaffId) return null
    return findBookingConflict({
      staffId: selectedStaffId,
      date: form.date,
      startMinutes: form.startMinutes,
      durationMinutes: selectedService.durationMinutes,
      ignoreBookingId: editBookingId,
    })
  }, [
    findBookingConflict,
    form.date,
    form.startMinutes,
    selectedService.durationMinutes,
    selectedStaffId,
    editBookingId,
  ])

  const suggestedStart = useMemo(() => {
    if (!conflict || !selectedStaffId) return null
    return suggestNextAvailableStart({
      staffId: selectedStaffId,
      date: form.date,
      startMinutes: form.startMinutes,
      durationMinutes: selectedService.durationMinutes,
    })
  }, [
    conflict,
    selectedStaffId,
    suggestNextAvailableStart,
    form.date,
    form.startMinutes,
    selectedService.durationMinutes,
  ])

  const canAssignAnyone = form.staffName !== 'Anyone' || anyoneAssignedStaffId !== null

  if (!open) return null

  const canSubmit = form.customer.trim().length > 0 && !conflict && canAssignAnyone

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    if (editBookingId && onUpdate) {
      onUpdate({
        bookingId: editBookingId,
        staffName: form.staffName,
        date: form.date,
        startMinutes: form.startMinutes,
        serviceId: form.serviceId,
      })
      return
    }
    onSubmit({
      customer: form.customer.trim(),
      phone: form.phone.trim(),
      serviceId: form.serviceId,
      staffName: form.staffName,
      date: form.date,
      startMinutes: form.startMinutes,
      source: form.source,
      notes: form.notes.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-carbon/20"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-fog bg-paper-white shadow-[rgba(0,0,0,0.08)_0px_8px_24px_0px]">
        <header className="flex items-start justify-between gap-3 border-b border-fog px-5 py-4">
          <div>
            <p className="text-xs font-medium tracking-ui text-sky">
              {editBookingId ? 'Reschedule' : 'New booking'}
            </p>
            <h2 className="font-display mt-1 text-lg font-medium tracking-ui text-carbon">
              {editBookingId ? 'Edit appointment' : 'Book an appointment'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ash transition-colors hover:bg-mist hover:text-carbon"
          >
            <IconX className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            <fieldset className="space-y-3">
              <legend className="text-xs font-medium uppercase tracking-ui text-ash">
                Customer
              </legend>
              <label className="block">
                <span className="mb-1 block text-xs text-ash">Name</span>
                <input
                  type="text"
                  value={form.customer}
                  onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))}
                  placeholder="Customer name"
                  className="w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
                  autoFocus
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-ash">Phone</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+60 12-345 6789"
                  className="w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
                />
              </label>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-xs font-medium uppercase tracking-ui text-ash">
                Service
              </legend>
              <label className="block">
                <span className="mb-1 block text-xs text-ash">Service</span>
                <select
                  value={form.serviceId}
                  onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))}
                  className="w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
                >
                  {serviceOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} · {s.durationMinutes} min · RM {s.price}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-ash">{vertical.staffSingular}</span>
                <select
                  value={form.staffName}
                  onChange={(e) => setForm((f) => ({ ...f, staffName: e.target.value }))}
                  className="w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
                >
                  {staffChoices.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-xs font-medium uppercase tracking-ui text-ash">
                Schedule
              </legend>
              <label className="block">
                <span className="mb-1 block text-xs text-ash">Date</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-ash">Time</span>
                <select
                  value={form.startMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startMinutes: Number(e.target.value) }))
                  }
                  className="w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot.minutes} value={slot.minutes}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </label>

              {conflict && (
                <div className="rounded-xl border border-ember/20 bg-[#fff7f5] px-4 py-3">
                  <p className="text-sm font-medium text-carbon">Time conflict</p>
                  <p className="mt-0.5 text-xs text-ash">
                    {form.staffName} already has{' '}
                    <span className="font-medium text-carbon">
                      {conflict.conflictingBooking.customer}
                    </span>{' '}
                    at this time.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestedStart !== null && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, startMinutes: suggestedStart }))}
                        className="rounded-full bg-carbon px-3 py-1.5 text-xs font-medium text-paper-white transition-colors hover:bg-carbon/90"
                      >
                        Move to next slot
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, staffName: 'Anyone' }))}
                      className="rounded-full bg-mist px-3 py-1.5 text-xs font-medium text-graphite transition-colors hover:bg-fog"
                    >
                      Assign anyone
                    </button>
                  </div>
                </div>
              )}

              {form.staffName === 'Anyone' && (
                <div
                  className={[
                    'rounded-xl border px-4 py-3',
                    anyoneAssignedStaffName ? 'border-fog bg-linen' : 'border-ember/20 bg-[#fff7f5]',
                  ].join(' ')}
                >
                  <p className="text-sm font-medium text-carbon">Auto-assign</p>
                  {anyoneAssignedStaffName ? (
                    <p className="mt-0.5 text-xs text-ash">
                      Will assign to{' '}
                      <span className="font-medium text-carbon">{anyoneAssignedStaffName}</span>
                      {' '}for this slot.
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-ash">
                      No staff available for this time. Pick a different time or choose a specific {vertical.staffSingular.toLowerCase()}.
                    </p>
                  )}
                </div>
              )}
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-xs font-medium uppercase tracking-ui text-ash">
                Details
              </legend>
              <div>
                <span className="mb-2 block text-xs text-ash">Source</span>
                <div className="flex flex-wrap gap-2">
                  {sourceOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, source: opt.id }))}
                      className={[
                        'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                        form.source === opt.id
                          ? 'bg-carbon text-paper-white'
                          : 'bg-mist text-graphite hover:bg-fog',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs text-ash">Notes</span>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional — preferences, allergies, etc."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
                />
              </label>
            </fieldset>

            <div className="rounded-xl border border-fog bg-linen px-4 py-3">
              <p className="text-xs text-ash">Quoted</p>
              <p className="font-display text-lg font-medium tracking-ui text-carbon">
                RM {selectedService.price}
              </p>
              <p className="mt-0.5 text-xs text-ash">
                {selectedService.durationMinutes} min · {form.staffName}
              </p>
              {form.staffName === 'Anyone' && !conflict && anyoneAssignedStaffName && (
                <p className="mt-1 text-[11px] text-ash">
                  Assigned to {anyoneAssignedStaffName}.
                </p>
              )}
            </div>
          </div>

          <footer className="flex gap-2 border-t border-fog px-5 py-4">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 px-4 py-2">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-primary flex-1 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editBookingId ? 'Save changes' : 'Create booking'}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  )
}
