'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MotionOverlay } from '@/components/motion/MotionOverlay'
import {
  MANAGER_ACTING_ID,
  MANAGER_PIN,
  actingLabel,
  staffPinFor,
  type StaffMember,
} from '../data/mock'
import { useStore } from '../data/store'

function PinKeypad({
  digits,
  error,
  onDigit,
  onBackspace,
}: {
  digits: string
  error: boolean
  onDigit: (d: string) => void
  onBackspace: () => void
}) {
  return (
    <>
      <div className="mt-5 flex justify-center gap-2.5" aria-live="polite">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full border ${
              digits.length > i
                ? error
                  ? 'border-ember bg-ember'
                  : 'border-carbon bg-carbon'
                : 'border-fog bg-mist'
            }`}
          />
        ))}
      </div>
      {error && (
        <p className="mt-3 text-center text-xs font-medium text-ember">Wrong PIN — try again</p>
      )}
      <div className="mx-auto mt-6 grid w-fit grid-cols-3 gap-x-3 gap-y-2.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
          k === '' ? (
            <span key={`empty-${i}`} className="h-[3.25rem] w-[3.25rem]" />
          ) : (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (k === '⌫') onBackspace()
                else onDigit(k)
              }}
              className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full bg-mist text-xl font-medium text-carbon transition-transform active:scale-95"
            >
              {k}
            </button>
          ),
        )}
      </div>
    </>
  )
}

function usePinEntry({
  open,
  expectedPin,
  onCancel,
  onSuccess,
}: {
  open: boolean
  expectedPin: string
  onCancel: () => void
  onSuccess: () => void
}) {
  const [digits, setDigits] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (open) {
      setDigits('')
      setError(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
      if (/^\d$/.test(e.key) && digits.length < 4) {
        const next = digits + e.key
        setDigits(next)
        setError(false)
        if (next.length === 4) {
          if (next === expectedPin) onSuccess()
          else {
            setError(true)
            setDigits('')
          }
        }
      }
      if (e.key === 'Backspace') {
        setDigits((d) => d.slice(0, -1))
        setError(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [digits, expectedPin, onCancel, onSuccess, open])

  function press(d: string) {
    if (digits.length >= 4) return
    const next = digits + d
    setDigits(next)
    setError(false)
    if (next.length === 4) {
      window.setTimeout(() => {
        if (next === expectedPin) onSuccess()
        else {
          setError(true)
          setDigits('')
        }
      }, 80)
    }
  }

  return {
    digits,
    error,
    onDigit: press,
    onBackspace: () => {
      setDigits((d) => d.slice(0, -1))
      setError(false)
    },
  }
}

export function ManagerPinSheet({
  open,
  onCancel,
  onSuccess,
}: {
  open: boolean
  onCancel: () => void
  onSuccess: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const pin = usePinEntry({ open, expectedPin: MANAGER_PIN, onCancel, onSuccess })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <MotionOverlay
      open={open}
      onClose={onCancel}
      variant="modal"
      zClass="z-[90]"
      backdropClassName="bg-carbon/35"
      panelClassName="w-full max-w-xs rounded-lg border border-fog bg-paper-white p-6 shadow-panel"
      aria-labelledby="manager-pin-title"
    >
      <p className="text-center text-[10px] font-medium uppercase tracking-ui text-ash">Manager</p>
      <h2
        id="manager-pin-title"
        className="font-display mt-1 text-center text-lg font-medium tracking-ui text-carbon"
      >
        Enter PIN
      </h2>
      <p className="mt-1 text-center text-xs text-ash">Demo PIN · {MANAGER_PIN}</p>
      <PinKeypad {...pin} />
      <button
        type="button"
        onClick={onCancel}
        className="mt-5 w-full text-center text-sm font-medium text-graphite hover:text-carbon"
      >
        Cancel
      </button>
    </MotionOverlay>,
    document.body,
  )
}

function StartShiftPinSheet({
  open,
  barber,
  onCancel,
  onSuccess,
}: {
  open: boolean
  barber: StaffMember | null
  onCancel: () => void
  onSuccess: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const expectedPin = barber ? staffPinFor(barber.id) ?? '' : ''
  const pin = usePinEntry({
    open: open && !!barber,
    expectedPin,
    onCancel,
    onSuccess,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !barber) return null

  return createPortal(
    <MotionOverlay
      open={open}
      onClose={onCancel}
      variant="modal"
      zClass="z-[90]"
      backdropClassName="bg-carbon/35"
      panelClassName="w-full max-w-xs rounded-lg border border-fog bg-paper-white p-6 shadow-panel"
      aria-labelledby="start-shift-title"
    >
      <p className="text-center text-[10px] font-medium uppercase tracking-ui text-ash">Clock in</p>
      <h2
        id="start-shift-title"
        className="font-display mt-1 text-center text-lg font-medium tracking-ui text-carbon"
      >
        {barber.name}&apos;s PIN
      </h2>
      <p className="mt-1 text-center text-xs text-ash">
        Enter PIN to start shift · Demo {expectedPin}
      </p>
      <PinKeypad {...pin} />
      <button
        type="button"
        onClick={onCancel}
        className="mt-5 w-full text-center text-sm font-medium text-graphite hover:text-carbon"
      >
        Cancel
      </button>
    </MotionOverlay>,
    document.body,
  )
}

function statusLabel(onShift: boolean, onBreak: boolean) {
  if (!onShift) return 'Off shift'
  if (onBreak) return 'On break'
  return 'On floor'
}

export function BarberSwitcher({
  onActingChange,
  onShiftStarted,
}: {
  onActingChange?: (name: string) => void
  onShiftStarted?: (name: string) => void
}) {
  const { staff, lanes, actingStaffId, setActingStaffId, isOnShift, startShift } = useStore()
  const [rosterOpen, setRosterOpen] = useState(false)
  const [pendingStart, setPendingStart] = useState<StaffMember | null>(null)
  const holdTimer = useRef<number | null>(null)
  const holdFired = useRef(false)
  const rootRef = useRef<HTMLElement>(null)

  const isManager = actingStaffId === MANAGER_ACTING_ID
  const actingBarber = staff.find((s) => s.id === actingStaffId) ?? null
  const previewBarber =
    actingBarber ?? staff.find((s) => isOnShift(s.id)) ?? staff[0] ?? null

  useEffect(() => {
    if (!rosterOpen) return
    function onDoc(e: MouseEvent | PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setRosterOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setRosterOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [rosterOpen])

  const switchTo = (id: string) => {
    if (id === actingStaffId) return
    setActingStaffId(id)
    onActingChange?.(actingLabel(id, staff))
  }

  const handleBarberTap = (s: StaffMember) => {
    setRosterOpen(false)
    if (s.id === actingStaffId && isOnShift(s.id)) return
    if (!isOnShift(s.id)) {
      setPendingStart(s)
      return
    }
    switchTo(s.id)
  }

  const confirmStartShift = () => {
    if (!pendingStart) return
    const barber = pendingStart
    startShift(barber.id)
    setPendingStart(null)
    setActingStaffId(barber.id)
    onShiftStarted?.(barber.name)
  }

  const clearHold = () => {
    if (holdTimer.current != null) {
      window.clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }

  const toggleRoster = () => setRosterOpen((o) => !o)

  const actingOnShift = actingBarber ? isOnShift(actingBarber.id) : false
  const actingLane = actingBarber
    ? lanes.find((l) => l.staff.id === actingBarber.id)
    : undefined
  const actingOnBreak = actingLane?.staffStatus === 'break'

  return (
    <>
      <header ref={rootRef} className="relative z-20 flex shrink-0 items-center">
        <button
          type="button"
          onClick={() => {
            if (holdFired.current) {
              holdFired.current = false
              return
            }
            toggleRoster()
          }}
          onPointerDown={() => {
            holdFired.current = false
            clearHold()
            holdTimer.current = window.setTimeout(() => {
              holdFired.current = true
              setRosterOpen(true)
            }, 420)
          }}
          onPointerUp={clearHold}
          onPointerLeave={clearHold}
          onPointerCancel={clearHold}
          className="-ml-1.5 flex min-h-11 min-w-0 items-center gap-2.5 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-mist/70 active:bg-mist"
          aria-haspopup="listbox"
          aria-expanded={rosterOpen}
          aria-label={
            isManager
              ? 'Open barber roster'
              : `Acting as ${previewBarber?.name ?? 'barber'} — open roster`
          }
        >
          {previewBarber ? (
            <span
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                isManager || !actingOnShift ? 'bg-fog text-ash' : previewBarber.headerClass
              }`}
            >
              {previewBarber.name.charAt(0)}
              {!isManager && actingBarber && !actingOnShift && (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-ash/50 ring-2 ring-[var(--pos-canvas-soft)]"
                  aria-hidden
                />
              )}
              {!isManager && actingOnShift && actingOnBreak && (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber ring-2 ring-[var(--pos-canvas-soft)]"
                  aria-hidden
                />
              )}
            </span>
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fog text-xs font-semibold text-ash">
              ?
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-carbon">
              {isManager ? 'Staff' : (previewBarber?.name ?? 'Barber')}
            </span>
            <span className="block truncate text-[10px] text-ash">
              {isManager
                ? 'Tap to switch barber'
                : actingBarber
                  ? statusLabel(actingOnShift, !!actingOnBreak)
                  : 'Select barber'}
            </span>
          </span>
          <svg
            viewBox="0 0 16 16"
            className={`ml-0.5 h-3.5 w-3.5 shrink-0 text-ash transition-transform ${
              rosterOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
          >
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {rosterOpen ? (
          <div
            role="listbox"
            aria-label="Barbers"
            className="absolute inset-x-0 top-full z-30 mt-1 rounded-lg border border-fog bg-paper-white p-3 shadow-panel"
          >
            <div className="flex flex-wrap gap-2">
              {staff.map((s) => {
                const lane = lanes.find((l) => l.staff.id === s.id)
                const status = lane?.staffStatus ?? 'available'
                const onShift = isOnShift(s.id)
                const onBreak = status === 'break'
                const active = s.id === actingStaffId

                return (
                  <button
                    key={s.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => handleBarberTap(s)}
                    title={
                      !onShift
                        ? `${s.name} · Off shift`
                        : onBreak
                          ? `${s.name} · On break`
                          : s.name
                    }
                    className={`flex min-w-[4.5rem] flex-1 basis-[4.5rem] flex-col items-center gap-1.5 rounded-md px-2 py-2 transition-colors hover:bg-mist ${
                      active ? 'bg-mist' : ''
                    }`}
                  >
                    <span
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                        !onShift ? 'bg-fog text-ash grayscale' : s.headerClass
                      } ${active ? 'ring-2 ring-carbon/20 ring-offset-2 ring-offset-paper-white' : ''}`}
                    >
                      {s.name.charAt(0)}
                      {!onShift && (
                        <span
                          className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-ash/50 ring-2 ring-paper-white"
                          aria-hidden
                        />
                      )}
                      {onShift && onBreak && (
                        <span
                          className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber ring-2 ring-paper-white"
                          aria-hidden
                        />
                      )}
                    </span>
                    <span className="w-full truncate text-center text-[11px] font-medium text-graphite">
                      {s.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
      </header>

      <StartShiftPinSheet
        open={!!pendingStart}
        barber={pendingStart}
        onCancel={() => setPendingStart(null)}
        onSuccess={confirmStartShift}
      />
    </>
  )
}
